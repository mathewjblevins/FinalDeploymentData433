"""In-memory movie corpus with lazy load and dynamic augmentation.

The corpus is loaded lazily on first request (not at module import) to keep
Render free-tier cold starts under 8s. The `ensure_movie()` function implements
the dynamic corpus fallback: if a queried movie_id isn't in the preloaded set,
it hits TMDB, appends the row, and signals the model to rebuild.
"""
from __future__ import annotations

import asyncio

import pandas as pd

from app.ml.tmdb import fetch_popular_movies, get_movie_by_id
from app.settings import settings

_lock = asyncio.Lock()

_df: pd.DataFrame | None = None
_movie_id_set: set[int] = set()


async def get_corpus() -> pd.DataFrame:
    """Return the current in-memory corpus, loading it lazily on first call."""
    global _df
    async with _lock:
        if _df is None:
            movies = await fetch_popular_movies(pages=settings.corpus_pages)
            _df = pd.DataFrame(movies).drop_duplicates(subset="id").reset_index(drop=True)
            _movie_id_set.update(int(i) for i in _df["id"])
    return _df  # type: ignore[return-value]


async def ensure_movie(movie_id: int) -> tuple[pd.DataFrame, bool]:
    """Ensure movie_id is in the corpus; fetch from TMDB and append if not.

    Returns (corpus_df, was_augmented). If was_augmented is True, the caller
    should rebuild the similarity matrix.
    """
    global _df
    df = await get_corpus()

    if movie_id in _movie_id_set:
        return df, False

    movie = await get_movie_by_id(movie_id)
    if movie is None:
        return df, False

    async with _lock:
        if movie_id not in _movie_id_set:  # double-check after re-acquiring
            new_row = pd.DataFrame([movie])
            _df = pd.concat([_df, new_row], ignore_index=True)
            _movie_id_set.add(movie_id)
            return _df, True  # type: ignore[return-value]

    return _df, False  # type: ignore[return-value]


def build_features(df: pd.DataFrame) -> pd.Series:  # type: ignore[type-arg]
    """Combine overview + genres (genres weighted 3×) into a single feature string."""
    overviews = df["overview"].fillna("").astype(str)
    genres = df["genres"].fillna("").astype(str)
    return overviews + " " + genres + " " + genres + " " + genres
