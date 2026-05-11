from __future__ import annotations

from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient

TMDB_RESULTS = [
    {
        "id": 550,
        "title": "Fight Club",
        "overview": "A ticking-time-bomb insomniac...",
        "release_date": "1999-10-15",
        "poster_path": "/abc.jpg",
        "vote_average": 8.4,
        "genres": "Drama",
    }
]


def _patch_search(results=TMDB_RESULTS):
    return patch(
        "app.routers.search.search_movies",
        new_callable=AsyncMock,
        return_value=results,
    )


def test_search_happy_path(client: TestClient) -> None:
    with _patch_search():
        resp = client.get("/search", params={"q": "fight club"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["query"] == "fight club"
    assert len(data["results"]) == 1
    assert data["results"][0]["title"] == "Fight Club"


def test_search_empty_query(client: TestClient) -> None:
    resp = client.get("/search", params={"q": ""})
    assert resp.status_code == 422


def test_search_query_too_long(client: TestClient) -> None:
    resp = client.get("/search", params={"q": "x" * 121})
    assert resp.status_code == 422


def test_search_tmdb_failure(client: TestClient) -> None:
    with patch(
        "app.routers.search.search_movies",
        new_callable=AsyncMock,
        side_effect=Exception("TMDB down"),
    ):
        resp = client.get("/search", params={"q": "inception"})
    assert resp.status_code == 502


def test_search_empty_results(client: TestClient) -> None:
    with _patch_search(results=[]):
        resp = client.get("/search", params={"q": "xyzzy_nonexistent"})
    assert resp.status_code == 200
    assert resp.json()["results"] == []
