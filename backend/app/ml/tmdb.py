"""Single source of all TMDB API calls. Uses httpx async client with TTL caching."""
from __future__ import annotations

import asyncio
from typing import Any

import httpx
from cachetools import TTLCache

from app.security import sanitize_text
from app.settings import settings

# Thread-safe TTL cache: 1h for most endpoints
_cache: TTLCache[str, Any] = TTLCache(maxsize=512, ttl=3600)
_cache_lock = asyncio.Lock()

_CLIENT: httpx.AsyncClient | None = None


def get_client() -> httpx.AsyncClient:
    global _CLIENT
    if _CLIENT is None or _CLIENT.is_closed:
        _CLIENT = httpx.AsyncClient(timeout=10.0)
    return _CLIENT


async def _get(path: str, params: dict[str, Any] | None = None) -> dict[str, Any]:
    base_params = {"api_key": settings.tmdb_api_key, "language": "en-US"}
    if params:
        base_params.update(params)

    cache_key = path + str(sorted(base_params.items()))
    async with _cache_lock:
        if cache_key in _cache:
            cached: dict[str, Any] = _cache[cache_key]
            return cached

    client = get_client()
    resp = await client.get(f"{settings.tmdb_base_url}/{path}", params=base_params)
    resp.raise_for_status()
    data: dict[str, Any] = resp.json()

    async with _cache_lock:
        _cache[cache_key] = data

    return data


def _sanitize_movie(m: dict[str, Any], genre_map: dict[int, str]) -> dict[str, Any]:
    genres = " ".join(genre_map.get(int(g), "") for g in m.get("genre_ids", []))
    overview = sanitize_text(m.get("overview", "") or "")
    title = sanitize_text(m.get("title", "") or "")
    return {
        "id": m["id"],
        "title": title,
        "overview": overview,
        "genres": genres,
        "poster_path": m.get("poster_path") or "",
        "vote_average": float(m.get("vote_average", 0)),
        "release_date": m.get("release_date") or "",
        "popularity": float(m.get("popularity", 0)),
    }


async def get_genre_map() -> dict[int, str]:
    data = await _get("genre/movie/list")
    return {int(g["id"]): g["name"] for g in data.get("genres", [])}


async def fetch_popular_movies(pages: int = 10) -> list[dict[str, Any]]:
    """Fetch popular, top-rated, now-playing, and upcoming movies from TMDB."""
    genre_map = await get_genre_map()
    seen: set[int] = set()
    movies: list[dict[str, Any]] = []

    endpoints = ["movie/popular", "movie/top_rated", "movie/now_playing", "movie/upcoming"]
    for page in range(1, pages + 1):
        for endpoint in endpoints:
            try:
                data = await _get(endpoint, {"page": page})
            except httpx.HTTPError:
                continue
            for m in data.get("results", []):
                mid = int(m["id"])
                if mid not in seen:
                    seen.add(mid)
                    movies.append(_sanitize_movie(m, genre_map))
    return movies


async def search_movies(query: str) -> list[dict[str, Any]]:
    """Search TMDB for movies matching the query string."""
    genre_map = await get_genre_map()
    data = await _get("search/movie", {"query": query})
    return [_sanitize_movie(m, genre_map) for m in data.get("results", [])[:20]]


async def get_movie_by_id(movie_id: int) -> dict[str, Any] | None:
    """Fetch a single movie from TMDB by its ID."""
    try:
        data = await _get(f"movie/{movie_id}")
    except httpx.HTTPStatusError:
        return None
    # movie/{id} returns genre objects (not genre_ids), so get_genre_map not needed
    genres = " ".join(sanitize_text(g.get("name", "")) for g in data.get("genres", []))
    return {
        "id": data["id"],
        "title": sanitize_text(data.get("title", "")),
        "overview": sanitize_text(data.get("overview", "") or ""),
        "genres": genres,
        "poster_path": data.get("poster_path") or "",
        "vote_average": float(data.get("vote_average", 0)),
        "release_date": data.get("release_date") or "",
        "popularity": float(data.get("popularity", 0)),
    }
