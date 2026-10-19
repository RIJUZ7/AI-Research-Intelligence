import {
  DocumentMetadata,
  DocumentWithChunks,
  Collection,
  ResearchAnswer,
  ComparisonResult,
  ResearchBrief,
  ResearchSession,
  KnowledgeGraphData,
  ObservatoryMetrics,
} from '../types';

export const api = {
  async getHealth() {
    const res = await fetch('/api/health');
    if (!res.ok) throw new Error('Health check failed');
    return res.json();
  },

  async getDocuments(collectionId?: string): Promise<DocumentMetadata[]> {
    const url = collectionId && collectionId !== 'all'
      ? `/api/documents?collectionId=${encodeURIComponent(collectionId)}`
      : '/api/documents';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch documents');
    return res.json();
  },

  async getDocument(id: string): Promise<DocumentWithChunks> {
    const res = await fetch(`/api/documents/${id}`);
    if (!res.ok) throw new Error('Failed to fetch document');
    return res.json();
  },

  async uploadDocument(data: {
    filename: string;
    base64Content: string;
    collectionId?: string;
    tags?: string[];
    force?: boolean;
  }): Promise<{ success: boolean; document: DocumentMetadata; chunksCount: number }> {
    const res = await fetch('/api/documents/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) {
      if (res.status === 409) {
        const err = new Error(json.message || 'Duplicate document detected');
        (err as any).isDuplicate = true;
        (err as any).existingDocument = json.existingDocument;
        throw err;
      }
      throw new Error(json.error || 'Upload failed');
    }
    return json;
  },

  async updateDocument(id: string, updates: { title?: string; tags?: string[]; collectionId?: string }): Promise<DocumentMetadata> {
    const res = await fetch(`/api/documents/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update document');
    return res.json();
  },

  async reindexDocument(id: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`/api/documents/${id}/reindex`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to reindex document');
    return res.json();
  },

  async deleteDocument(id: string): Promise<void> {
    const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete document');
  },

  async getCollections(): Promise<Collection[]> {
    const res = await fetch('/api/collections');
    if (!res.ok) throw new Error('Failed to fetch collections');
    return res.json();
  },

  async createCollection(name: string, description = '', color = '#506B58'): Promise<Collection> {
    const res = await fetch('/api/collections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description, color }),
    });
    if (!res.ok) throw new Error('Failed to create collection');
    return res.json();
  },

  async deleteCollection(id: string): Promise<void> {
    const res = await fetch(`/api/collections/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete collection');
  },

  async askQuestion(data: {
    question: string;
    collectionId?: string;
    documentIds?: string[];
    sessionId?: string;
  }): Promise<ResearchAnswer> {
    const res = await fetch('/api/research/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to process research inquiry');
    }
    return res.json();
  },

  async search(query: string, collectionId?: string, documentIds?: string[], topK = 8) {
    const res = await fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, collectionId, documentIds, topK }),
    });
    if (!res.ok) throw new Error('Search failed');
    return res.json();
  },

  async compareDocuments(documentIds: string[], comparisonFocus?: string): Promise<ComparisonResult> {
    const res = await fetch('/api/research/compare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentIds, comparisonFocus }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to compare documents');
    }
    return res.json();
  },

  async generateBrief(data: {
    title?: string;
    format: ResearchBrief['format'];
    documentIds?: string[];
    collectionId?: string;
    researchFocus?: string;
  }): Promise<ResearchBrief> {
    const res = await fetch('/api/research/brief', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to generate research brief');
    }
    return res.json();
  },

  async getBriefs(): Promise<ResearchBrief[]> {
    const res = await fetch('/api/briefs');
    if (!res.ok) throw new Error('Failed to fetch briefs');
    return res.json();
  },

  async saveBrief(brief: Partial<ResearchBrief>): Promise<ResearchBrief> {
    const res = await fetch('/api/briefs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(brief),
    });
    if (!res.ok) throw new Error('Failed to save brief');
    return res.json();
  },

  async deleteBrief(id: string): Promise<void> {
    const res = await fetch(`/api/briefs/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete brief');
  },

  async getSessions(): Promise<ResearchSession[]> {
    const res = await fetch('/api/sessions');
    if (!res.ok) throw new Error('Failed to fetch sessions');
    return res.json();
  },

  async getSession(id: string): Promise<ResearchSession> {
    const res = await fetch(`/api/sessions/${id}`);
    if (!res.ok) throw new Error('Failed to fetch session');
    return res.json();
  },

  async deleteSession(id: string): Promise<void> {
    const res = await fetch(`/api/sessions/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete session');
  },

  async getKnowledgeGraph(): Promise<KnowledgeGraphData> {
    const res = await fetch('/api/knowledge-graph');
    if (!res.ok) throw new Error('Failed to fetch knowledge graph');
    return res.json();
  },

  async getObservatory(): Promise<ObservatoryMetrics> {
    const res = await fetch('/api/observatory');
    if (!res.ok) throw new Error('Failed to fetch observatory metrics');
    return res.json();
  },

  async runEvaluation() {
    const res = await fetch('/api/observatory/evaluate', { method: 'POST' });
    if (!res.ok) throw new Error('Evaluation failed');
    return res.json();
  },

  async seedSampleData(): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/sample-data/seed', { method: 'POST' });
    if (!res.ok) throw new Error('Failed to seed sample library');
    return res.json();
  },

  async clearAllData(): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/sample-data/clear', { method: 'POST' });
    if (!res.ok) throw new Error('Failed to clear library');
    return res.json();
  },
};
