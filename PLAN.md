# PLAN.md — PersonalAssistant
plan_version: 1.0
changelog: 1.0 — initial

app_summary: >
  PersonalAssistant is a web-based Socratic life-guidance app that initiates onboarding conversations
  to learn the user's personal traits (age, height, weight, lifestyle, goals), then dynamically generates
  UI components to collect structured data about current problems across any domain (health, finance,
  career, relationships, etc.). Every successive conversation compacts prior context into a minimal
  user-profile vector, enabling a small 2–3B Ollama model to always have the most relevant snapshot
  of the user — helping them think through decisions rather than prescribing answers.

platform: web
project_root: src/
tech_stack:
  frontend:
    framework: Vanilla TypeScript (no framework — static, fast, zero build overhead)
    bundler: Vite 5
    styling: CSS custom properties design system (no Tailwind — hand-crafted tokens)
    fonts: "Cormorant Garamond (display) + DM Mono (body/chat)"
    theme: "Deep ink — near-black bg (#0d0f12), warm cream text (#f0ead6), amber accent (#c97d2e)"
  backend:
    framework: FastAPI 0.111
    runtime: Python 3.12
    llm: Ollama (local) — model: llama3.2:3b (default), swappable via env
    vector_db: ChromaDB 0.5 (embedded, file-persisted — no external service needed)
    auth: JWT (python-jose) + bcrypt password hashing
    orm: SQLAlchemy 2.0 (async) + Alembic migrations
    primary_db: SQLite (dev) / PostgreSQL 16 (prod) — switched via DATABASE_URL env
  containerization:
    tool: Docker + Docker Compose
    services: frontend (nginx), backend (uvicorn), ollama, chromadb (embedded in backend)

---

## screen_inventory
| screen | route | description |
|---|---|---|
| Landing | / | App intro, login / register CTA |
| Register | /register | Name, email, password — starts onboarding immediately after |
| Login | /login | Email + password |
| Onboarding | /onboarding | Guided trait collection (age, height, weight, lifestyle) via generative UI steps |
| Chat | /chat | Primary interface: chat bubbles + dynamically injected generative UI widgets |
| Profile | /profile | View compacted user profile, edit static traits |
| 404 | * | Not found |

---

## visual_brief
- **Aesthetic**: Refined editorial / luxury journal — serious, calm, trustworthy. Like a private therapist's leather notebook.
- **Background**: Near-black `#0d0f12` with subtle warm noise texture overlay.
- **Text**: Warm cream `#f0ead6` — never pure white.
- **Accent**: Burnished amber `#c97d2e` — used for CTAs, focus rings, active states.
- **Typography**: Cormorant Garamond (display, headings, user messages) + DM Mono (assistant messages, labels, metadata).
- **Chat bubbles**: User messages right-aligned in cream, assistant messages left-aligned in a slightly lighter dark card.
- **Generative UI widgets**: Slide in from below with a subtle fade. Cards with rounded 12px corners, amber border on focus.
- **Motion**: Slow, deliberate. 300–500ms easing. No bouncy animations.
- **Layout**: Single-column centered, max 680px content width, generous padding.

---

## shared_contracts

### User (DB model → API response)
```typescript
interface User {
  id: string;           // UUID
  email: string;
  name: string;
  created_at: string;   // ISO8601
  profile_compacted_at: string | null;
}
```

### UserProfile (compacted trait snapshot — stored in ChromaDB + SQLite)
```typescript
interface UserProfile {
  user_id: string;
  traits: {
    age: number | null;
    height_cm: number | null;
    weight_kg: number | null;
    lifestyle: string | null;   // e.g. "sedentary", "active"
    goals: string[];
    domains_of_concern: string[]; // ["health","finance","career",...]
    [key: string]: unknown;      // extensible
  };
  compacted_summary: string;    // 200–400 word prose summary for LLM context injection
  conversation_count: number;
  last_updated: string;
}
```

### Message
```typescript
interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  ui_widget: UIWidget | null;   // attached generative UI instruction
}
```

