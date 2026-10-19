# KNOWLEDGE OS — The Personal Research Intelligence System

> *"Turn documents into understanding."*

KNOWLEDGE OS is an editorial, portfolio-grade research workspace powered by a fully verifiable, explainable Retrieval-Augmented Generation (RAG) architecture. Built for scholars, engineers, and researchers, it bridges raw long-form documentation into structured understanding with deterministic citation verification, cross-document comparative analysis, an interactive knowledge constellation atlas, and research brief generation.

---

## Architecture Overview

```mermaid
flowchart TD
    subgraph Ingestion["Document Ingestion Pipeline"]
        A[User Upload / Sample Papers] --> B[Text Extractor: PDF, TXT, MD, CSV, JSON]
        B --> C[Boundary-Aware Semantic Chunker]
        C --> D[Embedding Generator: Gemini text-embedding-004]
        D --> E[(Persistent Vector Store & Metadata)]
    end

    subgraph Retrieval["Hybrid Retrieval Engine"]
        F[Research Inquiry / Question] --> G[Dense Semantic Cosine Similarity]
        F --> H[Sparse Lexical BM25 Ranking]
        G & H --> I[Convex Linear Combination alpha = 0.75]
        I --> J[Top-K Scored Evidence Passages]
    end

    subgraph Generation["Grounded Generation & Auditing"]
        J --> K[Gemini 3.8 Flash Synthesizer]
        K --> L[Server-Side Citation Validation Pipeline]
        L --> M[Interactive Grounded Answer with [1] [2] Provenance]
    end

    subgraph Workspaces["Research Workspaces"]
        M --> N[Research Desk]
        E --> O[Knowledge Constellation Atlas]
        E --> P[Cross-Document Comparison]
        M --> Q[Research Briefs Generator]
        E --> R[Document Reader]
        M --> S[Observatory & Live Benchmarks]
    end
```

---

## Core Features

1. **Research Desk (Primary Q&A Workspace)**:
   - Natural language inquiries scoped across collections or specific documents.
   - Grounded generation with interactive inline citations (`[1]`, `[2]`).
   - One-click source inspection with passage excerpt, match score, and page navigation.
   - Honest epistemic indicators when evidence is sparse or insufficient.
   - Follow-up conversation threading.

2. **Source Inspector**:
   - Right-hand contextual inspection panel showing extracted chunks, similarity scores, page/section markers, and direct jump to the exact location in the Document Reader.

3. **Knowledge Constellation**:
   - Original interactive SVG/Canvas knowledge map resembling an archival scientific atlas.
   - Real, evidence-backed nodes (documents, extracted technical concepts, methodologies, authors).
   - Co-occurrence and conceptual affinity edges.
   - Pan, zoom, search, node inspector, and direct folio navigation.

4. **Cross-Document Comparison Workspace**:
   - Select 2 or more documents to contrast.
   - Extracts consensus/agreements, divergences, methodological conflicts, and unanswered questions.
   - Full citation backing for each side of the argument.

5. **Research Briefs Generator & Editor**:
   - Formats: Executive Summary, Literature Review, Comparative Analysis, Research Notes, Evidence Matrix, Q&A Report, Study Curriculum.
   - In-app markdown editor with real-time editing, Markdown export, and JSON export.

6. **Distraction-Free Document Reader**:
   - Full document reader with in-text search, match highlighting, and chunk stepping.
   - Auto-scrolls and highlights the exact passage when arriving from a citation.

7. **My Library & Ingestion Engine**:
   - Drag-and-drop file ingestion (PDF, TXT, Markdown, CSV, JSON).
   - Multi-stage pipeline: Extracting -> Chunking -> Embedding -> Indexing -> Ready.
   - SHA-256 duplicate detection with conflict resolution modal (Skip or Import Copy).
   - Metadata export in JSON and CSV formats.

