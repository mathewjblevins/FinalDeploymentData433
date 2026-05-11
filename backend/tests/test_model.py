"""Unit tests for the TF-IDF model and corpus logic."""
from __future__ import annotations

import pandas as pd
import pytest

from app.ml.corpus import build_features


def test_build_features_weights_genres(sample_df: pd.DataFrame) -> None:
    features = build_features(sample_df)
    assert len(features) == len(sample_df)
    # Genres appear 3× in the feature string
    row = features.iloc[0]
    genre = sample_df.iloc[0]["genres"].split()[0]
    assert row.count(genre) >= 3


def test_build_features_handles_missing(sample_df: pd.DataFrame) -> None:
    df_missing = sample_df.copy()
    df_missing.loc[0, "overview"] = None
    df_missing.loc[1, "genres"] = None
    features = build_features(df_missing)
    assert features.notna().all()


@pytest.mark.asyncio
async def test_get_recommendations_returns_source() -> None:
    from app.ml.model import get_recommendations

    result = await get_recommendations(550, k=3)
    assert result["source"] is not None
    assert int(result["source"]["id"]) == 550


@pytest.mark.asyncio
async def test_get_recommendations_k_respected() -> None:
    from app.ml.model import get_recommendations

    result = await get_recommendations(550, k=2)
    assert len(result["recommendations"]) <= 2


@pytest.mark.asyncio
async def test_get_recommendations_scores_descending() -> None:
    from app.ml.model import get_recommendations

    result = await get_recommendations(278, k=4)
    scores = result["scores"]
    assert scores == sorted(scores, reverse=True)
