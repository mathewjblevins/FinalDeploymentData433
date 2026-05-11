import json

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_DEFAULT_ORIGINS = ["http://localhost:3000"]


class Settings(BaseSettings):
    tmdb_api_key: str
    supabase_jwt_secret: str
    supabase_url: str
    supabase_anon_key: str
    allowed_origins: list[str] = _DEFAULT_ORIGINS
    redis_url: str | None = None
    tmdb_base_url: str = "https://api.themoviedb.org/3"
    tmdb_img_base: str = "https://image.tmdb.org/t/p/w500"
    corpus_pages: int = 10
    environment: str = "development"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    @field_validator("allowed_origins", mode="before")
    @classmethod
    def parse_origins(cls, v: object) -> object:
        if not isinstance(v, str):
            return v
        v = v.strip()
        if not v:
            return _DEFAULT_ORIGINS
        try:
            return json.loads(v)
        except json.JSONDecodeError:
            return [o.strip() for o in v.split(",") if o.strip()]


settings = Settings()  # raises ValueError at startup if required vars are missing
