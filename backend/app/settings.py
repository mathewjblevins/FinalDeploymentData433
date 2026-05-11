import json

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    tmdb_api_key: str
    supabase_jwt_secret: str
    supabase_url: str
    supabase_anon_key: str
    # Stored as a raw string so pydantic-settings never tries to JSON-parse it.
    # Use the `allowed_origins` property everywhere; set ALLOWED_ORIGINS in env
    # as either JSON ("["url"]") or comma-separated ("url1,url2").
    allowed_origins_raw: str = "http://localhost:3000"
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

    @property
    def allowed_origins(self) -> list[str]:
        v = self.allowed_origins_raw.strip()
        if not v:
            return ["http://localhost:3000"]
        try:
            result = json.loads(v)
            return result if isinstance(result, list) else [str(result)]
        except json.JSONDecodeError:
            return [o.strip() for o in v.split(",") if o.strip()]


settings = Settings()  # raises ValueError at startup if required vars are missing
