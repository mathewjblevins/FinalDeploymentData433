# CineMatch: Model Documentation

## Algorithm

**Content-based filtering using TF-IDF + cosine similarity**

### Feature Engineering

Each movie is represented as a single text document:

```python
features = overview + " " + genres * 3
```

- `overview`: TMDB movie synopsis (~100–500 words)
- `genres`: space-separated genre names (e.g., "Action Thriller Drama")
- Genres are repeated 3× to weight genre matching more heavily than keyword overlap in the overview

### Vectorization

```python
TfidfVectorizer(stop_words="english", max_features=5000)
```

- English stop words removed (the, is, a, etc.)
- Top 5,000 vocabulary terms retained (dimensionality reduction)
- TF-IDF weights penalize terms common across all movies (e.g., "story", "life")

### Similarity

```python
cosine_similarity(tfidf_matrix)
```

Cosine similarity measures the angle between two document vectors regardless of their magnitude. This is appropriate here because document length varies significantly; cosine normalizes for that.

### Ranking

Given a seed movie at position `pos` in the matrix:
1. Extract row `sim_matrix[pos]`: cosine similarity to every other movie
2. Remove self-similarity (index == pos)
3. Sort descending; return top k (default k=12)

---

## Rationale (Why TF-IDF + Cosine)

| Alternative | Considered? | Why not chosen |
|---|---|---|
| Count vectorizer baseline | Yes (ablated) | TF-IDF outperforms; penalizes common terms like "story" |
| Euclidean distance | Yes (ablated) | Sensitive to document length; cosine is more robust |
| Word2Vec / GloVe embeddings | No | Adds significant dependency complexity for marginal gain at demo scale |
| Sentence-transformers (SBERT) | Roadmap v1.1 | Semantically superior but requires GPU/API key; out of scope for this milestone |
| Collaborative filtering | Roadmap v1.1 | Requires user behavior data; cold start problem |

### Ablation notes (Milestone 4 validation)

We compared TF-IDF vs. CountVectorizer on 10 seed movies (manually evaluated top-5 recommendations):

| Metric | TF-IDF | CountVectorizer |
|---|---|---|
| Genre consistency (top 5) | 4.1/5 | 3.6/5 |
| Thematic coherence (subjective) | 4.3/5 | 3.8/5 |
| "Obvious noise" recommendations | 0.8/5 | 1.4/5 |

TF-IDF wins on all three dimensions, primarily because it down-weights generic terms.

---

## Dynamic Corpus Fallback

**This is a key UX differentiator.** The preloaded corpus (~10 pages × 4 TMDB endpoints × ~20 results = ~800 movies) doesn't cover every film a user might search for.

When a user queries a movie not in the corpus:
1. `ensure_movie(movie_id)` fetches the movie from TMDB by ID
2. Appends the new row to the in-memory DataFrame
3. Signals the model to rebuild the TF-IDF matrix
4. Proceeds with scoring

Every query enriches the corpus; the model gets slightly better over the lifetime of a server instance.

**Trade-off:** Rebuild cost is O(n × 5000) for the TF-IDF fit, approximately 0.3s for an 800-movie corpus. Acceptable for a free-tier deployment.

---

## Model Limitations

1. **No temporal awareness:** A 1990 film and a 2024 film with similar overviews get similar scores, even though audience expectations diverged significantly.
2. **Language bias:** The model sees English descriptions only (TMDB `language=en-US`). Dubbed films may have translated overviews that differ from the original text's register.
3. **Popularity cliff:** Obscure films with 2-sentence overviews are poorly represented. The dynamic fallback helps but doesn't fix the thin-feature problem.
4. **No feedback loop:** There's no way to mark a recommendation as "bad" and re-rank.

---

## k-Tuning Notes

- k=12: balanced grid (4-column, 3-row) on desktop; enough variety without overwhelming
- k=5 was tested but felt sparse; users wanted more to scroll through
- k=20 max (enforced by API Pydantic schema); beyond that, quality degrades rapidly as cosine scores approach 0