8. **Model Observatory & Live Retrieval Benchmarks**:
   - Live telemetry: active embedding & generation models, corpus chunk count, average retrieval & generation latency.
   - Real-time evaluation benchmark runner (Recall@5, latency, score distributions).
   - Educational guide on Groundedness, Retrieval Precision, Citation Correctness, and Epistemic Uncertainty.

9. **Global Command Palette (`Cmd+K` / `Ctrl+K`)**:
   - Instant keyboard navigation across all views, search within indexed documents, and quick actions.

---

## Design System: The Living Research Atlas

Designed strictly in accordance with modern curatorial and editorial principles:
- **Palette**: Warm ivory canvas (`#F6F4EE`), primary paper surface (`#FFFEFA`), deep ink (`#222822`), muted forest green (`#506B58`), desaturated blue (`#748AA0`), soft lavender (`#B6ACD6`), and warm ochre (`#C69A57`).
- **Typography**: High-contrast editorial display serif (`Fraunces`) paired with legible modern prose sans (`Plus Jakarta Sans`) and tabular monospace numerals (`JetBrains Mono`).
- **Zero-Pill Discipline**: Metadata is presented as quiet unboxed text separated by typographic middots (`·`), reserving bordered buttons exclusively for functional actions.

---

## Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Framer Motion.
- **Server**: Node.js, Express, Vite middleware in development.
- **AI & RAG Engine**:
  - `@google/genai` TypeScript SDK
  - Generation Model: `gemini-3.8-flash`
  - Embedding Model: `text-embedding-004` (with deterministic fallback for offline testing)
  - PDF Parsing: `pdf-parse`
  - Persistence: File-backed knowledge store (`./data/knowledge_os_store.json`)

---

## API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | System health, model configuration, and index statistics |
| `GET` | `/api/documents` | List indexed documents with optional collection filtering |
| `GET` | `/api/documents/:id` | Get single document and its segmented chunks |
| `POST` | `/api/documents/upload` | Upload and process file (PDF, TXT, MD, CSV, JSON) |
| `PATCH` | `/api/documents/:id` | Update document display title, collection, or tags |
| `DELETE` | `/api/documents/:id` | Delete document and cascade delete all chunks and embeddings |
| `POST` | `/api/documents/:id/reindex` | Re-segment and re-embed document |
| `GET` | `/api/collections` | List all collections with document counts |
| `POST` | `/api/collections` | Create a new collection |
| `DELETE` | `/api/collections/:id` | Delete collection (documents re-assigned to General) |
| `POST` | `/api/search` | Execute hybrid semantic and lexical search |
| `POST` | `/api/research/ask` | Grounded question answering with server-side citation validation |
| `POST` | `/api/research/compare` | Cross-document comparative synthesis |
| `POST` | `/api/research/brief` | Generate structured research brief |
| `GET` | `/api/briefs` | List saved research briefs |
| `POST` | `/api/briefs` | Save or update research brief |
| `DELETE` | `/api/briefs/:id` | Delete research brief |
| `GET` | `/api/sessions` | List saved research sessions |
| `GET` | `/api/knowledge-graph` | Retrieve nodes and edges for the Knowledge Constellation |
| `GET` | `/api/observatory` | System telemetry, latencies, and citation verification rate |
| `POST` | `/api/observatory/evaluate` | Run live retrieval benchmark and calculate Recall@5 |
| `POST` | `/api/sample-data/seed` | Seed initial research papers on RAG and vector search |
| `POST` | `/api/sample-data/clear` | Clear all library data |
| `GET` | `/api/export` | Export library metadata as JSON or CSV |

---

## Getting Started

### Prerequisites
- Node.js >= 18
- `npm`

### Environment Variables
Configure your `.env` file (or use AI Studio runtime secrets):
```env
GEMINI_API_KEY="your-google-gemini-api-key"
PORT=3000
```

### Running Locally
```bash
# Install dependencies
npm install

# Start development server (serves frontend and backend on port 3000)
npm run dev

# Compile TypeScript and build production bundle
npm run build

# Start production server
npm start
```
