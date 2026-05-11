from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    ok: bool
    version: str
    environment: str


class MovieBase(BaseModel):
    movie_id: int
    title: str
    overview: str
    genres: str
    poster_path: str | None
    vote_average: float
    release_date: str | None
    popularity: float


class MovieCard(MovieBase):
    poster_url: str | None = None


class RecommendRequest(BaseModel):
    movie_id: int = Field(..., gt=0)
    k: int = Field(default=12, ge=1, le=20)


class RecommendResponse(BaseModel):
    source: MovieCard
    recommendations: list[MovieCard]
    scores: list[float]


class SearchResult(BaseModel):
    movie_id: int
    title: str
    overview: str
    release_date: str | None
    poster_path: str | None
    poster_url: str | None
    vote_average: float


class SearchResponse(BaseModel):
    query: str
    results: list[SearchResult]


class TrendingResponse(BaseModel):
    movies: list[MovieCard]


class FavoriteIn(BaseModel):
    movie_id: int = Field(..., gt=0)
    title: str = Field(..., min_length=1, max_length=300)
    poster_path: str | None = None


class FavoriteOut(BaseModel):
    movie_id: int
    title: str
    poster_path: str | None
    added_at: datetime


class FavoritesResponse(BaseModel):
    favorites: list[FavoriteOut]


class ErrorResponse(BaseModel):
    detail: str
