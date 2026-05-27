# SESSION_D — PersonalAssistant — Auth + DB

identity:
  role: Produce FastAPI auth routes, SQLAlchemy models, Alembic migration, seed script. No vector DB, no chat logic, no frontend.
  drive_folder: Claude/PersonalAssistant/
  reads: RULES.md, PLAN.md, HANDOFF_C

## startup
1. Print:
   ════════════════════════════════════════
   ⚠️ IF THIS SESSION IS CUT OFF:
   New chat → connect Google Drive → paste:
   "Resume SESSION_D for Claude/PersonalAssistant/ — check Drive for completed files and continue."
   ════════════════════════════════════════
2. Read RULES.md from Drive.
3. Run already_run_guard (RULES.md).
4. Read PLAN.md and HANDOFF_C from Drive.

## context
- FastAPI 0.111, Python 3.12, SQLAlchemy 2.0 async, Alembic 1.13, python-jose, passlib[bcrypt]
- Auth: JWT bearer tokens (access + refresh). Access token expires per ACCESS_TOKEN_EXPIRE_MINUTES env. Refresh token expires per REFRESH_TOKEN_EXPIRE_DAYS env.
- All DB operations are async (AsyncSession).
- Use pydantic-settings for config (Settings class).
- Shared contracts from PLAN.md define the exact shape of User, UserProfile, Message.

## files_to_produce
| file | drive_path |
|---|---|
| app/core/config.py | Claude/PersonalAssistant/src/backend/app/core/config.py |
| app/core/database.py | Claude/PersonalAssistant/src/backend/app/core/database.py |
| app/core/security.py | Claude/PersonalAssistant/src/backend/app/core/security.py |
| app/core/deps.py | Claude/PersonalAssistant/src/backend/app/core/deps.py |
| app/__init__.py | Claude/PersonalAssistant/src/backend/app/__init__.py |
| app/main.py | Claude/PersonalAssistant/src/backend/app/main.py |
| app/models/user.py | Claude/PersonalAssistant/src/backend/app/models/user.py |
| app/models/conversation.py | Claude/PersonalAssistant/src/backend/app/models/conversation.py |
| app/models/message.py | Claude/PersonalAssistant/src/backend/app/models/message.py |
| app/schemas/auth.py | Claude/PersonalAssistant/src/backend/app/schemas/auth.py |
| app/schemas/user.py | Claude/PersonalAssistant/src/backend/app/schemas/user.py |
| app/schemas/chat.py | Claude/PersonalAssistant/src/backend/app/schemas/chat.py |
| app/routers/auth.py | Claude/PersonalAssistant/src/backend/app/routers/auth.py |
| alembic/versions/0001_initial.py | Claude/PersonalAssistant/src/backend/alembic/versions/0001_initial.py |
| seed.py | Claude/PersonalAssistant/src/backend/seed.py |

## instructions

### app/core/config.py
Pydantic BaseSettings subclass `Settings`:
- DATABASE_URL: str
- JWT_SECRET_KEY: str
- JWT_ALGORITHM: str = "HS256"
- ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
- REFRESH_TOKEN_EXPIRE_DAYS: int = 30
- OLLAMA_BASE_URL: str
- OLLAMA_MODEL: str = "llama3.2:3b"
- CHROMA_PERSIST_DIR: str
- APP_ENV: str = "development"
- CORS_ORIGINS: list[str]
Singleton: `settings = Settings()` at module level.

### app/core/database.py
- Create async engine from settings.DATABASE_URL.
- AsyncSessionLocal factory.
- Base = DeclarativeBase() — imported by all models.
- `async def get_db()` dependency yielding AsyncSession.
- `async def init_db()` that creates all tables (used in main.py lifespan for SQLite dev; Alembic handles prod).

### app/core/security.py
- `hash_password(plain: str) -> str` using passlib bcrypt
- `verify_password(plain: str, hashed: str) -> bool`
- `create_access_token(data: dict, expires_delta: timedelta | None) -> str` using python-jose
- `create_refresh_token(data: dict) -> str`
- `decode_token(token: str) -> dict` — raises HTTPException 401 if invalid/expired
- Token subject ("sub") = user UUID string

### app/core/deps.py
- `async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)) -> User`
  Decodes token, loads user from DB, raises 401 if not found or inactive.
- OAuth2PasswordBearer scheme pointing to /auth/login.

### app/main.py
- FastAPI app with lifespan context manager.
- Lifespan: call init_db() on startup.
- Include routers: auth (/auth), users (/users) — stub router for /users/me and PATCH /users/me/traits (full impl in this session), profile (/profile — stub, wired in Session E), chat (/chat — stub, wired in Session F), conversations (/conversations — stub, wired in Session F).
- CORS middleware: origins from settings.CORS_ORIGINS.
- GET /health returns {"status": "ok"}.
- Exception handlers: generic 500 handler returning {"detail": "Internal server error"}.

