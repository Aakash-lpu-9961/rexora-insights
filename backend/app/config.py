from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    database_url: str = "postgresql+psycopg://rexora:rexora@localhost:5432/rexora"
    jwt_secret: str = "change-me"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24

    cors_allow_origins: str = "http://localhost:5173,http://localhost:4173"

    openai_api_key: str | None = None
    openai_model: str = "gpt-4o-mini"

    seed_demo_user_email: str = "demo@rexora.io"
    seed_demo_user_password: str = "rexora-demo"
    seed_demo_user_name: str = "Demo Engineer"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_allow_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
