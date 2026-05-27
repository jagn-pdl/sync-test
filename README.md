# PersonalAssistant

A web-based Socratic life-guidance app that initiates onboarding conversations to learn the user's personal traits (age, height, weight, lifestyle, goals), then dynamically generates UI widgets to collect structured data about current problems across any domain — health, finance, career, relationships, and more.

Every successive conversation compacts prior context into a minimal user-profile vector, enabling a small 2–3B Ollama model to always have the most relevant snapshot of the user — helping them think through decisions rather than prescribing answers.

---

## Prerequisites

- **Docker Desktop** (or Docker Engine + Compose plugin v2) — https://docs.docker.com/get-docker/
- **Docker Compose v2** (`docker compose` — not `docker-compose`)
- **~8 GB RAM** recommended (Ollama needs ~3 GB for llama3.2:3b)
- Internet access on first run (Ollama pulls ~2 GB model automatically)

> **No Ollama installation required.** The `ollama` service in docker-compose pulls and runs the model for you.

---

## Quick Start

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd PersonalAssistant

# 2. Create your environment file
cp .env.example .env

# 3. Set a strong JWT secret (required)
#    Generate one: openssl rand -hex 32
#    Edit .env → replace the placeholder value for JWT_SECRET_KEY

# 4. Build and start all services
docker compose up --build
```

On first run, Ollama downloads `llama3.2:3b` (~2 GB). This takes **2–5 minutes** depending on your connection. The backend waits for Ollama to become healthy before starting.

Once running, open **http://localhost** in your browser.

---

## Environment Variables

All variables are defined in `.env.example`. Copy it to `.env` and edit before running.

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `sqlite+aiosqlite:////data/sqlite/app.db` | DB connection string (SQLite dev / PostgreSQL prod) |
| `JWT_SECRET_KEY` | *(required)* | ≥32 char random secret for JWT signing |
| `JWT_ALGORITHM` | `HS256` | JWT signing algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `60` | Access token lifetime in minutes |
| `REFRESH_TOKEN_EXPIRE_DAYS` | `30` | Refresh token lifetime in days |
| `OLLAMA_BASE_URL` | `http://ollama:11434` | Ollama service URL |
| `OLLAMA_MODEL` | `llama3.2:3b` | Model to use for inference (swappable) |
| `CHROMA_PERSIST_DIR` | `/data/chroma` | ChromaDB persistence path (must be a volume mount in prod) |
| `APP_ENV` | `development` | `development` or `production` |
| `CORS_ORIGINS` | `http://localhost,http://localhost:80` | Allowed CORS origins (comma-separated) |

---

## Architecture

```
Browser → :80 (nginx / frontend)
  ├── /                → serves static SPA (Vite build, Vanilla TypeScript)
  └── /api/*           → proxied to backend:8000/*

backend:8000 (FastAPI + Python 3.12)
  ├── SQLite (dev) / PostgreSQL (prod) — via SQLAlchemy 2.0 async + Alembic
  ├── ChromaDB 0.5 (embedded, file-persisted) — user profile vectors
  └── httpx → ollama:11434 (LLM inference, llama3.2:3b)

ollama:11434
  └── llama3.2:3b (auto-pulled on first run)
```

**Named Docker volumes** (persist across restarts):
- `ollama_data` — downloaded model weights
- `chroma_data` — ChromaDB profile vectors
- `sqlite_data` — SQLite database (dev only; use PostgreSQL in prod)

---

## URL Map

| URL | Description |
|---|---|
| `/` | Landing page — app intro, login / register CTA |
| `/login` | Email + password login |
| `/register` | Create account (starts onboarding immediately) |
| `/onboarding` | Guided trait collection via generative UI steps |
| `/chat` | Primary chat interface with dynamic widget injection |
| `/profile` | View compacted profile summary, edit static traits |
| `/api/*` | FastAPI backend (proxied by nginx) |
| `/health` | Health check endpoint — `GET /health` → `{"status": "ok"}` |

---

## Development Without Docker

### Backend

```bash
cd src/backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Copy and edit .env (point DATABASE_URL to a local path, OLLAMA_BASE_URL to localhost:11434)
cp ../../.env.example .env

# Run database migrations
alembic upgrade head

# (Optional) seed demo user: demo@personalassistant.local / demo1234
python seed.py

# Start the API server
uvicorn app.main:app --reload --port 8000
```

> You must have Ollama running locally (`ollama serve`) with `llama3.2:3b` pulled (`ollama pull llama3.2:3b`).

### Frontend

```bash
cd src/frontend
npm install
npm run dev     # starts Vite dev server at http://localhost:5173
```

The Vite dev server proxies `/api/*` to `localhost:8000`.

---

## Stopping

```bash
docker compose down
```

Data is persisted in named volumes and survives restarts. To wipe everything (including the downloaded model):

```bash
docker compose down -v
```
