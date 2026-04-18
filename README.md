# Rexora — Resolve Faster. Work Smarter.

Rexora is an internal AI-assisted troubleshooting platform for support engineers working on
finance modules such as Bank Reconciliation, Intercompany, ETL, GL and AP. It combines
structured knowledge (checklists, past cases, contacts, tracking requests, attachments) with an
OpenAI-powered triage chatbot that grounds every answer in a module's own data.

- **Frontend:** React 19 + TypeScript + Vite + Tailwind v4 + shadcn/ui + TanStack Router.
- **Backend:** FastAPI + SQLAlchemy + PostgreSQL + JWT auth + OpenAI structured output.
- **Deployment targets:** devinapps (frontend), Fly.io + Postgres volume (backend).

---

## Architecture

```
┌────────────────────────────┐        ┌────────────────────────────┐
│  Vite SPA (React + TS)     │        │  FastAPI (Python 3.11)     │
│  TanStack Router           │──JWT──▶│  SQLAlchemy + Pydantic     │
│  ModuleProvider + API      │  JSON  │  JWT auth · OpenAI triage  │
│  Tailwind + shadcn/ui      │        │  CORS                      │
└───────────┬────────────────┘        └──────────────┬─────────────┘
            │                                        │
            ▼                                        ▼
     devinapps CDN                           Fly.io Postgres volume
```

The frontend is a pure client-rendered SPA. Auth is kept in `localStorage` under
`rexora.auth.v1`; the module selection is kept under `rexora.selectedModule.v2`. All data is
fetched on demand from the backend per module — nothing is hard-coded.

---

## Features

- **Module-driven:** every finance module has its own overview, checklists, past cases,
  contacts, tracking requests, and attachments. Adding a new module in **Settings** creates a
  fresh, empty workspace.
- **JWT authentication:** `/login` (with register flow) + route guard, demo credentials
  `demo@rexora.io` / `rexora-demo`.
- **Checklist Library:** expandable cards, per-step completion tracking, add/delete.
- **Past Cases:** searchable cards with priority, team, tags, root cause, resolution.
- **Point of Contact:** engineer cards with avatar initials, searchable by name/role/team.
- **Tracking Requests:** status workflow (Open → In Review → In Progress → Done).
- **Attachments:** tabbed Documents / Videos / Presentations.
- **AI Chatbot:** returns structured JSON (root causes with confidence, step-by-step
  troubleshooting, similar past cases, final fix, notes). Backed by `gpt-4o-mini`. Falls back
  to a deterministic heuristic response when `OPENAI_API_KEY` is not set.

---

## Repo layout

```
rexora-insights/
├── src/                 # React frontend (Vite SPA)
│   ├── routes/          # TanStack file-based routes
│   ├── lib/
│   │   ├── api.ts              # typed fetch wrapper with JWT
│   │   ├── auth-context.tsx    # useAuth() — login/register/logout
│   │   └── module-store.tsx    # useModuleStore() — per-module CRUD over the API
│   └── components/      # Layout, UI primitives, RequireAuth
├── backend/             # FastAPI backend
│   ├── app/
│   │   ├── main.py, config.py, db.py, auth.py, models.py, schemas.py, seed.py, ai.py
│   │   └── routers/     # auth, modules, checklists, cases, contacts, tracking, attachments, chat
│   ├── Dockerfile
│   ├── pyproject.toml
│   └── .env.example
└── README.md
```

---

## Quick start (local)

### 1. Postgres

```bash
docker run -d --name rexora-pg \
  -e POSTGRES_USER=rexora -e POSTGRES_PASSWORD=rexora -e POSTGRES_DB=rexora \
  -p 5432:5432 postgres:16-alpine
```

