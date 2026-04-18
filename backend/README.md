# Rexora Backend

FastAPI + SQLAlchemy + PostgreSQL + JWT auth + OpenAI structured output.

## Quick start (local)

```bash
# From backend/
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
cp .env.example .env
# edit DATABASE_URL / OPENAI_API_KEY / JWT_SECRET as needed
uvicorn app.main:app --reload --port 8080
```

The server creates its schema and seeds demo data (including the **Bank Reconciliation** module
and a demo user `demo@rexora.io` / `rexora-demo`) automatically on first start.

## Endpoints

- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- `GET/POST /api/modules`, `GET/PATCH/DELETE /api/modules/{id}`
- `GET/POST /api/modules/{id}/checklists`, `PATCH/DELETE /api/modules/{id}/checklists/{cid}`
- `GET/POST /api/modules/{id}/cases`, `PATCH/DELETE /api/modules/{id}/cases/{cid}`
- `GET/POST /api/modules/{id}/contacts`, `PATCH/DELETE /api/modules/{id}/contacts/{cid}`
- `GET/POST /api/modules/{id}/tracking`, `PATCH/DELETE /api/modules/{id}/tracking/{tid}`
- `GET/POST /api/modules/{id}/attachments`, `PATCH/DELETE /api/modules/{id}/attachments/{aid}`
- `POST /api/chat` — structured AI triage (uses OpenAI; falls back to a heuristic stub when
  `OPENAI_API_KEY` is absent)

Interactive OpenAPI docs: `/docs` (Swagger UI) and `/redoc`.

## Environment

See `.env.example`. Required in production:

- `DATABASE_URL` — e.g. `postgresql+psycopg://user:pass@host/db`
- `JWT_SECRET` — long random string
- `CORS_ALLOW_ORIGINS` — comma-separated list of allowed frontend origins
- `OPENAI_API_KEY` — enables real AI triage
