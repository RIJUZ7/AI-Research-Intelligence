import { getGeminiClient, EMBEDDING_MODEL } from './gemini.js';
import { DocumentChunk } from './types.js';

// In-memory cache for text embeddings
const embeddingCache = new Map<string, number[]>();

/**
 * Generate 768-dim pseudo-vector via deterministic hashing & character n-grams
 * used for fallback when GEMINI_API_KEY is not configured or in offline test mode.
 */
function generateFallbackEmbedding(text: string, dimensions = 768): number[] {
  const vector = new Array(dimensions).fill(0);
  const clean = text.toLowerCase();
  
  // Word & 3-gram hashing
  const words = clean.split(/\W+/).filter(w => w.length > 2);
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    let h = 0;
    for (let c = 0; c < word.length; c++) {
      h = (h << 5) - h + word.charCodeAt(c);
      h |= 0;
    }
    const idx = Math.abs(h) % dimensions;
    vector[idx] += 1.0;

    // Word pairs for local phrase semantics
    if (i < words.length - 1) {
      const pair = word + '_' + words[i + 1];
      let hPair = 0;
      for (let c = 0; c < pair.length; c++) {
        hPair = (hPair << 5) - hPair + pair.charCodeAt(c);
        hPair |= 0;
      }
      const pairIdx = Math.abs(hPair) % dimensions;
      vector[pairIdx] += 1.5;
    }
  }

  // Normalize to unit vector
  let norm = 0;
  for (let v of vector) norm += v * v;
  norm = Math.sqrt(norm);
  if (norm > 0) {
    for (let i = 0; i < dimensions; i++) {
      vector[i] /= norm;
    }
  }
  return vector;
}

export async function embedText(text: string): Promise<{ embedding: number[]; provider: 'gemini' | 'local_fallback' }> {
  const cached = embeddingCache.get(text);
  if (cached) {
    return { embedding: cached, provider: 'gemini' };
  }

  const ai = getGeminiClient();
  if (ai) {
    try {
      const response = await ai.models.embedContent({
        model: EMBEDDING_MODEL,
        contents: text,
      });

      const resAny = response as any;
      const values: number[] | undefined = resAny.embedding?.values || resAny.embeddings?.[0]?.values;
      if (values && values.length > 0) {
        embeddingCache.set(text, values);
        return { embedding: values, provider: 'gemini' };
      }
    } catch (err) {
      console.warn('Gemini embedding call failed, using deterministic local embedding vector:', err);
    }
  }

  const fallback = generateFallbackEmbedding(text);
  embeddingCache.set(text, fallback);
  return { embedding: fallback, provider: 'local_fallback' };
}

export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length || vecA.length === 0) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// BM25 term frequency calculation
function computeBM25Scores(query: string, chunks: DocumentChunk[]): Map<string, number> {
  const scores = new Map<string, number>();
  const queryTerms = query.toLowerCase().split(/\W+/).filter(t => t.length > 1);
  if (queryTerms.length === 0 || chunks.length === 0) {
    chunks.forEach(c => scores.set(c.id, 0));
    return scores;
  }

  const N = chunks.length;
  let avgDl = 0;
  const chunkTerms = new Map<string, string[]>();

  for (const chunk of chunks) {
    const terms = chunk.content.toLowerCase().split(/\W+/).filter(t => t.length > 1);
    chunkTerms.set(chunk.id, terms);
    avgDl += terms.length;
  }
  avgDl = avgDl / N || 1;

  // Document frequencies for query terms
  const df = new Map<string, number>();
  for (const term of queryTerms) {
    let count = 0;
    for (const chunk of chunks) {
      const terms = chunkTerms.get(chunk.id) || [];
      if (terms.includes(term)) count++;
    }
    df.set(term, count);
  }

  const k1 = 1.5;
  const b = 0.75;

  let maxScore = 0;
  for (const chunk of chunks) {
    const terms = chunkTerms.get(chunk.id) || [];
    const dl = terms.length;
    let score = 0;

    for (const term of queryTerms) {
      const termCount = terms.filter(t => t === term).length;
      if (termCount === 0) continue;

      const docFreq = df.get(term) || 0;
      const idf = Math.log((N - docFreq + 0.5) / (docFreq + 0.5) + 1);
      const tf = (termCount * (k1 + 1)) / (termCount + k1 * (1 - b + b * (dl / avgDl)));
      score += idf * tf;
    }

    scores.set(chunk.id, score);
    if (score > maxScore) maxScore = score;
  }

  // Normalize BM25 scores between 0 and 1
  if (maxScore > 0) {
    for (const [id, s] of scores.entries()) {
      scores.set(id, s / maxScore);
    }
  }

  return scores;
}

export interface ScoredChunk {
  chunk: DocumentChunk;
  score: number;
  semanticScore: number;
  bm25Score: number;
}

export async function retrieveRelevantChunks(
  query: string,
  chunks: DocumentChunk[],
  options: {
    topK?: number;
    minScore?: number;
    alpha?: number; // 0.7 semantic, 0.3 lexical
  } = {}
): Promise<ScoredChunk[]> {
  const topK = options.topK || 6;
  const minScore = options.minScore || 0.15;
  const alpha = options.alpha !== undefined ? options.alpha : 0.75;

  if (chunks.length === 0 || !query.trim()) {
    return [];
  }

  // 1. Generate query embedding
  const { embedding: queryEmbedding } = await embedText(query);

  // 2. Compute BM25 scores across corpus
  const bm25Map = computeBM25Scores(query, chunks);

  // 3. Compute cosine similarity & combine
  const scoredList: ScoredChunk[] = [];

  for (const chunk of chunks) {
    let semanticScore = 0;
    if (chunk.embedding && chunk.embedding.length > 0) {
      semanticScore = Math.max(0, cosineSimilarity(queryEmbedding, chunk.embedding));
    }
    const bm25Score = bm25Map.get(chunk.id) || 0;
    const hybridScore = alpha * semanticScore + (1 - alpha) * bm25Score;

    if (hybridScore >= minScore) {
      scoredList.push({
        chunk,
        score: Number(hybridScore.toFixed(4)),
        semanticScore: Number(semanticScore.toFixed(4)),
        bm25Score: Number(bm25Score.toFixed(4)),
      });
    }
  }

  // Sort by hybrid score descending
  scoredList.sort((a, b) => b.score - a.score);

  return scoredList.slice(0, topK);
}
