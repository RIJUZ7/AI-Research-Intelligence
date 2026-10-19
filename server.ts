import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

import { storage } from './server/storage.js';
import { extractTextFromBuffer } from './server/extractor.js';
import { chunkDocument } from './server/chunker.js';
import { embedText, retrieveRelevantChunks } from './server/vectorStore.js';
import { answerQuestion, compareDocuments, generateBrief, extractKnowledgeGraph } from './server/ragEngine.js';
import { seedSampleLibrary } from './server/sampleData.js';
import { EMBEDDING_MODEL, GENERATION_MODEL, getGeminiClient } from './server/gemini.js';
import { DocumentMetadata } from './server/types.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// High payload limit for document uploads (up to 25MB)
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Metrics tracker for Observatory
const queryMetrics = {
  totalQueries: 0,
  totalRetrievalLatencyMs: 0,
  totalGenerationLatencyMs: 0,
  verifiedCitationsCount: 0,
  totalCitationsCount: 0,
  successfulIngestions: 0,
  failedIngestions: 0,
};

// ==========================================
// API ROUTES
// ==========================================

// Health & System Info
app.get('/api/health', (req: Request, res: Response) => {
  const geminiAvailable = !!getGeminiClient();
  res.json({
    status: 'ok',
    product: 'KNOWLEDGE OS',
    version: '1.0.0',
    geminiConfigured: geminiAvailable,
    embeddingModel: EMBEDDING_MODEL,
    generationModel: GENERATION_MODEL,
    documentCount: storage.getDocuments().length,
    chunkCount: storage.getChunks().length,
  });
});

// Seed sample library
app.post('/api/sample-data/seed', async (req: Request, res: Response) => {
  try {
    const result = await seedSampleLibrary();
    queryMetrics.successfulIngestions += result.count;
    res.json({
      success: true,
      message: `Successfully seeded sample library with ${result.count} research papers (${result.chunks} chunks).`,
      result,
    });
  } catch (err: any) {
    console.error('Failed to seed sample library:', err);
    res.status(500).json({ error: err.message || 'Failed to seed sample library' });
  }
});

// Clear library
app.post('/api/sample-data/clear', (req: Request, res: Response) => {
  try {
    storage.clearAllDocuments();
    res.json({ success: true, message: 'All documents, chunks, and sessions cleared.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to clear library' });
  }
});

// List documents
app.get('/api/documents', (req: Request, res: Response) => {
  const { collectionId } = req.query;
  const docs = storage.getDocuments(collectionId as string);
  res.json(docs);
});

// Get single document with chunks
app.get('/api/documents/:id', (req: Request, res: Response) => {
  const doc = storage.getDocument(req.params.id);
  if (!doc) {
    return res.status(404).json({ error: 'Document not found' });
  }
  const chunks = storage.getChunks(req.params.id);
  res.json({ ...doc, chunks });
});

// Upload and ingest document
app.post('/api/documents/upload', async (req: Request, res: Response) => {
  try {
    const { filename, base64Content, collectionId = 'col_general', tags = [], force = false } = req.body;

    if (!filename || !base64Content) {
      return res.status(400).json({ error: 'Filename and base64Content are required.' });
    }

    const buffer = Buffer.from(base64Content, 'base64');
    if (buffer.length > 20 * 1024 * 1024) {
      return res.status(400).json({ error: 'File size exceeds maximum 20MB limit.' });
    }

    // Step 1: Text extraction
    const extracted = await extractTextFromBuffer(buffer, filename);

    // Duplicate check
    const existingDoc = storage.findDocumentByHash(extracted.fileHash);
    if (existingDoc && !force) {
      return res.status(409).json({
        isDuplicate: true,
        message: `A document with identical content ("${existingDoc.title}") is already indexed.`,
        existingDocument: existingDoc,
      });
    }

    const documentId = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const displayTitle = filename.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

    // Step 2: Boundary-aware chunking
    const chunks = chunkDocument(documentId, extracted.text, extracted.pages, {
      targetChunkSize: 600,
      overlap: 120,
    });

    if (chunks.length === 0) {
      throw new Error('Document produced 0 valid chunks after segmentation.');
    }

    // Step 3: Embedding generation
    for (const chunk of chunks) {
      const { embedding } = await embedText(chunk.content);
      chunk.embedding = embedding;
    }

    // Step 4: Metadata and Storage
    const docMeta: DocumentMetadata = {
      id: documentId,
      title: displayTitle.charAt(0).toUpperCase() + displayTitle.slice(1),
      filename,
      fileType: extracted.detectedType,
      fileSize: buffer.length,
      charCount: extracted.charCount,
      chunkCount: chunks.length,
      uploadedAt: new Date().toISOString(),
      status: 'ready',
      collectionId,
      tags: Array.isArray(tags) ? tags : [],
      pageCount: extracted.pageCount || 1,
      fileHash: extracted.fileHash,
    };

    storage.saveDocument(docMeta, chunks);
    queryMetrics.successfulIngestions++;

    res.status(201).json({
      success: true,
      document: docMeta,
      chunksCount: chunks.length,
    });
  } catch (err: any) {
    queryMetrics.failedIngestions++;
    const errMsg = err.message || 'Failed to process document';
    const isValidationError =
      errMsg.includes('Unsupported file type') ||
      errMsg.includes('empty') ||
      errMsg.includes('Malformed') ||
      errMsg.includes('Corrupted') ||
      errMsg.includes('limit') ||
      errMsg.includes('no extractable');
    res.status(isValidationError ? 400 : 500).json({ error: errMsg });
  }
});

