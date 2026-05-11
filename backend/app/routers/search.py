from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query, Request, status

from app.limiter import limiter
from app.ml.tmdb import search_movies
from app.schemas import SearchResponse, SearchResult
from app.settings import settings

router = APIRouter()


def _poster_url(path: str | None) -> str | None:
    if not path:
        return None
    return f"{settings.tmdb_img_base}{path}"


@router.get("/search", response_model=SearchResponse)
@limiter.limit("30/minute")
async def search(
    request: Request,
    q: str = Query(..., min_length=1, max_length=120),
) -> SearchResponse:
    try:
        raw = await search_movies(q)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to contact TMDB",
        ) from exc

    results = [
        SearchResult(
            movie_id=int(m["id"]),
            title=str(m["title"]),
            overview=str(m["overview"]),
            release_date=m.get("release_date"),
            poster_path=m.get("poster_path"),
            poster_url=_poster_url(m.get("poster_path")),
            vote_average=float(m.get("vote_average", 0)),
        )
        for m in raw
    ]
    return SearchResponse(query=q, results=results)
