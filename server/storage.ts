import fs from 'fs';
import path from 'path';
import {
  DocumentMetadata,
  DocumentChunk,
  Collection,
  ResearchSession,
  ResearchBrief,
  KnowledgeGraphData,
} from './types.js';

interface KnowledgeStoreData {
  documents: Record<string, DocumentMetadata>;
  chunks: Record<string, DocumentChunk>;
  collections: Record<string, Collection>;
  sessions: Record<string, ResearchSession>;
  briefs: Record<string, ResearchBrief>;
  knowledgeGraph?: KnowledgeGraphData;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const STORE_FILE = path.join(DATA_DIR, 'knowledge_os_store.json');

const DEFAULT_COLLECTIONS: Collection[] = [
  {
    id: 'col_general',
    name: 'General Research',
    description: 'Foundational reading, cross-discipline notes, and miscellaneous papers',
    color: '#506B58',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'col_ai_ml',
    name: 'Machine Learning & Retrieval',
    description: 'Papers on RAG, embeddings, vector databases, and neural synthesis',
    color: '#748AA0',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'col_systems',
    name: 'Software & Systems Architecture',
    description: 'Distributed systems, memory hierarchies, indexing, and runtime design',
    color: '#C69A57',
    createdAt: new Date().toISOString(),
  },
];

class StorageManager {
  private data: KnowledgeStoreData;
  private isLoaded = false;

  constructor() {
    this.data = {
      documents: {},
      chunks: {},
      collections: {},
      sessions: {},
      briefs: {},
    };
    this.ensureInitialized();
  }