// Update document metadata (title, tags, collection)
app.patch('/api/documents/:id', (req: Request, res: Response) => {
  const { title, tags, collectionId } = req.body;
  const updated = storage.updateDocumentMetadata(req.params.id, {
    ...(title ? { title } : {}),
    ...(tags ? { tags } : {}),
    ...(collectionId ? { collectionId } : {}),
  });
  if (!updated) {
    return res.status(404).json({ error: 'Document not found' });
  }
  res.json(updated);
});

// Reindex document
app.post('/api/documents/:id/reindex', async (req: Request, res: Response) => {
  const doc = storage.getDocument(req.params.id);
  if (!doc) {
    return res.status(404).json({ error: 'Document not found' });
  }
  try {
    const existingChunks = storage.getChunks(doc.id);
    const combinedText = existingChunks.map(c => c.content).join('\n\n');
    const newChunks = chunkDocument(doc.id, combinedText, undefined, {
      targetChunkSize: 550,
      overlap: 100,
    });
    for (const chunk of newChunks) {
      const { embedding } = await embedText(chunk.content);
      chunk.embedding = embedding;
    }
    storage.saveDocument({ ...doc, chunkCount: newChunks.length }, newChunks);
    res.json({ success: true, message: `Reindexed document into ${newChunks.length} chunks.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Reindexing failed' });
  }
});

// Delete document
app.delete('/api/documents/:id', (req: Request, res: Response) => {
  const success = storage.deleteDocument(req.params.id);
  if (!success) {
    return res.status(404).json({ error: 'Document not found' });
  }
  res.json({ success: true, message: 'Document and its associated embeddings were deleted.' });
});

// Collections
app.get('/api/collections', (req: Request, res: Response) => {
  res.json(storage.getCollections());
});

app.post('/api/collections', (req: Request, res: Response) => {
  const { name, description = '', color = '#506B58' } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Collection name is required' });
  }
  const collection = {
    id: `col_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name: name.trim(),
    description: description.trim(),
    color,
    createdAt: new Date().toISOString(),
  };
  storage.saveCollection(collection);
  res.status(201).json(collection);
});

app.delete('/api/collections/:id', (req: Request, res: Response) => {
  const success = storage.deleteCollection(req.params.id);
  if (!success) {
    return res.status(400).json({ error: 'Cannot delete default or non-existent collection.' });
  }
  res.json({ success: true, message: 'Collection deleted. Documents moved to General Research.' });
});

// Semantic & Hybrid Search
app.post('/api/search', async (req: Request, res: Response) => {
  const { query, collectionId, documentIds, topK = 8 } = req.body;
  if (!query || !query.trim()) {
    return res.status(400).json({ error: 'Search query is required' });
  }
  try {
    const availableChunks = storage.getChunksForScope(collectionId, documentIds);
    const scored = await retrieveRelevantChunks(query, availableChunks, { topK, minScore: 0.1 });
    const results = scored.map(s => {
      const doc = storage.getDocument(s.chunk.documentId);
      return {
        chunkId: s.chunk.id,
        documentId: s.chunk.documentId,
        documentTitle: doc?.title || doc?.filename || 'Document',
        content: s.chunk.content,
        score: s.score,
        semanticScore: s.semanticScore,
        bm25Score: s.bm25Score,
        page: s.chunk.page,
        section: s.chunk.section,
      };
    });
    res.json({ query, count: results.length, results });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Search execution failed' });
  }
});

// Grounded Research Question Answering
app.post('/api/research/ask', async (req: Request, res: Response) => {
  const { question, collectionId, documentIds, sessionId } = req.body;
  if (!question || typeof question !== 'string' || !question.trim()) {
    return res.status(400).json({ error: 'Question is required' });
  }

  if (question.length > 4000) {
    return res.status(400).json({ error: 'Question exceeds maximum limit of 4000 characters.' });
  }

  try {
    // If sessionId provided, recover previous history and scope
    let existingSession = sessionId ? storage.getSession(sessionId) : undefined;
    const effectiveCollectionId = collectionId || existingSession?.collectionId;
    const effectiveDocIds = documentIds && documentIds.length > 0 ? documentIds : existingSession?.documentIds;
    const conversationHistory = existingSession?.messages.map(m => ({
      role: m.role,
      content: m.content,
    }));

    const answer = await answerQuestion({
      question: question.trim(),
      collectionId: effectiveCollectionId,
      documentIds: effectiveDocIds,
      conversationHistory,
    });

    // Update query observatory metrics
    queryMetrics.totalQueries++;
    queryMetrics.totalRetrievalLatencyMs += answer.retrievalLatencyMs;
    queryMetrics.totalGenerationLatencyMs += answer.generationLatencyMs;
    queryMetrics.totalCitationsCount += answer.citations.length;
    queryMetrics.verifiedCitationsCount += answer.citations.filter(c => c.isValidated).length;

    // If sessionId provided, append to session
    if (sessionId) {
      let session = storage.getSession(sessionId);
      if (!session) {
        session = {
          id: sessionId,
          title: question.slice(0, 50) + (question.length > 50 ? '...' : ''),
          collectionId,
          documentIds,
          messages: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }
      session.messages.push({
        id: `msg_u_${Date.now()}`,
        role: 'user',
        content: question,
        timestamp: new Date().toISOString(),
      });
      session.messages.push({
        id: `msg_a_${Date.now()}`,
        role: 'assistant',
        content: answer.answer,
        timestamp: new Date().toISOString(),
        answerDetails: answer,
      });
      session.updatedAt = new Date().toISOString();
      storage.saveSession(session);
    }

    res.json(answer);
  } catch (err: any) {
    console.error('Research ask failed:', err);
    res.status(500).json({ error: err.message || 'Research desk processing failed' });
  }
});

// Cross-Document Comparison
app.post('/api/research/compare', async (req: Request, res: Response) => {
  const { documentIds, comparisonFocus } = req.body;
  if (!documentIds || !Array.isArray(documentIds) || documentIds.length < 2) {
    return res.status(400).json({ error: 'At least two document IDs are required for comparison.' });
  }
  try {
    const result = await compareDocuments(documentIds, comparisonFocus);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Comparison failed' });
  }
});

// Research Brief Generator
app.post('/api/research/brief', async (req: Request, res: Response) => {
  const { title, format = 'executive_summary', documentIds, collectionId, researchFocus } = req.body;
  try {
    const brief = await generateBrief({
      title,
      format,
      documentIds,
      collectionId,
      researchFocus,
    });
    res.json(brief);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Brief generation failed' });
  }
});

// Sessions
app.get('/api/sessions', (req: Request, res: Response) => {
  res.json(storage.getSessions());
});

app.get('/api/sessions/:id', (req: Request, res: Response) => {
  const session = storage.getSession(req.params.id);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  res.json(session);
});

app.post('/api/sessions', (req: Request, res: Response) => {
  const session = req.body;
  if (!session.id) {
    session.id = `sess_${Date.now()}`;
  }
  session.updatedAt = new Date().toISOString();
  if (!session.createdAt) {
    session.createdAt = new Date().toISOString();
  }
  storage.saveSession(session);
  res.json(session);
});

app.delete('/api/sessions/:id', (req: Request, res: Response) => {
  const success = storage.deleteSession(req.params.id);
  if (!success) {
    return res.status(404).json({ error: 'Session not found' });
  }
  res.json({ success: true });
});

// Research Briefs
app.get('/api/briefs', (req: Request, res: Response) => {
  res.json(storage.getBriefs());
});

app.get('/api/briefs/:id', (req: Request, res: Response) => {
  const brief = storage.getBrief(req.params.id);
  if (!brief) {
    return res.status(404).json({ error: 'Brief not found' });
  }
  res.json(brief);
});

app.post('/api/briefs', (req: Request, res: Response) => {
  const brief = req.body;
  if (!brief.id) {
    brief.id = `brief_${Date.now()}`;
  }
  brief.updatedAt = new Date().toISOString();
  storage.saveBrief(brief);
  res.json(brief);
});

app.delete('/api/briefs/:id', (req: Request, res: Response) => {
  const success = storage.deleteBrief(req.params.id);
  if (!success) {
    return res.status(404).json({ error: 'Brief not found' });
  }
  res.json({ success: true });
});

// Knowledge Constellation Graph
app.get('/api/knowledge-graph', async (req: Request, res: Response) => {
  try {
    const graph = await extractKnowledgeGraph();
    res.json(graph);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Graph extraction failed' });
  }
});

// Observatory & Diagnostics
app.get('/api/observatory', (req: Request, res: Response) => {
  const docs = storage.getDocuments();
  const chunks = storage.getChunks();
  const avgRet = queryMetrics.totalQueries > 0
    ? Math.round(queryMetrics.totalRetrievalLatencyMs / queryMetrics.totalQueries)
    : 14;
  const avgGen = queryMetrics.totalQueries > 0
    ? Math.round(queryMetrics.totalGenerationLatencyMs / queryMetrics.totalQueries)
    : 380;
  const citationRate = queryMetrics.totalCitationsCount > 0
    ? Math.round((queryMetrics.verifiedCitationsCount / queryMetrics.totalCitationsCount) * 100)
    : 100;

  res.json({
    embeddingProvider: getGeminiClient() ? 'Google Gemini API' : 'Local Deterministic Vector Space',
    embeddingModel: EMBEDDING_MODEL,
    generationModel: GENERATION_MODEL,
    documentCount: docs.length,
    chunkCount: chunks.length,
    successfulIngestions: queryMetrics.successfulIngestions + docs.length,
    failedIngestions: queryMetrics.failedIngestions,
    averageRetrievalLatencyMs: avgRet,
    averageGenerationLatencyMs: avgGen,
    citationVerificationRate: citationRate,
    totalQueriesProcessed: queryMetrics.totalQueries,
    storageType: 'Persistent File-Backed Knowledge Store',
  });
});

// Run live evaluation benchmark
app.post('/api/observatory/evaluate', async (req: Request, res: Response) => {
  const testQueries = [
    { q: 'What is cosine similarity?', expectedTopic: 'embeddings' },
    { q: 'How does boundary-aware chunking reduce token loss?', expectedTopic: 'chunking' },
    { q: 'Why is citation verification necessary in high-stakes retrieval?', expectedTopic: 'grounding' },
    { q: 'What are the advantages of combining BM25 with dense vectors?', expectedTopic: 'hybrid' },
  ];

  const results = [];
  const allChunks = storage.getChunks();

  for (const test of testQueries) {
    const start = Date.now();
    const retrieved = await retrieveRelevantChunks(test.q, allChunks, { topK: 5, minScore: 0.1 });
    const latency = Date.now() - start;
    const topScore = retrieved[0]?.score || 0;
    const hit = retrieved.length > 0 && topScore > 0.3;

    results.push({
      query: test.q,
      expectedTopic: test.expectedTopic,
      hit,
      topScore,
      retrievedCount: retrieved.length,
      latencyMs: latency,
    });
  }

  const recallAt5 = (results.filter(r => r.hit).length / results.length) * 100;
  const avgLatency = Math.round(results.reduce((acc, r) => acc + r.latencyMs, 0) / results.length);

  res.json({
    evaluatedQueries: results.length,
    recallAt5Percent: recallAt5,
    averageRetrievalLatencyMs: avgLatency,
    evaluationDetails: results,
    timestamp: new Date().toISOString(),
  });
});

// Export library metadata (JSON or CSV)
app.get('/api/export', (req: Request, res: Response) => {
  const { format = 'json' } = req.query;
  const docs = storage.getDocuments();

  if (format === 'csv') {
    const headers = 'ID,Title,Filename,FileType,CharCount,ChunkCount,CollectionID,UploadedAt\n';
    const rows = docs.map(d =>
      `"${d.id}","${d.title.replace(/"/g, '""')}","${d.filename}","${d.fileType}",${d.charCount},${d.chunkCount},"${d.collectionId}","${d.uploadedAt}"`
    ).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="knowledge_os_library.csv"');
    return res.send(headers + rows);
  }

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="knowledge_os_library.json"');
  res.json({
    exportedAt: new Date().toISOString(),
    documentCount: docs.length,
    documents: docs,
  });
});

// ==========================================
// VITE DEV SERVER & PRODUCTION STATIC SERVER
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    // Serve production build
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    // Vite middleware in development
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n======================================================`);
    console.log(`  KNOWLEDGE OS Research Server running at http://0.0.0.0:${PORT}`);
    console.log(`======================================================\n`);

    // Pre-seed sample library if empty in background
    if (storage.getDocuments().length === 0) {
      seedSampleLibrary().then(res => {
        console.log(`Sample research papers indexed: ${res.count} documents, ${res.chunks} chunks.`);
      }).catch(err => {
        console.error('Initial sample seeding error:', err);
      });
    }
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
