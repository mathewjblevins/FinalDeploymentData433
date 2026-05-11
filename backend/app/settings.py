from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    tmdb_api_key: str
    supabase_jwt_secret: str
    supabase_url: str
    supabase_anon_key: str
    allowed_origins: list[str] = ["http://localhost:3000"]
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


settings = Settings()  # raises ValueError at startup if required vars are missing