### UIWidget (generative UI — LLM decides type + fields)
```typescript
type UIWidgetType =
  | "slider"
  | "radio_group"
  | "checkbox_group"
  | "date_picker"
  | "scale_rating"
  | "text_input"
  | "number_input"
  | "multi_select"
  | "confirm";

interface UIWidget {
  widget_id: string;
  type: UIWidgetType;
  label: string;
  description: string | null;
  options: string[] | null;         // for radio/checkbox/multi_select
  min: number | null;               // for slider/scale
  max: number | null;
  step: number | null;
  unit: string | null;              // e.g. "kg", "years"
  required: boolean;
  field_key: string;                // key used when submitting value back
}
```

### ChatRequest / ChatResponse (backend API)
```typescript
interface ChatRequest {
  message: string;
  conversation_id: string;
  widget_response: { field_key: string; value: unknown } | null;
}

interface ChatResponse {
  message: Message;
  widget: UIWidget | null;
  conversation_id: string;
}
```

### AuthTokens
```typescript
interface AuthTokens {
  access_token: string;
  token_type: "bearer";
  expires_in: number;
}
```

---

## api_routes
| method | path | auth | description |
|---|---|---|---|
| POST | /auth/register | no | Create account, return tokens |
| POST | /auth/login | no | Login, return tokens |
| POST | /auth/refresh | yes | Refresh access token |
| GET | /users/me | yes | Get current user + profile |
| PATCH | /users/me/traits | yes | Update static traits |
| POST | /chat | yes | Send message, get assistant reply + optional widget |
| GET | /chat/history/{conversation_id} | yes | Load prior messages |
| GET | /conversations | yes | List user's conversations |
| POST | /conversations | yes | Create new conversation |
| POST | /profile/compact | yes | Trigger manual profile compaction |
| GET | /health | no | Health check |

---

## memory_compaction_strategy
- After every 10 assistant turns in a conversation, trigger background compaction.
- Compaction: call Ollama with all new turns + existing compacted_summary → produce new 200–400 word prose summary.
- Store summary in SQLite (users.compacted_summary) + re-embed in ChromaDB for semantic retrieval.
- On each new chat request, inject compacted_summary at top of system prompt (not raw history).
- Raw conversation history beyond last 6 turns is never sent to LLM — only compacted summary + last 6 turns.

---

## ollama_system_prompt_template
```
You are a calm, professional Socratic guide helping {name} think through decisions and burdens.
You never prescribe — you ask clarifying questions, reflect patterns, and help them reach their own conclusions.
Maintain a warm but strictly professional tone at all times.

USER PROFILE SNAPSHOT:
{compacted_summary}

CURRENT CONVERSATION (last 6 turns):
{recent_turns}

GENERATIVE UI INSTRUCTION:
If you need structured data from the user, respond with a JSON block after your message text:
<widget>
{
  "type": "<UIWidgetType>",
  "label": "...",
  "description": "...",
  "field_key": "...",
  "options": [...] | null,
  "min": null, "max": null, "step": null, "unit": null,
  "required": true
}
</widget>
Only emit one widget per response. Omit the block entirely if no structured input is needed.
```

---

## session_plan

| session | name | role | runs_after |
|---|---|---|---|
| A | Planning | Architecture + all session files | — |
| B | Design System | CSS tokens, typography, component CSS primitives | A |
| C | Infra + Config | Docker, docker-compose, requirements.txt, package.json, vite.config, .env.example, alembic, DEPLOY.md | A |
| D | Auth + DB | FastAPI auth routes, SQLAlchemy models, Alembic migrations, seed script | C |
| E | Vector + Memory | ChromaDB integration, compaction service, profile embedding, retrieval | D |
| F | Backend API | Chat route, conversation management, Ollama client, widget parser, profile injection | D,E |
| G | Frontend | All TypeScript + HTML: landing, register, login, onboarding, chat, profile, generative UI renderer | B,F |
| STITCH_A | Integration | Wire all layers, audit quality_standards, infrastructure_check, README, DEPLOY.md | G |
| SCRIPT | Run Script | run.sh + run.ps1 | STITCH_A |

---

## file_ownership

### Session B — Design System
```
src/frontend/src/styles/tokens.css
src/frontend/src/styles/reset.css
src/frontend/src/styles/typography.css
src/frontend/src/styles/components.css
src/frontend/src/styles/animations.css
src/frontend/src/styles/chat.css
src/frontend/src/styles/widgets.css
src/frontend/src/styles/forms.css
src/frontend/src/styles/layout.css
```