### 2. Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
cp .env.example .env        # fill in OPENAI_API_KEY / JWT_SECRET
uvicorn app.main:app --reload --host 0.0.0.0 --port 8080
```

Tables are created automatically and demo data (Bank Reconciliation module + demo user) is
seeded on first start. OpenAPI docs at http://localhost:8080/docs.

### 3. Frontend

```bash
# From the repo root
npm install
echo "VITE_API_URL=http://localhost:8080" > .env.local
npm run dev      # http://localhost:5173
```

Log in with `demo@rexora.io` / `rexora-demo`.

---

## API overview

All endpoints except `/api/auth/*` require `Authorization: Bearer <token>`.

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/auth/register` | Create a user |
| POST | `/api/auth/login` | Exchange email + password for a JWT |
| GET  | `/api/auth/me` | Current user |
| GET/POST | `/api/modules` | List / create modules |
| GET/PATCH/DELETE | `/api/modules/{id}` | Inspect / rename / delete a module |
| GET/POST | `/api/modules/{id}/checklists` | List / create checklists |
| PATCH/DELETE | `/api/modules/{id}/checklists/{cid}` | Update / remove |
| GET/POST | `/api/modules/{id}/cases` | List / create past cases |
| DELETE | `/api/modules/{id}/cases/{cid}` | Remove a case |
| GET/POST | `/api/modules/{id}/contacts` | List / create contacts |
| DELETE | `/api/modules/{id}/contacts/{cid}` | Remove a contact |
| GET/POST | `/api/modules/{id}/tracking` | List / create tracking requests |
| PATCH/DELETE | `/api/modules/{id}/tracking/{tid}` | Update / remove |
| GET/POST | `/api/modules/{id}/attachments` | List / create attachments |
| DELETE | `/api/modules/{id}/attachments/{aid}` | Remove an attachment |
| POST | `/api/chat` | Structured AI triage for a module |

### AI chat contract

```http
POST /api/chat
{
  "module_id": "bank-recon",
  "message": "BAI2 file stuck in pending status"
}
```

```json
{
  "rootCauses": [{ "label": "...", "confidence": 62 }],
  "steps": ["..."],
  "similarCases": [{ "id": "BR-2114", "title": "...", "tag": "Performance" }],
  "finalFix": "...",
  "notes": "..."
}
```

The backend passes the last ~20 cases and ~10 checklists for the selected module to OpenAI and
requests JSON output conforming to the schema above.

---

## Database schema

| Table | Key columns |
| --- | --- |
| `users` | `id`, `email` (unique), `hashed_password`, `name` |
| `modules` | `id` (slug), `name`, `short`, `color`, `progress`, `overview` (JSON), `chat_greeting`, `chat_suggestions` (JSON) |
| `checklists` | `id`, `module_id → modules.id`, `title`, `description`, `steps` (JSON), `sort_order` |
| `cases` | `id`, `module_id`, `summary`, `root_cause`, `resolution`, `tags` (JSON), `priority`, `case_date`, `team`, `client_id` |
| `contacts` | `id`, `module_id`, `name`, `role`, `team`, `email`, `initials` |
| `tracking_requests` | `id`, `module_id`, `title`, `description`, `status`, `tags` (JSON) |
| `attachments` | `id`, `module_id`, `kind` (`document`/`video`/`ppt`), `name`, `size`, `duration`, `file_type`, `url`, `updated` |

Every row except `users` is scoped to a `module_id` so modules remain fully independent.

---

## Environment variables

### Backend (`backend/.env`)

| Var | Purpose |
| --- | --- |
| `DATABASE_URL` | SQLAlchemy URL, e.g. `postgresql+psycopg://rexora:rexora@localhost:5432/rexora` |
| `JWT_SECRET` | Long random string used to sign JWTs |
| `JWT_ALGORITHM` | Default `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Default `1440` (24h) |
| `CORS_ALLOW_ORIGINS` | Comma-separated origins (e.g. `https://rexora.example.com`) |
| `OPENAI_API_KEY` | Optional. Real AI triage when set; heuristic fallback otherwise. |
| `OPENAI_MODEL` | Default `gpt-4o-mini` |
| `SEED_DEMO_USER_EMAIL` / `SEED_DEMO_USER_PASSWORD` / `SEED_DEMO_USER_NAME` | Demo account created on first boot |

### Frontend (`.env.local`)

| Var | Purpose |
| --- | --- |
| `VITE_API_URL` | Backend base URL (e.g. `https://rexora-api.fly.dev`). Defaults to `http://localhost:8080` in dev. |

---

## Deployment

### Backend → Fly.io

```bash
cd backend
fly launch --no-deploy --name rexora-api --region iad
fly pg create --name rexora-db --region iad
fly pg attach rexora-db -a rexora-api           # sets DATABASE_URL
fly secrets set \
  JWT_SECRET="$(openssl rand -hex 48)" \
  OPENAI_API_KEY="$OPENAI_API_KEY" \
  CORS_ALLOW_ORIGINS="https://<your-frontend-domain>"
fly deploy
```

### Frontend → devinapps

```bash
# From repo root, with VITE_API_URL set to the deployed backend URL
echo "VITE_API_URL=https://rexora-api.fly.dev" > .env.local
npm run build
# upload dist/ to the devinapps static host
```

---

## Scripts

### Frontend

- `npm run dev` — Vite dev server
- `npm run build` — `tsc --noEmit && vite build`
- `npm run lint` — ESLint
- `npm run preview` — serve the built dist

### Backend

- `uvicorn app.main:app --reload --port 8080` — dev server
- `ruff check backend/app` — lint
- `mypy backend/app` — types

---

## Demo credentials

| Email | Password |
| --- | --- |
| `demo@rexora.io` | `rexora-demo` |

The seeded **Bank Reconciliation** module includes representative checklists, past cases,
contacts, tracking requests and attachments so the app feels populated on first login.
