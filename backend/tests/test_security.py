"""Tests for security helpers and auth enforcement."""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.security import sanitize_text


def test_sanitize_strips_script_tags() -> None:
    result = sanitize_text("<script>alert('xss')</script>Clean text")
    assert "<script>" not in result
    assert "Clean text" in result


def test_sanitize_strips_img_onerror() -> None:
    result = sanitize_text('<img src=x onerror="alert(1)">')
    assert "onerror" not in result
    assert "<img" not in result


def test_sanitize_preserves_plain_text() -> None:
    plain = "The Dark Knight is a 2008 superhero film."
    assert sanitize_text(plain) == plain


def test_favorites_requires_auth(client: TestClient) -> None:
    resp = client.get("/favorites")
    assert resp.status_code == 401


def test_favorites_add_requires_auth(client: TestClient) -> None:
    resp = client.post("/favorites", json={"movie_id": 550, "title": "Fight Club"})
    assert resp.status_code == 401


def test_favorites_delete_requires_auth(client: TestClient) -> None:
    resp = client.delete("/favorites/550")
    assert resp.status_code == 401


def test_invalid_jwt_returns_401(client: TestClient) -> None:
    resp = client.get(
        "/favorites",
        headers={"Authorization": "Bearer obviously.invalid.token"},
    )
    assert resp.status_code == 401
