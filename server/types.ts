/**
 * Types for KNOWLEDGE OS
 */

export interface DocumentMetadata {
  id: string;
  title: string;
  filename: string;
  fileType: 'pdf' | 'txt' | 'md' | 'csv' | 'json' | 'docx';
  fileSize: number;
  charCount: number;
  chunkCount: number;
  uploadedAt: string;
  status: 'uploaded' | 'extracting' | 'chunking' | 'embedding' | 'indexing' | 'ready' | 'failed';
  error?: string;
  collectionId: string;
  tags: string[];
  pageCount?: number;
  fileHash: string;
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  chunkIndex: number;
  content: string;
  charStart: number;
  charEnd: number;
  page?: number;
  section?: string;
  embedding?: number[];
  tokenEstimate: number;
}

export interface Collection {
  id: string;
  name: string;
  description: string;
  color: string;
  createdAt: string;
  documentCount?: number;
}

export interface Citation {
  index: number; // e.g. 1, 2
  chunkId: string;
  documentId: string;
  documentTitle: string;
  page?: number;
  section?: string;
  excerpt: string;
  score: number;
  isValidated: boolean;
  isDocumentDeleted?: boolean;
}

export interface ResearchAnswer {
  id: string;
  question: string;
  answer: string;
  citations: Citation[];
  retrievedChunksCount: number;
  hasInsufficientEvidence: boolean;
  synthesisNotes?: string;
  retrievalLatencyMs: number;
  generationLatencyMs: number;
  timestamp: string;
  modelUsed: string;
  citationWarnings?: string[];
}

export interface ResearchSession {
  id: string;
  title: string;
  collectionId?: string;
  documentIds?: string[];
  messages: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    answerDetails?: ResearchAnswer;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface ResearchBrief {
  id: string;
  title: string;
  format: 'executive_summary' | 'literature_review' | 'comparative_analysis' | 'research_notes' | 'evidence_table' | 'qa_report' | 'study_guide';
  summary: string;
  content: string;
  keyFindings: string[];
  citations: Citation[];
  sourceDocumentIds: string[];
  limitations: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ComparisonResult {
  title: string;
  documentIds: string[];
  documentTitles: string[];
  agreements: Array<{ claim: string; citations: Citation[] }>;
  divergences: Array<{ topic: string; contrast: string; citations: Citation[] }>;
  evidenceGaps: string[];
  synthesis: string;
  generatedAt: string;
}

export interface KnowledgeGraphNode {
  id: string;
  label: string;
  type: 'document' | 'concept' | 'author' | 'method';
  documentCount: number;
  documentIds: string[];
  description?: string;
  frequency: number;
}

export interface KnowledgeGraphEdge {
  id: string;
  source: string;
  target: string;
  relationship: 'co_occurs' | 'references' | 'shares_concept' | 'authored_by';
  weight: number;
  documentIds: string[];
}

export interface KnowledgeGraphData {
  nodes: KnowledgeGraphNode[];
  edges: KnowledgeGraphEdge[];
  lastUpdated: string;
}

export interface ObservatoryMetrics {
  embeddingProvider: string;
  embeddingModel: string;
  generationModel: string;
  documentCount: number;
  chunkCount: number;
  successfulIngestions: number;
  failedIngestions: number;
  averageRetrievalLatencyMs: number;
  averageGenerationLatencyMs: number;
  citationVerificationRate: number;
  totalQueriesProcessed: number;
  storageType: string;
}
