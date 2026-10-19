# System Architecture — KNOWLEDGE OS

## Architectural Blueprint

KNOWLEDGE OS is designed as an integrated, full-stack research intelligence application with clear separation between client-side interactive visual presentation and server-side model orchestration, retrieval pipelines, and persistence.

### 1. Presentation Layer (Client)
- **Framework**: React 19 SPA running with TypeScript.
- **Styling**: Tailwind CSS v4 using the "Living Research Atlas" design constitution (curatorial paper surfaces, zero-pill metadata discipline, high-contrast serif typography).
- **Workspaces**:
  - `ResearchDesk`: Interactive grounded inquiry with inline numbered citations and conversation threading.
  - `SourceInspector`: Contextual right-hand provenance panel for inspecting cited excerpts and navigating directly to document locations.
  - `KnowledgeConstellation`: Interactive SVG/Canvas knowledge graph mapping real concepts and relationships.
  - `ComparisonWorkspace`: Structured cross-document contrast matrix (agreements, divergences, gaps).
  - `ResearchBriefsView`: Multi-format research synthesizer with in-app Markdown editing and export.
  - `DocumentReader`: Distraction-free folio reader with in-text search and highlighted cited passages.
  - `ObservatoryView`: Live telemetry and evaluation benchmark suite.

### 2. Application Server Layer (Node.js & Express)
- Handles all API routing (`/api/*`), input payload validation, file size enforcement (max 20MB), and CORS/security headers.
- Hosts Vite development middleware in dev and serves optimized static assets in production.

### 3. Intelligence & RAG Core
- **Text Extractor**: Supports PDF (`pdf-parse`), Markdown, TXT, CSV, and JSON with normalization and page preservation.
- **Boundary-Aware Chunker**: Respects markdown headings, paragraph breaks, and terminal sentence punctuation with configurable overlap to prevent discourse truncation.
- **Vector Engine**:
  - Embeddings generated via Google Gemini `text-embedding-004` (768 dimensions).
  - Deterministic fallback embedding space for hermetic offline testing.
  - In-memory similarity cache to prevent redundant embedding calls.
- **Hybrid Search**: Combines dense cosine similarity with sparse Okapi BM25 lexical ranking via convex linear combination (`alpha = 0.75`).
- **Grounded Answer Generator**: System-prompt constrained Gemini 3.8 Flash model enforcing strict evidence grounding, bracketed citations `[N]`, and epistemic honesty on sparse evidence.
- **Citation Validator**: Server-side auditor that verifies candidate citations correspond to actual retrieved chunks and validates lexical alignment.

### 4. Storage & Persistence
- File-backed persistent knowledge store located at `./data/knowledge_os_store.json`.
- Maintains relational referential integrity: deleting a document cascades to delete its chunks, embeddings, and invalidates graph cache.
