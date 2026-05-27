# SESSION_FIX — PersonalAssistant — Error Fix

identity:
  role: Diagnose and fix errors. Change only what is broken.
  drive_folder: Claude/PersonalAssistant/
  tech_stack: FastAPI 0.111 / Python 3.12 / SQLAlchemy 2.0 async / ChromaDB 0.5 / Ollama / Vanilla TypeScript / Vite 5 / Docker Compose
  project_root: src/

## startup
Print:
════════════════════════════════════════
⚠️ IF THIS SESSION IS CUT OFF:
New chat → connect Google Drive → paste this + your original error:
"Fix errors for Claude/PersonalAssistant/ — [paste full error/stack trace here]"
════════════════════════════════════════
Read RULES.md and PLAN.md from Drive.

## phase 1 — diagnose
Read the error. Identify file and line. Pull that file + dependency manifest from Drive.
Print:
  📋 DIAGNOSIS: [error] — [type] — in [file(s)] — [one-line fix plan]

Types: app_wont_start | runtime_error | wrong_behaviour | ui_broken | missing_feature
app_wont_start → fix crash first. Nothing else until it runs.

Do not write code yet.

## phase 2 — fix
Work from current Drive versions.
For each fix: state what is being fixed → output complete replacement file → overwrite to Drive.
If a fix forces a change elsewhere, fix that file too and explain why.

Print:
  ✅ FIX SUMMARY
  [error]: fixed in [file(s)]
  Untouched: [adjacent files left alone]
  Download updated files → replace in project root → re-run.

## common_issues_reference
- Ollama 503: check OLLAMA_BASE_URL in .env, check ollama container is healthy (docker compose ps)
- ChromaDB sqlite3 error: ensure python:3.12-slim base image (not 3.11)
- Alembic "target database is not up to date": run docker compose exec backend alembic upgrade head
- CORS error: check CORS_ORIGINS in .env includes http://localhost
- TypeScript "Cannot find module @/*": check tsconfig.json paths + vite.config.ts resolve.alias
- Widget not rendering: check widget JSON is valid — LLM sometimes emits malformed JSON inside <widget>

## rules
- Never rewrite files that are not broken.
- Never ask user which files are relevant — infer from error.
- If error is ambiguous, ask ONE clarifying question before fixing.

---
▶ WHAT NEXT — print this at the end of the session
════════════════════════════════════════
1. Download updated files from Claude/PersonalAssistant/src/ in Google Drive.
2. Replace in your local project root.
3. Re-run: bash run.sh (or .\run.ps1 on Windows)

⚠️ IF ERRORS PERSIST OR NEW ERRORS APPEAR:
New chat → connect Google Drive → paste this + your new error:
"Fix errors for Claude/PersonalAssistant/ — [paste full error/stack trace here]"
════════════════════════════════════════
