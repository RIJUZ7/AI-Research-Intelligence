# The Grounded RAG Pipeline — KNOWLEDGE OS

## Ingestion Flow

1. **Document Ingestion**:
   - Accepts PDF, TXT, Markdown, CSV, and JSON up to 20MB.
   - Text is normalized to remove null bytes and standardize line breaks.
   - For PDFs, page boundaries and page indices are preserved.
   - A SHA-256 content hash is computed to detect duplicate uploads.

2. **Boundary-Aware Semantic Chunking**:
   - Rather than naive fixed token slicing that amputates words or mid-sentence clauses, KNOWLEDGE OS chunks using a boundary hierarchy:
     - Header / Section breaks (`#`, `##`)
     - Paragraph line breaks (`\n\n`)
     - Sentence terminations (`. `, `! `, `? ` followed by capitalization)
     - Word boundaries
   - Target chunk size: 500-600 characters with 100-120 character overlap (20%).
   - Source metadata, char start/end offsets, and page numbers are preserved with each chunk.

3. **Embedding Generation**:
   - Calls `@google/genai` with `text-embedding-004`.
   - Embeddings are normalized to unit length so that cosine similarity can be computed via dot product:
     $$\text{cos}(q, d) = \frac{q \cdot d}{\|q\| \|d\|}$$

---

## Retrieval & Ranking

1. **Query Processing**:
   - The user's query is normalized and embedded into the same 768-dimensional latent space.

2. **Sparse Lexical Ranking (BM25)**:
   - Term frequency and inverse document frequency are calculated across all indexed chunks in the query scope:
     $$\text{Score}_{\text{BM25}}(q, d) = \sum_{t \in q} \text{IDF}(t) \cdot \frac{f(t, d) \cdot (k_1 + 1)}{f(t, d) + k_1 \cdot (1 - b + b \cdot \frac{|d|}{\text{avgdl}})}$$
   - Parameter calibration: $k_1 = 1.5$, $b = 0.75$.

3. **Hybrid Linear Fusion**:
   - Dense semantic scores capture conceptual analogies; sparse BM25 catches exact technical terms, acronyms, and codes.
   - Scores are normalized and combined:
     $$\text{Score}_{\text{hybrid}} = 0.75 \cdot \text{Score}_{\text{dense}} + 0.25 \cdot \text{Score}_{\text{BM25}}$$

4. **Context Budgeting**:
   - Top-K scored passages (default 6) above a relevance floor (0.12) are formatted as numbered context blocks:
     `[Passage 1] Source: "Title" (Page 1) ...`

---

## Grounded Synthesis & Citation Validation

1. **Constrained Prompting**:
   - The system prompt instructs Gemini 3.8 Flash to treat passages as an immutable closed-world evidence corpus.
   - Every substantive claim must immediately cite the supporting passage index using `[1]`, `[2]`, etc.
   - Passages are treated as untrusted data, preventing document-embedded prompt overrides.

2. **Deterministic Server-Side Citation Validation**:
   - Regex extracts all `[N]` citations from the generated answer.
   - Verifies that index $N$ corresponds to an actual retrieved passage.
   - Compares vocabulary overlap between the assertion sentence and the cited passage.
   - Attaches verified metadata (document title, page, chunk ID, relevance score) to the answer payload.
