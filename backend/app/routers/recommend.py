from __future__ import annotations

from fastapi import APIRouter, HTTPException, Request, status

from app.limiter import limiter
from app.ml.model import get_recommendations
from app.schemas import MovieCard, RecommendRequest, RecommendResponse
from app.settings import settings

router = APIRouter()


def _to_card(row: dict[str, object]) -> MovieCard:
    path = str(row.get("poster_path") or "")
    poster_url = f"{settings.tmdb_img_base}{path}" if path else None
    return MovieCard(
        movie_id=int(row["id"]),  # type: ignore[call-overload]
        title=str(row.get("title", "")),
        overview=str(row.get("overview", "")),
        genres=str(row.get("genres", "")),
        poster_path=path or None,
        vote_average=float(row.get("vote_average", 0)),  # type: ignore[arg-type]
        release_date=str(row.get("release_date") or ""),
        popularity=float(row.get("popularity", 0)),  # type: ignore[arg-type]
        poster_url=poster_url,
    )


@router.post("/recommend", response_model=RecommendResponse)
@limiter.limit("60/minute")
async def recommend(
    request: Request,
    body: RecommendRequest,
) -> RecommendResponse:
    result = await get_recommendations(body.movie_id, k=body.k)

    if result["source"] is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Movie {body.movie_id} not found",
        )

    source = _to_card(result["source"])
    recs = [_to_card(r) for r in result["recommendations"]]
    scores: list[float] = result["scores"]

    return RecommendResponse(source=source, recommendations=recs, scores=scores)
