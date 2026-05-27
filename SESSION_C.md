# SESSION_C — PersonalAssistant — Infrastructure + Config

identity:
  role: Produce all infrastructure, containerization, and config files. Zero application logic.
  drive_folder: Claude/PersonalAssistant/
  reads: RULES.md, PLAN.md

## startup
1. Print:
   ════════════════════════════════════════
   ⚠️ IF THIS SESSION IS CUT OFF:
   New chat → connect Google Drive → paste:
   "Resume SESSION_C for Claude/PersonalAssistant/ — check Drive for completed files and continue."
   ════════════════════════════════════════
2. Read RULES.md from Drive.
3. Run already_run_guard (RULES.md).
4. Read PLAN.md — absorb tech_stack, file_ownership, api_routes.

## context
Stack:
- Backend: FastAPI 0.111, Python 3.12, SQLAlchemy 2.0 async, Alembic, ChromaDB 0.5, python-jose, bcrypt, httpx (Ollama client), uvicorn
- Frontend: Vanilla TypeScript, Vite 5
- Ollama runs as a separate Docker service exposing :11434
- ChromaDB is embedded in the backend process (file-persisted at /data/chroma)
- Three Docker services: backend, frontend (nginx), ollama
- SQLite for dev (file at /data/app.db), PostgreSQL for prod via DATABASE_URL env

## files_to_produce
| file | drive_path |
|---|---|
| docker-compose.yml | Claude/PersonalAssistant/docker-compose.yml |
| Dockerfile.backend | Claude/PersonalAssistant/Dockerfile.backend |
| Dockerfile.frontend | Claude/PersonalAssistant/Dockerfile.frontend |
| nginx.conf | Claude/PersonalAssistant/nginx.conf |
| requirements.txt | Claude/PersonalAssistant/src/backend/requirements.txt |
| package.json | Claude/PersonalAssistant/src/frontend/package.json |
| vite.config.ts | Claude/PersonalAssistant/src/frontend/vite.config.ts |
| tsconfig.json | Claude/PersonalAssistant/src/frontend/tsconfig.json |
| index.html | Claude/PersonalAssistant/src/frontend/index.html |
| alembic.ini | Claude/PersonalAssistant/src/backend/alembic.ini |
| alembic/env.py | Claude/PersonalAssistant/src/backend/alembic/env.py |
| alembic/script.py.mako | Claude/PersonalAssistant/src/backend/alembic/script.py.mako |
| .env.example | Claude/PersonalAssistant/.env.example |
| DEPLOY.md | Claude/PersonalAssistant/DEPLOY.md |

## instructions

### docker-compose.yml
Three services:
1. **ollama**: image ollama/ollama:latest. Volume: ollama_data:/root/.ollama. Port 11434 (internal only). Healthcheck: curl -f http://localhost:11434/api/tags. Entrypoint: pull llama3.2:3b on startup if not present (use a shell entrypoint script or command).
2. **backend**: build Dockerfile.backend. depends_on ollama (condition: service_healthy). Volumes: ./src/backend:/app, chroma_data:/data/chroma, sqlite_data:/data/sqlite. Environment: from .env file. Port 8000 (internal). Command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload (dev). Healthcheck: curl -f http://localhost:8000/health.
3. **frontend**: build Dockerfile.frontend. depends_on backend (condition: service_healthy). Port 80:80. Volumes: none at runtime (static build).

Named volumes: ollama_data, chroma_data, sqlite_data.

### Dockerfile.backend
- FROM python:3.12-slim
- Install curl (healthcheck), build-essential (chromadb C deps)
- WORKDIR /app
- COPY requirements.txt → pip install --no-cache-dir
- COPY src/backend/ .
- Run alembic upgrade head on container start (use entrypoint.sh)
- Expose 8000

### Dockerfile.frontend
Multi-stage:
- Stage 1 (builder): node:20-alpine, WORKDIR /app, copy package.json, npm ci, copy src/frontend/, npm run build
- Stage 2 (serve): nginx:alpine, copy nginx.conf, copy --from=builder /app/dist /usr/share/nginx/html
- Expose 80

