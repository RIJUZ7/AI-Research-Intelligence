import { storage } from './storage.js';
import { chunkDocument } from './chunker.js';
import { embedText } from './vectorStore.js';
import { DocumentMetadata } from './types.js';

export const SAMPLE_DOCUMENTS = [
  {
    id: 'doc_vector_embeddings',
    title: 'Vector Embeddings & High-Dimensional Semantic Search in Modern Retrieval Systems',
    filename: 'vector_embeddings_semantic_search.txt',
    collectionId: 'col_ai_ml',
    tags: ['embeddings', 'vector-search', 'cosine-similarity', 'ANN'],
    content: `Title: Vector Embeddings & High-Dimensional Semantic Search in Modern Retrieval Systems
Authors: Dr. Evelyn Vance, Marcus Thorne
Affiliation: Institute for Neural Information Retrieval
Published: Q1 2026

Abstract:
Dense vector representations have fundamentally altered information retrieval by encoding semantic relationships into continuous geometric manifolds. Rather than relying on exact lexical matching, embedding models project tokens, sentences, and passages into high-dimensional vector spaces (typically 768 to 3072 dimensions) where spatial proximity correlates with conceptual similarity. This paper evaluates the geometric properties of dense embeddings, examines cosine distance versus inner product metrics, and contrasts exact k-nearest neighbor retrieval with Approximate Nearest Neighbor (ANN) index structures such as HNSW and ScaNN.

1. Theoretical Foundations of Dense Vector Embeddings
Modern dense retrieval originates from the distributional hypothesis, asserting that words and passages occurring in analogous linguistic contexts possess similar semantic meanings. While early models (e.g., Word2Vec, GloVe) constructed static representations, modern transformer-based embedding architectures produce context-sensitive vectors by pooling contextualized hidden states across self-attention layers. In high-dimensional Euclidean space, the semantic distance between passage query vector q and document chunk vector d is standardly computed using cosine similarity:
cos(q, d) = (q · d) / (||q|| * ||d||)
Normalizing vectors to unit length allows the cosine distance to be reduced to a fast dot product operation, significantly accelerating batch matrix multiplication on modern hardware.

2. Dimensionality, Sparsity, and the Curse of Dimensionality
As vector dimensionality grows beyond 512 dimensions, vector spaces exhibit geometric phenomena collectively described as the curse of dimensionality. Specifically, the ratio between the distance to the nearest neighbor and the distance to the farthest neighbor approaches unity under uniform distribution. However, natural language text resides on lower-dimensional sub-manifolds within the embedding space. This intrinsic lower dimensionality enables Approximate Nearest Neighbor algorithms to construct navigable small-world graphs (HNSW) that achieve sub-linear query time complexity (O(log N)) with recall rates exceeding 98%.

3. Empirical Benchmarks and Retrieval Trade-Offs
In empirical evaluations across standard retrieval benchmarks (MTEB, BEIR), dense semantic retrieval consistently outperforms lexical BM25 on conceptual inquiries, thematic summarization, and synonym-heavy queries. In our benchmarks:
- Dense retrieval achieved Recall@10 of 86.4% on conceptual academic queries.
- Pure BM25 scored 68.2% on the same conceptual test suite.
However, dense embeddings exhibit clear vulnerabilities when handling exact product serial numbers, alphanumeric identifiers, and rare medical acronyms, where lexical matching remains strictly superior.

4. Known Limitations & Research Frontiers
Current dense embedding models require substantial compute for offline index generation. Furthermore, embedding compression techniques, such as scalar quantization (SQ8) and binary quantization (BQ), incur a 2% to 5% drop in precision when distinguishing subtle nuanced negations (e.g., "effect of drug A" versus "no effect of drug A"). Resolving negation sensitivity without expanding vector dimensionality remains an active open challenge in neural information retrieval.`,
  },
  {
    id: 'doc_chunking_strategies',
    title: 'Chunking Architectures & Context Window Optimization in Large Language Models',
    filename: 'chunking_architectures_optimization.txt',
    collectionId: 'col_ai_ml',
    tags: ['chunking', 'context-window', 'tokenization', 'boundaries'],
    content: `Title: Chunking Architectures & Context Window Optimization in Large Language Models
Authors: Elena Rostova, Kenneth Lin
Affiliation: Laboratory for Computational Linguistics & Knowledge Systems
Published: Q2 2026

Abstract:
The segmentation of long-form documents into discrete passages—colloquially known as "chunking"—is the critical yet frequently under-theorized initial stage of Retrieval-Augmented Generation (RAG). Arbitrary character or token splitting introduces semantic truncation, divorces pronouns from their antecedents, and fragments logical propositions. This paper investigates boundary-aware semantic chunking, dynamic overlapping windows, and parent-child hierarchical document trees. We establish that boundary-aware segmentation improves downstream retrieval precision by 24.3% compared to fixed-width sliding windows.

1. The Pathology of Fixed-Width Token Slicing
Naive RAG implementations segment documents at arbitrary character intervals (e.g., every 500 characters or 256 tokens). This practice frequently severs sentences in mid-clause, isolates table headers from their corresponding numerical rows, and destroys discourse coherence. When an embedding model is presented with an amputated chunk starting with "However, this hypothesis was invalidated...", the vector fails to capture what hypothesis was discussed, resulting in severe vector drift and false negative retrieval.

2. Boundary-Aware Semantic Segmentation
To preserve informational integrity, chunking algorithms must respect syntactic and rhetorical boundaries. Our boundary-aware strategy operates via a multi-tiered fallback hierarchy:
- Primary boundaries: Structural chapter breaks and markdown section headers (#, ##).
- Secondary boundaries: Paragraph breaks marked by double line feeds.
- Tertiary boundaries: Sentence terminations indicated by terminal punctuation (. ! ?) followed by whitespace and capital letters.
By ensuring that every chunk encapsulates at least one complete grammatical proposition, the resulting embedding vectors display significantly higher centroid clustering in semantic space.

3. The Overlap Coefficient and Token Economy
Introducing an overlap window (typically 15% to 25% of the total chunk length) mitigates boundary loss by ensuring that ideas bridging two contiguous passages appear completely within at least one chunk. In our controlled trials:
- A 500-character chunk with a 100-character overlap (20% overlap ratio) achieved optimal retrieval fidelity without excessive token inflation.
- Excessive overlap (>40%) produced redundant context stuffing, exhausting the LLM's prompt context budget and increasing generation latency by 35%.

4. Hierarchical Parent-Child Indexing
For complex monographs and technical specifications, a two-level indexing hierarchy offers substantial advantages: small child chunks (150-250 characters) are utilized for high-precision vector similarity retrieval, while their enclosing parent chunk (800-1200 characters) is passed to the generation model. This guarantees that the generative model receives sufficient surrounding context to interpret the precise retrieved passage accurately.`,
  },
  {
    id: 'doc_grounded_generation',
    title: 'Grounded Generation and Citation Verification in High-Stakes Information Retrieval',
    filename: 'grounded_generation_citations.txt',
    collectionId: 'col_systems',
    tags: ['grounding', 'citations', 'hallucination', 'verification', 'trust'],
    content: `Title: Grounded Generation and Citation Verification in High-Stakes Information Retrieval
Authors: Dr. Alistair Finch, Sophia Mirren
Affiliation: Center for Trustworthy Artificial Intelligence
Published: Q3 2026

Abstract:
In academic, legal, and clinical applications, generative language models must not merely produce plausible answers; every substantive claim must be provably grounded in verified evidence. This paper outlines an architectural framework for citation-enforced generation. We detail methods for mitigating hallucinated citations, automated excerpt verification, and formal protocols for communicating informational insufficiency when the retrieved corpus lacks relevant evidence.

1. The Problem of Hallucinated and Phantom Citations
When prompted to answer complex inquiries, generative models frequently exhibit "phantom citation"—attributing factual claims to real-sounding but non-existent papers, fabricated page numbers, or irrelevant sections of legitimate documents. In high-stakes domains, unverified citations create a dangerous illusion of empirical rigor. Generative systems must therefore implement deterministic post-generation citation validation.

2. Constrained System Prompting & Evidence Partitioning
To guarantee groundedness, the generative model must be instructed to treat retrieved passages as an immutable closed-world evidence repository:
- All factual claims must be followed by explicit passage index brackets, e.g., [1] or [2].
- General knowledge from pre-training must be strictly superseded by the provided text for document-specific questions.
- If the retrieved text lacks the evidence necessary to answer a question, the model must explicitly state the absence of evidence rather than fabricating a response.
Treating document content as untrusted input data is also vital for prompt-injection defense, ensuring malicious instructions contained within documents cannot override system boundaries.

3. Automated Post-Generation Citation Validation Architecture
Our verification pipeline validates candidate citations through a three-step deterministic check:
1. Index Mapping: Confirms that every cited index [N] corresponds to a valid retrieved passage in the query context.
2. Lexical & Semantic Co-occurrence: Computes n-gram overlap between the sentence asserting the claim and the cited passage to detect spurious attribution.
3. Fallback Remediation: If a citation fails validation, the system flags the claim with a verification warning or substitutes the closest validated source passage.

4. Communicating Epistemic Uncertainty and Evidence Gaps
A critical hallmark of intellectual maturity in research systems is knowing when to say "I do not know." When retrieved similarity scores fall below the relevance threshold (e.g., hybrid score < 0.15), the system must immediately signal insufficient evidence. Transparently delineating what is known from what cannot be substantiated preserves researcher trust and prevents catastrophic decision-making errors.`,
  },
  {
    id: 'doc_hybrid_retrieval',
    title: 'Hybrid Search: Combining Dense Semantic Vectors with Sparse Lexical BM25',
    filename: 'hybrid_search_dense_sparse.txt',
    collectionId: 'col_systems',
    tags: ['hybrid-search', 'BM25', 'vector-search', 'reranking'],
    content: `Title: Hybrid Search: Combining Dense Semantic Vectors with Sparse Lexical BM25
Authors: Prof. Julian Hayes, Clara Sterling
Affiliation: Department of Information Science & Neural Systems
Published: Q4 2026

Abstract:
While dense semantic embeddings excel at resolving semantic ambiguity and conceptual analogies, they frequently falter on exact keyword lookups, technical nomenclature, and alphanumeric identifiers. Conversely, sparse inverted-index retrieval methods such as BM25 provide infallible exact-term matching but suffer from vocabulary mismatch. This study presents an empirical analysis of hybrid retrieval pipelines that combine dense vector similarity with sparse BM25 scores through linear interpolation and Reciprocal Rank Fusion (RRF).

1. Complementary Strengths of Dense and Sparse Modalities
Dense vector retrieval operates in a continuous latent space where semantic proximity is preserved regardless of specific word choices. For instance, a query for "computational complexity of vector search" readily matches passages discussing "algorithmic run-time of nearest-neighbor lookups."
However, sparse lexical models (such as Okapi BM25) evaluate term frequency (TF) and inverse document frequency (IDF) directly on exact lexical tokens. When searching for unique identifiers, error codes (e.g., "ERR_HTTP2_PROTOCOL_ERROR"), or specific mathematical symbols, BM25 provides immediate precision that vector models frequently blur into generic concept clusters.

2. Linear Score Interpolation vs Reciprocal Rank Fusion
To construct a unified ranking, two primary fusion methodologies exist:
- Convex Linear Combination:
  Score(q, d) = alpha * Norm(Score_Dense(q, d)) + (1 - alpha) * Norm(Score_BM25(q, d))
  where alpha is typically tuned to 0.70 - 0.75 in academic corpora.
- Reciprocal Rank Fusion (RRF):
  RRF_Score(d) = Sum over rankings [ 1 / (k + Rank_i(d)) ]
  where k is a smoothing constant (typically k=60).
Our experiments reveal that linear interpolation with normalized score distributions achieves higher sensitivity when retrieval thresholds are applied, whereas RRF provides greater resilience when score distributions across engines are uncalibrated.

3. Benchmark Results Across Heterogeneous Corpora
Evaluating on a multi-domain corpus of 50,000 documents encompassing academic papers, source code, and regulatory guidelines:
- BM25 Alone: Recall@5 = 71.2%, Precision@5 = 64.5%
- Dense Embeddings Alone: Recall@5 = 84.1%, Precision@5 = 76.8%
- Hybrid Retrieval (alpha = 0.75): Recall@5 = 93.6%, Precision@5 = 85.2%
The hybrid pipeline achieved a 9.5% absolute recall improvement over dense retrieval alone, completely eliminating failures on exact technical terms and acronyms.

4. Conclusion and Architectural Recommendations
For production-grade knowledge workspaces, hybrid search represents the gold standard in retrieval architecture. By coupling high-dimensional geometric embeddings with sparse inverted indexing, systems maintain conceptual depth without sacrificing exact lexical precision.`,
  },
];

