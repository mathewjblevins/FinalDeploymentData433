from fastapi import APIRouter

from app.schemas import HealthResponse
from app.settings import settings

router = APIRouter()

VERSION = "0.1.0"


@router.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    return HealthResponse(ok=True, version=VERSION, environment=settings.environment)