### nginx.conf
- Serve static files from /usr/share/nginx/html
- SPA fallback: try_files $uri $uri/ /index.html
- Proxy /api/ → http://backend:8000/ (strip /api prefix)
- Gzip enabled for js, css, html, json
- Cache-Control: immutable for hashed assets, no-cache for index.html

### requirements.txt
Pin exact versions:
```
fastapi==0.111.0
uvicorn[standard]==0.29.0
sqlalchemy[asyncio]==2.0.30
aiosqlite==0.20.0
asyncpg==0.29.0
alembic==1.13.1
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.9
httpx==0.27.0
chromadb==0.5.0
pydantic==2.7.1
pydantic-settings==2.2.1
python-dotenv==1.0.1
```

### package.json
```json
{
  "name": "personal-assistant-frontend",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "5.4.5",
    "vite": "5.2.11"
  }
}
```
No runtime dependencies — pure vanilla TS.

### vite.config.ts
- Base: '/'
- Build output: dist/
- Server proxy: /api → http://localhost:8000 (dev only)
- Source maps in dev
- TypeScript paths matching tsconfig

### tsconfig.json
- target: ES2022
- module: ESNext, moduleResolution: bundler
- strict: true
- paths: { "@/*": ["./src/*"] }
- outDir: dist, rootDir: src

### index.html
Minimal shell:
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>PersonalAssistant</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```
Style imports happen inside main.ts.

### alembic.ini
Standard alembic config. script_location = alembic. sqlalchemy.url left blank (set by env.py from DATABASE_URL env var).

### alembic/env.py
Async alembic env. Reads DATABASE_URL from environment. Imports Base from app.core.database for autogenerate. Uses run_async_migrations pattern.

### alembic/script.py.mako
Standard Alembic migration template.

### .env.example
```
# Database
DATABASE_URL=sqlite+aiosqlite:////data/sqlite/app.db

# Auth
JWT_SECRET_KEY=change-this-to-a-random-secret-min-32-chars
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=30

# Ollama
OLLAMA_BASE_URL=http://ollama:11434
OLLAMA_MODEL=llama3.2:3b

# ChromaDB
CHROMA_PERSIST_DIR=/data/chroma

# App
APP_ENV=development
CORS_ORIGINS=http://localhost,http://localhost:80
```

### DEPLOY.md
Document:
1. Prerequisites: Docker, Docker Compose v2, 8GB RAM recommended (Ollama model)
2. Setup: clone repo, copy .env.example to .env, fill JWT_SECRET_KEY
3. First run: docker compose up --build (Ollama will pull llama3.2:3b ~2GB on first start)
4. Access: http://localhost
5. Production notes: change DATABASE_URL to PostgreSQL, set APP_ENV=production, use reverse proxy with TLS
6. Stopping: docker compose down (data persists in named volumes)
7. Resetting: docker compose down -v (destroys all data)

## do_not_build
- Any Python application logic (models, routes, services)
- Any TypeScript components or pages
- Any CSS files

## handoff
Write to Claude/PersonalAssistant/handoffs/HANDOFF_C.md

# HANDOFF_C — PersonalAssistant — Session C
plan_version: 1.0
files_produced: | file | drive_path | status | notes |
deps_added: see requirements.txt and package.json
deviations: none
interfaces_exposed:
  - Docker service names: backend (port 8000), frontend (port 80), ollama (port 11434)
  - Nginx proxy: /api/* → backend:8000/*
  - Env vars: see .env.example
watch_out_for:
  - Session D must use app.core.config.Settings (pydantic-settings) to read env vars — not os.environ directly
  - ChromaDB 0.5 requires sqlite3 >= 3.35; python:3.12-slim satisfies this
  - Ollama first-run pull takes 2–5 min; backend healthcheck retries should allow for this

HANDOFF STATUS: COMPLETE

---
▶ WHAT NEXT
════════════════════════════════════════
New chat → connect Google Drive → paste:
"Read SESSION_D.md from Claude/PersonalAssistant/ in Google Drive and begin."
════════════════════════════════════════