export async function seedSampleLibrary(): Promise<{ count: number; chunks: number }> {
  let totalChunks = 0;

  for (const sample of SAMPLE_DOCUMENTS) {
    // Check if document already exists
    const existing = storage.getDocument(sample.id);
    if (existing) continue;

    // Chunk document
    const chunks = chunkDocument(sample.id, sample.content);
    totalChunks += chunks.length;

    // Generate embeddings for chunks
    for (const chunk of chunks) {
      const { embedding } = await embedText(chunk.content);
      chunk.embedding = embedding;
    }

    const docMeta: DocumentMetadata = {
      id: sample.id,
      title: sample.title,
      filename: sample.filename,
      fileType: 'txt',
      fileSize: Buffer.byteLength(sample.content, 'utf-8'),
      charCount: sample.content.length,
      chunkCount: chunks.length,
      uploadedAt: new Date().toISOString(),
      status: 'ready',
      collectionId: sample.collectionId,
      tags: sample.tags,
      pageCount: 3,
      fileHash: `sample_hash_${sample.id}`,
    };

    storage.saveDocument(docMeta, chunks);
  }

  // Pre-seed an initial sample brief and session for instant exploration
  const existingBriefs = storage.getBriefs();
  if (existingBriefs.length === 0) {
    storage.saveBrief({
      id: 'brief_sample_01',
      title: 'Literature Review: Dense Embeddings & Hybrid Retrieval Architectures',
      format: 'literature_review',
      summary: 'A structured editorial review examining the comparative efficacy of dense semantic vectors versus sparse BM25 indexing in retrieval-augmented generation.',
      content: `### Executive Overview\n\nRecent empirical investigations across information retrieval demonstrate that dense semantic embeddings and sparse lexical matching occupy complementary positions in knowledge architecture [1]. While high-dimensional vector representations resolve linguistic ambiguity and conceptual analogizing, lexical indices retain unmatched precision for exact technical nomenclature and acronyms [2].\n\n### Architectural Synthesis\n\nBoundary-aware semantic segmentation has emerged as an essential prerequisite for maintaining high retrieval fidelity [3]. Amputated chunking strategies that fragment logical propositions severely degrade the semantic centroid of embedding vectors. Furthermore, implementing deterministic post-generation citation validation eliminates phantom attribution and ensures strict auditability [4].`,
      keyFindings: [
        'Dense vector search achieves 86.4% Recall@10 on conceptual academic queries, compared to 68.2% for pure BM25 [1].',
        'Hybrid retrieval combining dense vectors with BM25 (alpha = 0.75) boosts overall Recall@5 to 93.6% [2].',
        'Boundary-aware semantic chunking enhances downstream retrieval precision by 24.3% over fixed sliding windows [3].',
        'Deterministic post-generation citation validation prevents hallucinated citations and verifies grounding [4].',
      ],
      citations: [
        {
          index: 1,
          chunkId: 'doc_vector_embeddings_chunk_0',
          documentId: 'doc_vector_embeddings',
          documentTitle: 'Vector Embeddings & High-Dimensional Semantic Search in Modern Retrieval Systems',
          page: 1,
          excerpt: 'Dense retrieval achieved Recall@10 of 86.4% on conceptual academic queries, whereas pure BM25 scored 68.2%...',
          score: 0.94,
          isValidated: true,
        },
        {
          index: 2,
          chunkId: 'doc_hybrid_retrieval_chunk_0',
          documentId: 'doc_hybrid_retrieval',
          documentTitle: 'Hybrid Search: Combining Dense Semantic Vectors with Sparse Lexical BM25',
          page: 1,
          excerpt: 'Hybrid Retrieval (alpha = 0.75) achieved Recall@5 of 93.6%, representing a 9.5% absolute recall improvement over dense retrieval alone...',
          score: 0.93,
          isValidated: true,
        },
        {
          index: 3,
          chunkId: 'doc_chunking_strategies_chunk_0',
          documentId: 'doc_chunking_strategies',
          documentTitle: 'Chunking Architectures & Context Window Optimization in Large Language Models',
          page: 1,
          excerpt: 'We establish that boundary-aware segmentation improves downstream retrieval precision by 24.3% compared to fixed-width sliding windows...',
          score: 0.91,
          isValidated: true,
        },
        {
          index: 4,
          chunkId: 'doc_grounded_generation_chunk_0',
          documentId: 'doc_grounded_generation',
          documentTitle: 'Grounded Generation and Citation Verification in High-Stakes Information Retrieval',
          page: 1,
          excerpt: 'Our verification pipeline validates candidate citations through a three-step deterministic check...',
          score: 0.92,
          isValidated: true,
        },
      ],
      sourceDocumentIds: ['doc_vector_embeddings', 'doc_chunking_strategies', 'doc_grounded_generation', 'doc_hybrid_retrieval'],
      limitations: [
        'Evaluations primarily focus on standard retrieval benchmarks (MTEB, BEIR).',
        'Longitudinal performance on constantly shifting real-time corpora requires further empirical study.',
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  return { count: SAMPLE_DOCUMENTS.length, chunks: totalChunks };
}
