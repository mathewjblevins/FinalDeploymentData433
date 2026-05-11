"""Pytest configuration and fixtures for the CineMatch backend tests."""
from __future__ import annotations

import os
from collections.abc import AsyncGenerator
from typing import Any
from unittest.mock import AsyncMock, patch

import pandas as pd
import pytest
from fastapi.testclient import TestClient
from httpx import ASGITransport, AsyncClient

# Set dummy env vars before importing settings
os.environ.setdefault("TMDB_API_KEY", "test_tmdb_key")
os.environ.setdefault("SUPABASE_JWT_SECRET", "test_jwt_secret_that_is_long_enough_32chars")
os.environ.setdefault("SUPABASE_URL", "https://test.supabase.co")
os.environ.setdefault("SUPABASE_ANON_KEY", "test_anon_key")
os.environ.setdefault("ENVIRONMENT", "test")

from app.main import app  # noqa: E402


SAMPLE_MOVIES: list[dict[str, Any]] = [
    {
        "id": 550,
        "title": "Fight Club",
        "overview": "A ticking-time-bomb insomniac and a slippery soap salesman channel primal male aggression into a shocking new form of therapy.",
        "genres": "Drama Thriller",
        "poster_path": "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
        "vote_average": 8.4,
        "release_date": "1999-10-15",
        "popularity": 100.0,
    },
    {
        "id": 278,
        "title": "The Shawshank Redemption",
        "overview": "Framed in the 1940s for the double murder of his wife and her lover, upstanding banker Andy Dufresne begins a new life at the Shawshank prison.",
        "genres": "Drama",
        "poster_path": "/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg",
        "vote_average": 8.7,
        "release_date": "1994-09-23",
        "popularity": 90.0,
    },
    {
        "id": 238,
        "title": "The Godfather",
        "overview": "Spanning the years 1945 to 1955, a chronicle of the fictional Italian-American Corleone crime family.",
        "genres": "Drama Crime",
        "poster_path": "/3bhkrj58Vtu7enYsLLeHCsAZYzx.jpg",
        "vote_average": 8.7,
        "release_date": "1972-03-14",
        "popularity": 95.0,
    },
    {
        "id": 424,
        "title": "Schindler's List",
        "overview": "The true story of how businessman Oskar Schindler saved over a thousand Jewish lives from the Nazis during World War II.",
        "genres": "Drama History War",
        "poster_path": "/sF1U4EUQS8YHUYjNl3pMGNIQyr0.jpg",
        "vote_average": 8.6,
        "release_date": "1993-11-30",
        "popularity": 85.0,
    },
    {
        "id": 129,
        "title": "Spirited Away",
        "overview": "During her family's move to the suburbs, a sullen 10-year-old girl wanders into a world ruled by gods, witches, and spirits.",
        "genres": "Animation Adventure Family Fantasy",
        "poster_path": "/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg",
        "vote_average": 8.5,
        "release_date": "2001-07-20",
        "popularity": 88.0,
    },
]


@pytest.fixture
def sample_df() -> pd.DataFrame:
    return pd.DataFrame(SAMPLE_MOVIES)


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture
async def async_client() -> AsyncGenerator[AsyncClient, None]:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c


@pytest.fixture(autouse=True)
def mock_corpus(sample_df: pd.DataFrame) -> Any:
    """Patch the corpus loader so tests never hit TMDB."""
    with (
        patch("app.ml.corpus._df", sample_df),
        patch("app.ml.corpus._movie_id_set", {int(r["id"]) for r in SAMPLE_MOVIES}),
        patch(
            "app.ml.corpus.fetch_popular_movies",
            new_callable=AsyncMock,
            return_value=SAMPLE_MOVIES,
        ),
    ):
        yield
