"""
Offline evaluation: genre-overlap precision@k
Compares TF-IDF vs CountVectorizer on the preloaded corpus.

Run from backend/:
    uv run python ../scripts/eval_model.py
"""
from __future__ import annotations

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import CountVectorizer, TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from app.ml.corpus import build_features, get_corpus

# 20 well-known movies covering a range of genres
SEED_IDS = [
    27205,   # Inception
    157336,  # Interstellar
    120,     # Fellowship of the Ring
    13,      # Forrest Gump
    278,     # Shawshank Redemption
    238,     # The Godfather
    680,     # Pulp Fiction
    550,     # Fight Club
    603,     # The Matrix
    19995,   # Avatar
    299536,  # Avengers: Infinity War
    578,     # Aliens
    105,     # Back to the Future
    329,     # Jurassic Park
    769,     # GoodFellas
    9806,    # The Incredibles
    671,     # Harry Potter and the Philosopher's Stone
    10681,   # WALL-E
    218,     # The Terminator
    11,      # Star Wars: A New Hope
]

# Stable TMDB genre ID → name mapping
GENRE_MAP: dict[int, str] = {
    28: "action", 12: "adventure", 16: "animation", 35: "comedy",
    80: "crime", 99: "documentary", 18: "drama", 10751: "family",
    14: "fantasy", 36: "history", 27: "horror", 10402: "music",
    9648: "mystery", 10749: "romance", 878: "science fiction",
    10770: "tv movie", 53: "thriller", 10752: "war", 37: "western",
}


def extract_genres(row: dict) -> set[str]:
    """Extract genre names from a corpus row regardless of storage format."""
    genres = row.get("genres") or row.get("genre_ids") or []
    result: set[str] = set()
    for g in genres:
        if isinstance(g, dict):
            result.add(g.get("name", "").lower())
        elif isinstance(g, int):
            if name := GENRE_MAP.get(g):
                result.add(name)
        elif isinstance(g, str):
            result.add(g.lower())
    return result


def precision_at_k(
    df: pd.DataFrame,
    sim_matrix: np.ndarray,
    seed_ids: list[int],
    k: int = 5,
) -> tuple[float, list[dict]]:
    """
    Genre-overlap precision@k.
    A recommendation counts as a hit if it shares >= 1 genre with the seed.
    Returns (mean_precision, per_seed_breakdown).
    """
    rows = []
    for movie_id in seed_ids:
        matches = df[df["id"] == movie_id]
        if matches.empty:
            continue
        pos = int(matches.index[0])
        seed_genres = extract_genres(df.iloc[pos].to_dict())
        if not seed_genres:
            continue

        ranked = sorted(enumerate(sim_matrix[pos]), key=lambda x: x[1], reverse=True)
        top_k = [s for s in ranked if s[0] != pos][:k]

        hits = sum(
            1 for idx, _ in top_k
            if seed_genres & extract_genres(df.iloc[idx].to_dict())
        )
        rows.append({
            "title": df.iloc[pos].get("title", str(movie_id)),
            "genres": ", ".join(sorted(seed_genres)),
            "hits": hits,
            "precision": hits / k,
        })

    mean = sum(r["precision"] for r in rows) / len(rows) if rows else 0.0
    return mean, rows


async def main() -> None:
    print("Loading corpus from TMDB / Supabase cache...")
    df = await get_corpus()
    print(f"Corpus: {len(df)} movies\n")

    features = build_features(df)

    tfidf_vec = TfidfVectorizer(stop_words="english", max_features=5000)
    tfidf_sim = np.asarray(cosine_similarity(tfidf_vec.fit_transform(features)))

    cv_vec = CountVectorizer(stop_words="english", max_features=5000)
    cv_sim = np.asarray(cosine_similarity(cv_vec.fit_transform(features)))

    print("=" * 52)
    print(f"{'Metric':<30} {'TF-IDF':>8} {'CountVec':>10} {'Delta':>8}")
    print("=" * 52)
    for k in (5, 10, 12):
        tfidf_mean, _ = precision_at_k(df, tfidf_sim, SEED_IDS, k)
        cv_mean, _    = precision_at_k(df, cv_sim,    SEED_IDS, k)
        delta = tfidf_mean - cv_mean
        print(f"  Genre precision@{k:<14} {tfidf_mean:>7.1%} {cv_mean:>9.1%} {delta:>+7.1%}")
    print("=" * 52)

    print("\nPer-seed breakdown  (TF-IDF, k=5):")
    print(f"  {'Title':<35} {'Genres':<30} P@5")
    print("  " + "-" * 72)
    _, breakdown = precision_at_k(df, tfidf_sim, SEED_IDS, k=5)
    for r in sorted(breakdown, key=lambda x: x["precision"]):
        print(f"  {r['title']:<35} {r['genres']:<30} {r['precision']:.0%}")

    mean5, _ = precision_at_k(df, tfidf_sim, SEED_IDS, k=5)
    print(f"\n  Mean precision@5 (TF-IDF): {mean5:.1%}")


if __name__ == "__main__":
    asyncio.run(main())
