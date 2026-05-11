from __future__ import annotations

from fastapi import APIRouter, HTTPException, Request, status
from supabase import Client, create_client

from app.deps import CurrentUser
from app.limiter import limiter
from app.schemas import FavoriteIn, FavoriteOut, FavoritesResponse
from app.settings import settings

router = APIRouter(prefix="/favorites", tags=["favorites"])


def _client(jwt: str) -> Client:
    """Create a Supabase client scoped to the user's JWT (respects RLS)."""
    client: Client = create_client(settings.supabase_url, settings.supabase_anon_key)
    client.postgrest.auth(jwt)
    return client


def _get_jwt(credentials_header: str | None) -> str:
    if not credentials_header:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No token")
    return credentials_header.replace("Bearer ", "")


@router.get("", response_model=FavoritesResponse)
@limiter.limit("60/minute")
async def get_favorites(request: Request, user: CurrentUser) -> FavoritesResponse:
    auth_header = request.headers.get("Authorization")
    jwt = _get_jwt(auth_header)
    client = _client(jwt)

    resp = client.table("favorites").select("*").order("added_at", desc=True).execute()
    favs = [
        FavoriteOut(
            movie_id=int(r["movie_id"]),
            title=str(r["title"]),
            poster_path=r.get("poster_path"),
            added_at=r["added_at"],
        )
        for r in (resp.data or [])
    ]
    return FavoritesResponse(favorites=favs)


@router.post("", status_code=status.HTTP_201_CREATED)
@limiter.limit("30/minute")
async def add_favorite(
    request: Request,
    body: FavoriteIn,
    user: CurrentUser,
) -> dict[str, str]:
    auth_header = request.headers.get("Authorization")
    jwt = _get_jwt(auth_header)
    user_id = str(user.get("sub", ""))
    client = _client(jwt)

    client.table("favorites").upsert(
        {
            "user_id": user_id,
            "movie_id": body.movie_id,
            "title": body.title,
            "poster_path": body.poster_path,
        }
    ).execute()
    return {"status": "ok"}


@router.delete("/{movie_id}", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("30/minute")
async def remove_favorite(
    request: Request,
    movie_id: int,
    user: CurrentUser,
) -> None:
    auth_header = request.headers.get("Authorization")
    jwt = _get_jwt(auth_header)
    user_id = str(user.get("sub", ""))
    client = _client(jwt)

    client.table("favorites").delete().eq("user_id", user_id).eq(
        "movie_id", movie_id
    ).execute()
