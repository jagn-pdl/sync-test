# SESSION_SCRIPT — PersonalAssistant — Run Script

identity:
  role: Produce platform run artifacts (run.sh + run.ps1). Zero application logic.
  drive_folder: Claude/PersonalAssistant/

## startup
1. Print:
   ════════════════════════════════════════
   ⚠️ IF THIS SESSION IS CUT OFF:
   New chat → connect Google Drive → paste:
   "Resume SESSION_SCRIPT for Claude/PersonalAssistant/ — check Drive for completed files and continue."
   ════════════════════════════════════════
2. Read RULES.md from Drive.
3. Run already_run_guard (RULES.md).
4. Pull PLAN.md, STITCH_HANDOFF_A, .env.example from Drive.

## script_requirements
Platform: web (Docker Compose).
Produce: run.sh (Linux/macOS) + run.ps1 (Windows PowerShell).

Both scripts must:
1. Check required tools: docker, docker compose (v2 syntax — not docker-compose).
   Print install instructions and exit 1 if missing.
2. Check .env file exists. If not, copy .env.example → .env and print:
   "⚠️  .env created from .env.example. Please set JWT_SECRET_KEY before proceeding."
   Then exit 1 (user must fill secrets before first run).
3. Validate JWT_SECRET_KEY in .env is set and not the example placeholder value.
   If placeholder detected: print warning and exit 1.
4. Print status at each step.
5. Run: docker compose up --build -d
6. Wait for backend health: poll http://localhost:8000/health every 5s up to 60s.
   Print "⏳ Waiting for backend..." on each poll.
7. Print:
   ```
   ════════════════════════════════════════
   ✅ PersonalAssistant is running.
   Open: http://localhost
   Demo account: demo@personalassistant.local / demo1234
   Stop: docker compose down
   ════════════════════════════════════════
   ```
8. Use relative paths. No interactive prompts beyond what is documented here.

## files_to_produce
| file | drive_path |
|---|---|
| run.sh | Claude/PersonalAssistant/run.sh |
| run.ps1 | Claude/PersonalAssistant/run.ps1 |

## handoff
Write to Claude/PersonalAssistant/handoffs/HANDOFF_SCRIPT.md

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

HANDOFF STATUS: COMPLETE

---
▶ WHAT NEXT
════════════════════════════════════════
▶ PIPELINE COMPLETE

1. Download Claude/PersonalAssistant/ from Google Drive.
2. Copy .env.example → .env and set JWT_SECRET_KEY to a random 32+ char string.
3. Run: bash run.sh (Linux/macOS) or .\run.ps1 (Windows)
4. Open: http://localhost
5. Register or use demo account: demo@personalassistant.local / demo1234

⚠️ IF THE APP THROWS ERRORS:
New chat → connect Google Drive → paste this + your full error:
"Fix errors for Claude/PersonalAssistant/ — [paste full error/stack trace here]"
════════════════════════════════════════
