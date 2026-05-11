from slowapi import Limiter
from slowapi.util import get_remote_address

from app.settings import settings


def _key_func(request: object) -> str:
    user_id = getattr(getattr(request, "state", None), "user_id", None)
    if user_id:
        return str(user_id)
    return get_remote_address(request)  # type: ignore[arg-type]


limiter = Limiter(
    key_func=_key_func,
    storage_uri=settings.redis_url or "memory://",
    default_limits=["120/hour", "20/minute"],
)
