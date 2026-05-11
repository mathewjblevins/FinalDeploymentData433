from __future__ import annotations

import bleach
from jose import JWTError, jwt

from app.settings import settings

ALGORITHM = "HS256"


def verify_supabase_jwt(token: str) -> dict[str, object]:
    """Decode and verify a Supabase-issued JWT. Raises JWTError on failure."""
    try:
        payload: dict[str, object] = jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=[ALGORITHM],
            options={"verify_aud": False},  # Supabase doesn't set a standard aud
        )
        return payload
    except JWTError:
        raise


def sanitize_text(raw: str) -> str:
    """Strip all HTML tags from a string (server-side XSS defense)."""
    return bleach.clean(raw, tags=[], attributes={}, strip=True)
