# HANDOFF_SCRIPT — PersonalAssistant
script: run.sh / run.ps1 — Docker Compose orchestration with health polling
prerequisites:
  - Docker Desktop (or Docker Engine + Compose plugin) installed
  - ~8GB RAM available (Ollama model)
  - Internet access for first run (pulls llama3.2:3b ~2GB)
env_vars_required: JWT_SECRET_KEY (min 32 chars, random)
run_command: bash run.sh (Linux/macOS) or .\run.ps1 (Windows)
known_limitations:
  - Ollama model pull on first run takes 2–5 minutes depending on connection
  - llama3.2:3b requires ~3GB VRAM or falls back to CPU (slow but functional)

files_produced:
| file | drive_path | status | notes |
|---|---|---|---|
| run.sh | Claude/PersonalAssistant/run.sh | ✅ complete | Linux/macOS bash launcher; checks docker + docker compose v2, .env, JWT_SECRET_KEY; health-polls http://localhost:8000/health |
| run.ps1 | Claude/PersonalAssistant/run.ps1 | ✅ complete | Windows PowerShell launcher; same logic; uses Invoke-WebRequest for health poll; requires PS 5.1+ |

deps_added: none

deviations: none

interfaces_exposed:
  - run.sh: bash run.sh (from project root)
  - run.ps1: .\run.ps1 (from project root, PowerShell 5.1+)

watch_out_for:
  - Both scripts use relative paths — must be run from the project root (where docker-compose.yml lives)
  - JWT_SECRET_KEY placeholder detection matches the exact string from .env.example: "change-this-to-a-random-secret-min-32-chars"
  - Health poll uses curl (run.sh) / Invoke-WebRequest (run.ps1) against http://localhost:8000/health — ensure backend exposes GET /health returning HTTP 200

HANDOFF STATUS: COMPLETE