### app/models/user.py
SQLAlchemy async model `User`:
- id: UUID primary key (server_default uuid4)
- email: str unique, indexed
- name: str
- hashed_password: str
- is_active: bool default True
- compacted_summary: str nullable (the 200–400 word prose summary)
- profile_compacted_at: datetime nullable
- traits_json: str nullable (JSON blob of UserProfile.traits — stored as text, parsed in service layer)
- conversation_count: int default 0
- created_at: datetime server_default now
- updated_at: datetime onupdate now

### app/models/conversation.py
SQLAlchemy model `Conversation`:
- id: UUID primary key
- user_id: UUID FK → users.id, indexed
- title: str nullable (auto-generated from first message)
- created_at: datetime
- updated_at: datetime
- turn_count: int default 0 (incremented per assistant turn — triggers compaction at 10)
- relationship: user, messages

### app/models/message.py
SQLAlchemy model `Message`:
- id: UUID primary key
- conversation_id: UUID FK → conversations.id, indexed
- role: str ("user" | "assistant" | "system")
- content: str (text)
- ui_widget_json: str nullable (JSON blob of UIWidget)
- created_at: datetime
- relationship: conversation

### app/schemas/auth.py
Pydantic v2 models:
- RegisterRequest: email (EmailStr), name (str min 1 max 100), password (str min 8)
- LoginRequest: email, password
- TokenResponse: access_token, token_type="bearer", expires_in (seconds)
- RefreshRequest: refresh_token

### app/schemas/user.py
- UserResponse: id, email, name, created_at, profile_compacted_at (matches shared_contracts User)
- TraitsUpdateRequest: dict of trait key-value pairs (flexible — use dict[str, Any] with explicit known fields as Optional)
  Known optional fields: age (int), height_cm (float), weight_kg (float), lifestyle (str), goals (list[str]), domains_of_concern (list[str])

### app/schemas/chat.py
Matches shared_contracts exactly:
- MessageSchema: id, role, content, timestamp, ui_widget (dict | None)
- ChatRequest: message (str), conversation_id (str), widget_response (dict | None)
- ChatResponse: message (MessageSchema), widget (dict | None), conversation_id (str)
- ConversationSchema: id, user_id, title, created_at, updated_at, turn_count

### app/routers/auth.py
Fully implemented:
- POST /auth/register: validate → check email unique → hash password → create User → commit → return TokenResponse
- POST /auth/login: load user by email → verify password → return TokenResponse (raise 401 if fail)
- POST /auth/refresh: decode refresh token → load user → return new TokenResponse
- GET /users/me: return UserResponse for current_user
- PATCH /users/me/traits: merge traits into user.traits_json → commit → return UserResponse

### alembic/versions/0001_initial.py
Hand-written migration creating:
- users table (all columns from User model)
- conversations table (all columns from Conversation model)
- messages table (all columns from Message model)
- Correct FK constraints, indexes on user_id, conversation_id, email.

### seed.py
Standalone script (not a route). Creates one demo user:
- email: demo@personalassistant.local
- name: Demo User
- password: demo1234
Run with: python seed.py
Idempotent: skip if user already exists.

## quality_requirements
- All DB calls async (await session.execute, etc.)
- All passwords go through hash_password — never stored plain
- UUIDs stored as UUID type (or String(36) for SQLite compatibility — use String(36))
- All Pydantic models use model_config = ConfigDict(from_attributes=True)
- No bare except — catch specific exceptions
- 401 for auth failures, 422 for validation (automatic), 409 for duplicate email on register

## do_not_build
- ChromaDB / vector DB code
- Ollama client
- Chat route implementation
- Profile compaction service
- Any frontend files

## handoff
Write to Claude/PersonalAssistant/handoffs/HANDOFF_D.md

# HANDOFF_D — PersonalAssistant — Session D
plan_version: 1.0
files_produced: | file | drive_path | status | notes |
deps_added: none (all in requirements.txt from Session C)
deviations: [or none]
interfaces_exposed:
  - User ORM model: all fields listed above
  - get_current_user(token, db) -> User dependency
  - settings singleton from app.core.config
  - hash_password, verify_password, create_access_token, decode_token from app.core.security
  - AsyncSessionLocal, Base, get_db from app.core.database
watch_out_for:
  - UUID stored as String(36) for SQLite compat — cast to str when building API responses
  - traits_json is raw JSON text — Session E/F must json.loads() before use
  - turn_count on Conversation incremented by Session F after each assistant reply

HANDOFF STATUS: COMPLETE

---
▶ WHAT NEXT
════════════════════════════════════════
Sessions E and F can now run in parallel.

For Session E:
New chat → connect Google Drive → paste:
"Read SESSION_E.md from Claude/PersonalAssistant/ in Google Drive and begin."

For Session F (start after E, or in parallel if you have two chats):
New chat → connect Google Drive → paste:
"Read SESSION_F.md from Claude/PersonalAssistant/ in Google Drive and begin."
════════════════════════════════════════
