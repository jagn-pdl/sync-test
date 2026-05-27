# SESSION_STITCH_A — PersonalAssistant — Integration

identity:
  role: >
    Audit every file produced by Sessions B–G. Fix wiring gaps and known deviations.
    Produce README.md, final DEPLOY.md, and src/backend/app/core/errors.py.
    Do NOT add new features, new routes, or new domain models.
  drive_folder: Claude/PersonalAssistant/
  reads: RULES.md, PLAN.md, HANDOFF_B, HANDOFF_C, HANDOFF_D, HANDOFF_E, HANDOFF_F, HANDOFF_G

## startup
1. Print:
   ════════════════════════════════════════
   ⚠️ IF THIS SESSION IS CUT OFF:
   New chat → connect Google Drive → paste:
   "Resume SESSION_STITCH_A for Claude/PersonalAssistant/ — check Drive for completed files and continue."
   ════════════════════════════════════════
2. Read RULES.md from Drive.
3. Run already_run_guard (RULES.md).
4. Read PLAN.md + all HANDOFFs (B through G) from Drive.
5. Run pre_integration_audit (RULES.md) — verify every file claimed complete by every HANDOFF
   actually exists in Drive. Generate any that are ABSENT IN DRIVE before proceeding to fixes.
6. Work through the mandatory_fixes checklist below in order.
7. Run infrastructure_check (RULES.md).
8. Produce new files (README.md, DEPLOY.md final, errors.py).
9. Write HANDOFF_STITCH_A.md.

---

## mandatory_fixes
Work through these in order. Each fix: read the file from Drive, apply the change, overwrite to Drive,
print ✅ Drive: fixed [path]. If the file is already correct, print ✅ already correct [path] and move on.

### FIX-1 — main.py: swap _profile_stub import for real profile router
File: Claude/PersonalAssistant/src/backend/app/main.py
Problem: Session D wrote main.py importing `_profile_stub`. Session E produced the real
  `app.routers.profile` but Session D could not anticipate it. The stub import causes a
  NameError or missing-route failure at startup.
Action:
  - Find the line that imports or includes _profile_stub (likely:
      `from app.routers import _profile_stub` or `app.include_router(_profile_stub.router, ...)`)
  - Replace with:
      `from app.routers.profile import router as profile_router`
      and update the include_router call to use `profile_router` with prefix="/profile", tags=["profile"]
  - Verify no other reference to _profile_stub remains in main.py.

### FIX-2 — Frontend architecture: replace Vue/Pinia/Vue Router with Vanilla TypeScript
Files: ALL files under Claude/PersonalAssistant/src/frontend/src/
Problem (critical): PLAN.md and SESSION_G.md both specify Vanilla TypeScript — no framework,
  no Vue, no Pinia, no Vue Router. Session G deviated and produced Vue 3 + Pinia + Vue Router.
  package.json (Session C) does not include vue, pinia, or vue-router as dependencies, so the
  build will fail immediately. The .ts component files also contain Vue SFC patterns that Vite
  cannot compile as plain TypeScript.
