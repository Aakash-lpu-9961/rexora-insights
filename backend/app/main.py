from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .db import Base, SessionLocal, engine
from .routers import attachments, auth, cases, chat, checklists, contacts, modules, tracking
from .seed import seed_if_empty

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s — %(message)s")
logger = logging.getLogger("rexora")


@asynccontextmanager
async def lifespan(app: FastAPI):  # noqa: ARG001
    logger.info("Rexora backend starting up — creating tables and seeding if needed")
    Base.metadata.create_all(bind=engine)
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
    version="0.1.0",
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