### Session C — Infra + Config
```
docker-compose.yml
Dockerfile.backend
Dockerfile.frontend
nginx.conf
src/backend/requirements.txt
src/frontend/package.json
src/frontend/vite.config.ts
src/frontend/tsconfig.json
src/frontend/index.html
src/backend/alembic.ini
src/backend/alembic/env.py
src/backend/alembic/script.py.mako
.env.example
DEPLOY.md
```

### Session D — Auth + DB
```
src/backend/app/models/user.py
src/backend/app/models/conversation.py
src/backend/app/models/message.py
src/backend/app/schemas/auth.py
src/backend/app/schemas/user.py
src/backend/app/schemas/chat.py
src/backend/app/routers/auth.py
src/backend/app/core/security.py
src/backend/app/core/database.py
src/backend/app/core/config.py
src/backend/app/core/deps.py
src/backend/app/__init__.py
src/backend/app/main.py
src/backend/alembic/versions/0001_initial.py
src/backend/seed.py
```

### Session E — Vector + Memory
```
src/backend/app/services/chroma_client.py
src/backend/app/services/compaction.py
src/backend/app/services/profile_store.py
src/backend/app/routers/profile.py
src/backend/app/schemas/profile.py
```

### Session F — Backend API
```
src/backend/app/services/ollama_client.py
src/backend/app/services/widget_parser.py
src/backend/app/services/context_builder.py
src/backend/app/routers/chat.py
src/backend/app/routers/conversations.py
src/backend/app/schemas/widget.py
```

### Session G — Frontend
```
src/frontend/src/main.ts
src/frontend/src/router.ts
src/frontend/src/api/client.ts
src/frontend/src/api/auth.ts
src/frontend/src/api/chat.ts
src/frontend/src/api/profile.ts
src/frontend/src/store/auth.ts
src/frontend/src/store/chat.ts
src/frontend/src/components/chat/ChatBubble.ts
src/frontend/src/components/chat/ChatInput.ts
src/frontend/src/components/chat/TypingIndicator.ts
src/frontend/src/components/widgets/WidgetRenderer.ts
src/frontend/src/components/widgets/SliderWidget.ts
src/frontend/src/components/widgets/RadioWidget.ts
src/frontend/src/components/widgets/CheckboxWidget.ts
src/frontend/src/components/widgets/ScaleWidget.ts
src/frontend/src/components/widgets/TextInputWidget.ts
src/frontend/src/components/widgets/DatePickerWidget.ts
src/frontend/src/components/widgets/MultiSelectWidget.ts
src/frontend/src/components/widgets/ConfirmWidget.ts
src/frontend/src/components/layout/Header.ts
src/frontend/src/components/layout/Sidebar.ts
src/frontend/src/pages/LandingPage.ts
src/frontend/src/pages/LoginPage.ts
src/frontend/src/pages/RegisterPage.ts
src/frontend/src/pages/OnboardingPage.ts
src/frontend/src/pages/ChatPage.ts
src/frontend/src/pages/ProfilePage.ts
src/frontend/src/pages/NotFoundPage.ts
src/frontend/src/types/index.ts
src/frontend/src/utils/format.ts
src/frontend/src/utils/storage.ts
```

### Session STITCH_A — Integration
```
All files from B, C, D, E, F, G — read-only audit + fix only.
Generates: README.md, DEPLOY.md (final), src/backend/app/core/errors.py (if missing)
```

### Session SCRIPT
```
run.sh
run.ps1
```

---

## do_not_build_per_session

### Session B
Do not build: any Python, any route handlers, any HTML pages, any TypeScript logic.

### Session C
Do not build: any application logic, any route handlers, any frontend TypeScript components.

### Session D
Do not build: chat logic, vector DB, Ollama client, frontend.

### Session E
Do not build: auth, chat routes, Ollama client, frontend.

### Session F
Do not build: auth, DB models, vector DB internals, frontend.

### Session G
Do not build: any Python, any backend routes, any DB logic.

### STITCH_A
Do not build: new features, new domain models, new routes.

### SCRIPT
Do not build: any application logic.
