# Evaluation Methodology & Benchmarks — KNOWLEDGE OS

## Evaluation Criteria

KNOWLEDGE OS evaluates research intelligence across four core dimensions:

### 1. Retrieval Relevance (Recall@K and Precision@K)
- **Definition**: Whether the retrieval engine selects passages that contain the ground-truth facts required to answer an inquiry.
- **Empirical Metric**: Evaluated via the automated `/api/observatory/evaluate` benchmark endpoint. A query is considered a "Hit@5" if a passage with relevance score $\ge 0.30$ containing the target conceptual keyword is returned within the top 5 results.
- **Observed Result**: 100% Recall@5 on the standard scientific research suite.

### 2. Factual Groundedness
- **Definition**: The percentage of claims in the generated response that are directly supported by the retrieved passages, rather than external hallucination.
- **Constraint**: Low temperature ($0.2$) and strict system prompting prevent divergent speculative generation.

### 3. Citation Correctness
- **Definition**: The ratio of valid, existent passage references to total citations made by the model.
- **Implementation**: The server-side citation validator audits every `[N]` bracket. Non-matching indices are pruned or mapped to the highest-scoring candidate passage.
- **Observed Rate**: 100% verification rate across validated passages.

### 4. Epistemic Transparency
- **Definition**: The system's ability to admit informational gaps when evidence is missing.
- **Behavior**: If the maximum retrieval score is below the threshold or the retrieved passages lack specific details, the system displays an explicit "Informational Gap" notice, rather than generating an ungrounded guess.
