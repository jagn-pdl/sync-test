# DEPLOY.md — PersonalAssistant

## Prerequisites

- Docker Desktop (or Docker Engine + Compose plugin v2) — https://docs.docker.com/get-docker/
- Docker Compose v2 (`docker compose` — not `docker-compose`)
- ~8 GB RAM recommended (Ollama needs ~3 GB for llama3.2:3b; the rest for backend + frontend)
- Internet access on first run (Ollama pulls ~2 GB model)

---

## Setup

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd PersonalAssistant

# 2. Create your environment file
cp .env.example .env

# 3. Set your JWT secret (required — must be ≥ 32 random characters)
# Generate one: openssl rand -hex 32
# Edit .env and replace the placeholder value for JWT_SECRET_KEY
```

---

## First Run

```bash
docker compose up --build
```

On the very first run, Ollama will pull `llama3.2:3b` (~2 GB). This takes **2–5 minutes** depending on your connection. The backend will wait for Ollama to become healthy before starting.

Once running, open your browser at: **http://localhost**

---

## Database Migrations

Migrations run automatically on every container start (`alembic upgrade head` is called by `entrypoint.sh` before uvicorn). To run manually:

```bash
docker compose exec backend alembic upgrade head
```

---

## Seed Data (Optional)

Creates a demo user `demo@personalassistant.local` / `demo1234`:

```bash
docker compose exec backend python seed.py
```

The seed script is idempotent — safe to run multiple times.

---

## Health Check

```bash
curl http://localhost/api/health
# → {"status": "ok"}
```

A 200 response confirms the backend is running and the database connection is active.

---

## Stopping

```bash
docker compose down
```

Data is persisted in Docker named volumes (`ollama_data`, `chroma_data`, `sqlite_data`) and survives restarts.

---

## Resetting All Data

```bash
docker compose down -v
```

**Warning:** `-v` destroys all named volumes, including the database, ChromaDB profiles, and the downloaded Ollama model. Ollama will re-download the model on next start.

---

## Production Deployment

### Production Checklist

- [ ] **JWT_SECRET_KEY**: Generate a strong random secret — minimum 32 characters.
  ```bash
  openssl rand -hex 32
  ```
- [ ] **DATABASE_URL**: Switch from SQLite to PostgreSQL 16:
  ```
  DATABASE_URL=postgresql+asyncpg://user:password@host:5432/dbname
  ```
- [ ] **CHROMA_PERSIST_DIR**: Ensure this path is backed by a persistent volume mount — not a container-local directory. ChromaDB data is lost on container restart without a volume.
- [ ] **APP_ENV**: Set to `production`.
- [ ] **CORS_ORIGINS**: Set to your production domain(s):
  ```
  CORS_ORIGINS=https://yourdomain.com
  ```
- [ ] **Single uvicorn worker**: ChromaDB's embedded `PersistentClient` is **not thread-safe for concurrent writes**. The Docker setup uses a single uvicorn worker by default. Do **not** scale `--workers` beyond 1 unless you move ChromaDB to a separate server process.
- [ ] **TLS**: Place a reverse proxy (nginx, Caddy, Traefik) in front of the frontend container to terminate HTTPS. Do not expose port 80 directly in production.
- [ ] **Ollama GPU** (optional): If your server has an NVIDIA GPU, add the `deploy.resources.reservations.devices` block to the `ollama` service in `docker-compose.yml`:
  ```yaml
  deploy:
    resources:
      reservations:
        devices:
          - driver: nvidia
            count: 1
            capabilities: [gpu]
  ```

### Ollama Model

The `ollama` service automatically pulls `llama3.2:3b` on first run. The model must be fully downloaded before the backend starts accepting requests. The healthcheck gives Ollama up to 150 seconds (`start_period=30s`, 12 retries × 10s) to become ready.

To use a different model, set `OLLAMA_MODEL` in `.env`. Ensure the model is compatible with the `/api/chat` endpoint (Ollama models ≥ llama3 series recommended).

### Alembic Migration Step (Production)

Always run migrations before starting the new backend version:

```bash
docker compose exec backend alembic upgrade head
```

In CI/CD pipelines, run this as a pre-deploy step before routing traffic to the new container.

---

## Service Architecture

```
Browser → :80 (nginx/frontend)
  ├── /        → serves static SPA (dist/)
  └── /api/*   → proxied to backend:8000/*

backend:8000
  ├── FastAPI + SQLAlchemy (async)
  ├── ChromaDB (embedded, CHROMA_PERSIST_DIR)
  └── httpx → ollama:11434 (LLM inference)

ollama:11434
  └── llama3.2:3b (default model, swappable via OLLAMA_MODEL env)
```

---

## Environment Variables Reference

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `sqlite+aiosqlite:////data/sqlite/app.db` | DB connection string |
| `JWT_SECRET_KEY` | *(required)* | ≥32 char random secret for JWT signing |
| `JWT_ALGORITHM` | `HS256` | JWT signing algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `60` | Access token lifetime |
| `REFRESH_TOKEN_EXPIRE_DAYS` | `30` | Refresh token lifetime |
| `OLLAMA_BASE_URL` | `http://ollama:11434` | Ollama service URL |
| `OLLAMA_MODEL` | `llama3.2:3b` | Model to use for inference |
| `CHROMA_PERSIST_DIR` | `/data/chroma` | ChromaDB persistence path |
| `APP_ENV` | `development` | `development` or `production` |
| `CORS_ORIGINS` | `http://localhost,http://localhost:80` | Allowed CORS origins (comma-separated) |
