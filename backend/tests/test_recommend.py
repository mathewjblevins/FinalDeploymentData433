from __future__ import annotations

from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient


def test_recommend_happy_path(client: TestClient) -> None:
    resp = client.post("/recommend", json={"movie_id": 550, "k": 3})
    assert resp.status_code == 200
    data = resp.json()
    assert data["source"]["movie_id"] == 550
    assert len(data["recommendations"]) <= 3
    assert len(data["scores"]) == len(data["recommendations"])


def test_recommend_scores_descending(client: TestClient) -> None:
    resp = client.post("/recommend", json={"movie_id": 550, "k": 4})
    scores = resp.json()["scores"]
    assert scores == sorted(scores, reverse=True)


def test_recommend_movie_not_found(client: TestClient) -> None:
    with patch(
        "app.routers.recommend.get_recommendations",
        new_callable=AsyncMock,
        return_value={"source": None, "recommendations": [], "scores": []},
    ):
        resp = client.post("/recommend", json={"movie_id": 99999, "k": 3})
        assert resp.status_code == 404


def test_recommend_invalid_k(client: TestClient) -> None:
    resp = client.post("/recommend", json={"movie_id": 550, "k": 999})
    assert resp.status_code == 422


def test_recommend_invalid_movie_id(client: TestClient) -> None:
    resp = client.post("/recommend", json={"movie_id": -1, "k": 3})
    assert resp.status_code == 422
