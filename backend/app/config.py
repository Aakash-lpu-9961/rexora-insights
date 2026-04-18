from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    database_url: str = "sqlite:////data/app.db"

    @field_validator("database_url", mode="after")
    @classmethod
    def _swap_unreachable_local_postgres(cls, value: str) -> str:
        """Fall back to SQLite on the Fly volume when the provided URL points
        at a local Postgres that isn't running.

        Older deploys of this app set ``DATABASE_URL=postgresql+psycopg://.../@localhost:5432/...``
        as a Fly secret. The app now ships with an embedded SQLite default that
        writes to the persistent volume at ``/data``; if Fly still injects the
        stale Postgres URL we'd crash on startup. Prefer the volume when it's
        available rather than try to reach a non-existent local Postgres.
        """
        if ("localhost:5432" in value or "127.0.0.1:5432" in value) and Path("/data").is_dir():
            return "sqlite:////data/app.db"
        return value

    jwt_secret: str = "change-me"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24

    cors_allow_origins: str = (
        "http://localhost:5173,http://localhost:4173,"
        "https://dist-lwtnobaf.devinapps.com"
    )
    # Accept any devinapps.com preview subdomain so future frontend rebuilds
    # (which produce a new random subdomain) don't require a backend redeploy.
    cors_allow_origin_regex: str = r"https://[a-z0-9-]+\.devinapps\.com"

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
