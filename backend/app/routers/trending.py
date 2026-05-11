from __future__ import annotations

from fastapi import APIRouter, Request

from app.limiter import limiter
from app.ml.corpus import get_corpus
from app.schemas import MovieCard, TrendingResponse
from app.settings import settings

router = APIRouter()


@router.get("/trending", response_model=TrendingResponse)
@limiter.limit("60/minute")
async def trending(request: Request) -> TrendingResponse:
    df = await get_corpus()
    top = df.nlargest(20, "popularity")

    movies = []
    for _, row in top.iterrows():
        path = str(row.get("poster_path") or "")
        poster_url = f"{settings.tmdb_img_base}{path}" if path else None
        movies.append(
            MovieCard(
                movie_id=int(row["id"]),
                title=str(row["title"]),
                overview=str(row.get("overview", "")),
                genres=str(row.get("genres", "")),
                poster_path=path or None,
                vote_average=float(row.get("vote_average", 0)),
                release_date=str(row.get("release_date") or ""),
                popularity=float(row.get("popularity", 0)),
                poster_url=poster_url,
            )
        )
    return TrendingResponse(movies=movies)
