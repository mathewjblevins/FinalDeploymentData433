"""TF-IDF + cosine similarity model.

The matrix is rebuilt lazily (on first recommend call, or when the corpus
is augmented). This keeps Render free-tier cold starts short.
"""
from __future__ import annotations

import asyncio
from typing import Any

import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from app.ml.corpus import build_features, ensure_movie, get_corpus

_matrix_lock = asyncio.Lock()
_sim_matrix: np.ndarray | None = None
_matrix_version: int = 0  # increments on each rebuild


async def _rebuild(df: pd.DataFrame) -> np.ndarray:
    features = build_features(df)
    tfidf = TfidfVectorizer(stop_words="english", max_features=5000)
    tfidf_matrix = tfidf.fit_transform(features)
    return np.asarray(cosine_similarity(tfidf_matrix))


async def get_recommendations(
    movie_id: int, k: int = 12
) -> dict[str, Any]:
    """Return the top-k recommendations for a given TMDB movie_id.

    Implements the dynamic corpus fallback: if movie_id isn't preloaded, it's
    fetched from TMDB and the matrix is rebuilt before scoring.
    """
    global _sim_matrix, _matrix_version

    df, augmented = await ensure_movie(movie_id)

    async with _matrix_lock:
        if _sim_matrix is None or augmented:
            _sim_matrix = await _rebuild(df)
            _matrix_version += 1
        sim = _sim_matrix
        df_snapshot = df.copy()

    # Locate the movie row
    matches = df_snapshot[df_snapshot["id"] == movie_id]
    if matches.empty:
        return {"source": None, "recommendations": [], "scores": []}

    pos = int(matches.index[0])

    scores = list(enumerate(sim[pos]))
    scores = sorted(scores, key=lambda x: x[1], reverse=True)
    scores = [s for s in scores if s[0] != pos][:k]

    indices = [s[0] for s in scores]
    score_values = [float(s[1]) for s in scores]

    source_row = df_snapshot.iloc[pos].to_dict()
    rec_rows = df_snapshot.iloc[indices].to_dict(orient="records")

    return {
        "source": source_row,
        "recommendations": rec_rows,
        "scores": score_values,
    }


async def ensure_matrix_loaded() -> None:
    """Pre-warm: build the TF-IDF matrix if it hasn't been built yet."""
    global _sim_matrix
    async with _matrix_lock:
        if _sim_matrix is None:
            df = await get_corpus()
            _sim_matrix = await _rebuild(df)