Action — rewrite the following files as Vanilla TypeScript using the patterns defined in SESSION_G context:
  - Components are functions returning HTMLElement.
  - Pages are functions that mount into #app (clear and re-populate document.getElementById('app')).
  - Router is a hash-based popstate/hashchange listener (router.ts).
  - State stores (store/auth.ts, store/chat.ts) are plain module-level objects with getter/setter
    functions — no reactivity library.
  - API clients (api/*.ts) use native fetch() — no Axios (Axios is not in package.json).

  Rewrite these files (all under Claude/PersonalAssistant/src/frontend/src/):
  | file | notes |
  |---|---|
  | main.ts | import router, call router.init(), mount landing page |
  | router.ts | hashchange listener; map #/login → LoginPage, #/register → RegisterPage, etc. |
  | store/auth.ts | module-level { user, token }; exported getToken/setToken/getUser/setUser/logout |
  | store/chat.ts | module-level { conversations, activeId, messages, pendingWidget, isLoading } |
  | api/client.ts | base fetch wrapper; reads token from store/auth; throws on non-2xx |
  | api/auth.ts | login(email,pass), register(email,pass,name), getMe() using api/client |
  | api/chat.ts | sendMessage(convId, text, widgetResponse?), getChatHistory(convId) |
  | api/profile.ts | getProfile(), patchProfile(traits) |
  | components/layout/Header.ts | function Header(): HTMLElement |
  | components/layout/Sidebar.ts | function Sidebar(onNewConversation, onSelect): HTMLElement |
  | components/chat/ChatBubble.ts | function ChatBubble(message: Message): HTMLElement |
  | components/chat/ChatInput.ts | function ChatInput(onSend: (text:string)=>void): HTMLElement |
  | components/chat/TypingIndicator.ts | function TypingIndicator(): HTMLElement |
  | components/widgets/WidgetRenderer.ts | function WidgetRenderer(widget, onSubmit): HTMLElement |
  | components/widgets/SliderWidget.ts | function SliderWidget(widget, onSubmit): HTMLElement |
  | components/widgets/RadioWidget.ts | function RadioWidget(widget, onSubmit): HTMLElement |
  | components/widgets/CheckboxWidget.ts | function CheckboxWidget(widget, onSubmit): HTMLElement |
  | components/widgets/ScaleWidget.ts | function ScaleWidget(widget, onSubmit): HTMLElement |
  | components/widgets/TextInputWidget.ts | function TextInputWidget(widget, onSubmit): HTMLElement |
  | components/widgets/DatePickerWidget.ts | function DatePickerWidget(widget, onSubmit): HTMLElement |
  | components/widgets/MultiSelectWidget.ts | function MultiSelectWidget(widget, onSubmit): HTMLElement |
  | components/widgets/ConfirmWidget.ts | function ConfirmWidget(widget, onSubmit): HTMLElement |
  | pages/LandingPage.ts | function LandingPage(): void — mounts into #app |
  | pages/LoginPage.ts | function LoginPage(): void |
  | pages/RegisterPage.ts | function RegisterPage(): void |
  | pages/OnboardingPage.ts | function OnboardingPage(): void |
  | pages/ChatPage.ts | function ChatPage(): void — main chat UI |
  | pages/ProfilePage.ts | function ProfilePage(): void |
  | pages/NotFoundPage.ts | function NotFoundPage(): void |
  | types/index.ts | keep as-is if types match PLAN.md shared_contracts (verify first) |
  | utils/format.ts | keep as-is (no framework dependency) |
  | utils/storage.ts | keep as-is (localStorage wrappers — no framework dependency) |

### FIX-3 — UIWidgetType names: align frontend ↔ backend
Problem: PLAN.md shared_contracts defines UIWidgetType as:
  slider | radio_group | checkbox_group | date_picker | scale_rating | text_input | number_input | multi_select | confirm
  Session F's widget_parser.py (backend) emits these exact strings.
  Session G's WidgetRenderer used shortened names: radio | checkbox | scale (missing _group / _rating suffixes).
  WidgetRenderer dispatch will silently fall through to a no-op for those widget types.
Action: In WidgetRenderer.ts (already being rewritten in FIX-2), ensure the dispatch map uses the
  full PLAN.md names:
  "slider" → SliderWidget
  "radio_group" → RadioWidget
  "checkbox_group" → CheckboxWidget
  "date_picker" → DatePickerWidget
  "scale_rating" → ScaleWidget
  "text_input" → TextInputWidget
  "number_input" → TextInputWidget  (reuse with type="number" input — no separate widget needed)
  "multi_select" → MultiSelectWidget
  "confirm" → ConfirmWidget
  Also update types/index.ts UIWidgetType union to match exactly.

### FIX-4 — context_builder.py: verify get_ollama_client() import path
File: Claude/PersonalAssistant/src/backend/app/services/context_builder.py
Problem: HANDOFF_E warns that compact_profile receives ollama_client as injection and
  "Session F passes its OllamaClient instance (must expose get_ollama_client() singleton)."
  Verify that context_builder.py and chat.py import ollama_client from the correct module
  (app.services.ollama_client) and that the singleton is not re-instantiated per-request.
Action: Read both files. If either instantiates OllamaClient() inline rather than importing the
  module-level singleton, fix it to import and reuse the singleton.

### FIX-5 — main.py: register all routers
File: Claude/PersonalAssistant/src/backend/app/main.py
After FIX-1, verify main.py includes ALL five routers with correct prefixes and tags:
  | router module | prefix | tags |
  |---|---|---|
  | app.routers.auth | /auth | ["auth"] |
  | app.routers.chat | /chat | ["chat"] |
  | app.routers.conversations | /conversations | ["conversations"] |
  | app.routers.profile | /profile | ["profile"] |
  Also confirm GET /health is present (no auth).
  Also confirm CORS middleware allows the frontend origin (from VITE_API_URL / CORS_ORIGINS env).

### FIX-6 — errors.py: create if missing
File: Claude/PersonalAssistant/src/backend/app/core/errors.py
Check if it exists. If absent, generate it:
  - AppError(Exception): base; carries status_code: int, detail: str
  - NotFoundError(AppError): status_code=404
  - UnauthorizedError(AppError): status_code=401
  - ConflictError(AppError): status_code=409
  - ServiceUnavailableError(AppError): status_code=503  ← used by ollama_client and chroma_client
  - Register a global exception handler in main.py that catches AppError → JSONResponse

---

## new_files_to_produce

### README.md
Path: Claude/PersonalAssistant/README.md
Contents:
  - Project overview (from PLAN.md app_summary)
  - Prerequisites: Docker + Docker Compose, Ollama with llama3.2:3b pulled
  - Quick start: cp .env.example .env → docker compose up --build
  - .env variables table (from .env.example)
  - Architecture diagram (ASCII): nginx → frontend / backend → SQLite + ChromaDB + Ollama
  - Development without Docker: backend (uvicorn) + frontend (vite dev) instructions
  - URL map: / landing, /login, /register, /onboarding, /chat, /profile; API at /api/*

### DEPLOY.md (final)
Path: Claude/PersonalAssistant/DEPLOY.md
Session C produced a draft DEPLOY.md. Read it first. Extend or overwrite with:
  - Production checklist: SECRET_KEY strength, DATABASE_URL → PostgreSQL, CHROMA_PERSIST_DIR volume mount
  - Single-worker uvicorn requirement (ChromaDB not thread-safe for concurrent writes)
  - Ollama: must run with llama3.2:3b pre-pulled; OLLAMA_BASE_URL env var
  - Health check endpoint: GET /health → 200 confirms backend + DB connection
  - Alembic migration step: `docker compose exec backend alembic upgrade head`
  - Seed step (optional): `docker compose exec backend python seed.py`

---

## do_not_build
- New API routes or endpoints not in PLAN.md api_routes
- New DB models or schema changes
- New frontend pages or components beyond the ones being fixed
- Any feature not already designed in PLAN.md

---

## quality_pass (run after all fixes and new files)
Before writing HANDOFF_STITCH_A, do a final sweep:
1. Every import in every Python file resolves to a file that exists in Drive.
2. Every CSS class referenced in TypeScript components exists in Session B's CSS files.
3. No hardcoded colors, fonts, or magic numbers in TypeScript (use CSS custom properties via classList).
4. No `any` types in TypeScript. No `console.log` in any file.
5. All fetch() calls in api/*.ts handle non-2xx responses explicitly.
6. widget_parser.py regex uses re.DOTALL (confirmed in HANDOFF_F — just verify, don't change if correct).

---

## files_to_produce (net new)
| file | drive_path |
|---|---|
| README.md | Claude/PersonalAssistant/README.md |
| DEPLOY.md (final) | Claude/PersonalAssistant/DEPLOY.md |
| src/backend/app/core/errors.py | Claude/PersonalAssistant/src/backend/app/core/errors.py |

Plus all files modified by FIX-1 through FIX-6 (overwrite in place).

---

## after_all_files
Write HANDOFF_STITCH_A.md to Claude/PersonalAssistant/handoffs/HANDOFF_STITCH_A.md.
Then print:

════════════════════════════════════════
✅ STITCH_A COMPLETE
All files audited, gaps fixed, README + DEPLOY written.

Next: SESSION_SCRIPT
New chat → connect Google Drive → paste:
"Read SESSION_SCRIPT.md from Claude/PersonalAssistant/ in Google Drive and begin."
════════════════════════════════════════