  private ensureInitialized() {
    if (this.isLoaded) return;
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(STORE_FILE)) {
        const raw = fs.readFileSync(STORE_FILE, 'utf-8');
        this.data = JSON.parse(raw);
      } else {
        // Initialize with default collections
        this.data = {
          documents: {},
          chunks: {},
          collections: {},
          sessions: {},
          briefs: {},
        };
        for (const col of DEFAULT_COLLECTIONS) {
          this.data.collections[col.id] = col;
        }
        this.persist();
      }
      this.isLoaded = true;
    } catch (err) {
      console.error('Failed to initialize storage:', err);
      this.data = {
        documents: {},
        chunks: {},
        collections: {},
        sessions: {},
        briefs: {},
      };
      for (const col of DEFAULT_COLLECTIONS) {
        this.data.collections[col.id] = col;
      }
      this.isLoaded = true;
    }
  }

  private persist() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(STORE_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist store:', err);
    }
  }

  // Documents
  getDocuments(collectionId?: string): DocumentMetadata[] {
    const list = Object.values(this.data.documents);
    if (!collectionId || collectionId === 'all') return list;
    return list.filter(d => d.collectionId === collectionId);
  }

  getDocument(id: string): DocumentMetadata | undefined {
    return this.data.documents[id];
  }

  findDocumentByHash(hash: string): DocumentMetadata | undefined {
    return Object.values(this.data.documents).find(d => d.fileHash === hash);
  }

  saveDocument(doc: DocumentMetadata, chunks: DocumentChunk[]) {
    this.data.documents[doc.id] = doc;
    for (const chunk of chunks) {
      this.data.chunks[chunk.id] = chunk;
    }
    this.persist();
  }

  updateDocumentMetadata(id: string, updates: Partial<DocumentMetadata>): DocumentMetadata | undefined {
    const doc = this.data.documents[id];
    if (!doc) return undefined;
    const updated = { ...doc, ...updates };
    this.data.documents[id] = updated;
    this.persist();
    return updated;
  }

  deleteDocument(id: string): boolean {
    if (!this.data.documents[id]) return false;
    delete this.data.documents[id];

    // Cascade delete associated chunks
    for (const chunkId of Object.keys(this.data.chunks)) {
      if (this.data.chunks[chunkId].documentId === id) {
        delete this.data.chunks[chunkId];
      }
    }

    // Flag citations of deleted document in previous sessions
    for (const session of Object.values(this.data.sessions)) {
      for (const msg of session.messages) {
        if (msg.answerDetails?.citations) {
          for (const cit of msg.answerDetails.citations) {
            if (cit.documentId === id) {
              cit.isDocumentDeleted = true;
              cit.isValidated = false;
            }
          }
        }
      }
    }

    // Flag citations in saved research briefs
    for (const brief of Object.values(this.data.briefs)) {
      if (brief.citations) {
        for (const cit of brief.citations) {
          if (cit.documentId === id) {
            cit.isDocumentDeleted = true;
            cit.isValidated = false;
          }
        }
      }
    }

    // Invalidate knowledge graph cache
    delete this.data.knowledgeGraph;

    this.persist();
    return true;
  }

  // Chunks
  getChunks(documentId?: string): DocumentChunk[] {
    const list = Object.values(this.data.chunks);
    if (!documentId) return list;
    return list.filter(c => c.documentId === documentId);
  }

  getChunk(id: string): DocumentChunk | undefined {
    return this.data.chunks[id];
  }

  getChunksForScope(collectionId?: string, documentIds?: string[]): DocumentChunk[] {
    let docs = Object.values(this.data.documents);
    if (collectionId && collectionId !== 'all') {
      docs = docs.filter(d => d.collectionId === collectionId);
    }
    if (documentIds && documentIds.length > 0) {
      const idSet = new Set(documentIds);
      docs = docs.filter(d => idSet.has(d.id));
    }
    const validDocIds = new Set(docs.map(d => d.id));
    return Object.values(this.data.chunks).filter(c => validDocIds.has(c.documentId));
  }

  // Collections
  getCollections(): Collection[] {
    const list = Object.values(this.data.collections);
    return list.map(c => {
      const docCount = Object.values(this.data.documents).filter(d => d.collectionId === c.id).length;
      return { ...c, documentCount: docCount };
    });
  }

  getCollection(id: string): Collection | undefined {
    return this.data.collections[id];
  }

  saveCollection(col: Collection) {
    this.data.collections[col.id] = col;
    this.persist();
  }

  deleteCollection(id: string): boolean {
    if (!this.data.collections[id]) return false;
    // Don't delete default collections
    if (id === 'col_general') return false;

    delete this.data.collections[id];
    // Reassign documents to col_general
    for (const doc of Object.values(this.data.documents)) {
      if (doc.collectionId === id) {
        doc.collectionId = 'col_general';
      }
    }
    this.persist();
    return true;
  }

  // Sessions
  getSessions(): ResearchSession[] {
    return Object.values(this.data.sessions).sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  getSession(id: string): ResearchSession | undefined {
    return this.data.sessions[id];
  }

  saveSession(session: ResearchSession) {
    this.data.sessions[session.id] = session;
    this.persist();
  }

  deleteSession(id: string): boolean {
    if (!this.data.sessions[id]) return false;
    delete this.data.sessions[id];
    this.persist();
    return true;
  }

  // Briefs
  getBriefs(): ResearchBrief[] {
    return Object.values(this.data.briefs).sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  getBrief(id: string): ResearchBrief | undefined {
    return this.data.briefs[id];
  }

  saveBrief(brief: ResearchBrief) {
    this.data.briefs[brief.id] = brief;
    this.persist();
  }

  deleteBrief(id: string): boolean {
    if (!this.data.briefs[id]) return false;
    delete this.data.briefs[id];
    this.persist();
    return true;
  }

  // Knowledge Graph Cache
  getKnowledgeGraph(): KnowledgeGraphData | undefined {
    return this.data.knowledgeGraph;
  }

  saveKnowledgeGraph(graph: KnowledgeGraphData) {
    this.data.knowledgeGraph = graph;
    this.persist();
  }

  // Clear all or demo data
  clearAllDocuments() {
    this.data.documents = {};
    this.data.chunks = {};
    this.data.sessions = {};
    this.data.briefs = {};
    delete this.data.knowledgeGraph;
    this.persist();
  }
}

export const storage = new StorageManager();
