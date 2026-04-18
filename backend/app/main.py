from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text

from .config import get_settings
from .db import Base, SessionLocal, engine
from .routers import admin, attachments, auth, cases, chat, checklists, contacts, modules, tracking
from .seed import seed_if_empty

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s — %(message)s")
logger = logging.getLogger("rexora")


def _migrate_sqlite_lite() -> None:
    """Add columns to existing SQLite DBs that were created before this release.

    `Base.metadata.create_all` only creates missing tables — it does not add new
    columns to existing tables. On Fly's persistent volume the DB already exists,
    so we need a tiny idempotent migration for the new `users.role` column.
    """
    if not engine.url.get_backend_name().startswith("sqlite"):
        return
    insp = inspect(engine)
    if not insp.has_table("users"):
        return
    cols = {c["name"] for c in insp.get_columns("users")}
    if "role" not in cols:
        with engine.begin() as conn:
            logger.info("SQLite migration: adding users.role column")
            conn.execute(text("ALTER TABLE users ADD COLUMN role VARCHAR(16) NOT NULL DEFAULT 'user'"))


@asynccontextmanager
async def lifespan(app: FastAPI):  # noqa: ARG001
    import os
    logger.info(
        "Rexora backend starting up — creating tables and seeding if needed "
        "(engine=%s, env=%s)",
        engine.url.render_as_string(hide_password=True),
        os.environ.get("DATABASE_URL", "<unset>"),
    )
    Base.metadata.create_all(bind=engine)
    _migrate_sqlite_lite()
    db = SessionLocal()
    try:
        seed_if_empty(db)
    finally:
        db.close()
    yield


settings = get_settings()
app = FastAPI(
    title="Rexora API",
    description="AI-assisted troubleshooting platform for support engineers.",
    version="0.2.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list if settings.cors_origins_list else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(modules.router)
app.include_router(checklists.router)
app.include_router(cases.router)
app.include_router(contacts.router)
app.include_router(tracking.router)
app.include_router(attachments.router)
app.include_router(chat.router)
app.include_router(admin.router)


@app.get("/api/health", tags=["meta"])
def health() -> dict[str, str]:
    return {"status": "ok", "service": "rexora-backend"}


@app.get("/", tags=["meta"])
def root() -> dict[str, str]:
    return {
        "name": "Rexora API",
        "docs": "/docs",
        "health": "/api/health",
    }
