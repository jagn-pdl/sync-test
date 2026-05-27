# SESSION_E — PersonalAssistant — Vector + Memory

identity:
  role: Produce ChromaDB integration, profile embedding, compaction service, profile router. No chat logic, no Ollama client, no frontend.
  drive_folder: Claude/PersonalAssistant/
  reads: RULES.md, PLAN.md, HANDOFF_D

## startup
1. Print:
   ════════════════════════════════════════
   ⚠️ IF THIS SESSION IS CUT OFF:
   New chat → connect Google Drive → paste:
   "Resume SESSION_E for Claude/PersonalAssistant/ — check Drive for completed files and continue."
   ════════════════════════════════════════
2. Read RULES.md from Drive.
3. Run already_run_guard (RULES.md).
4. Read PLAN.md and HANDOFF_D from Drive.

## context
- ChromaDB 0.5 embedded (no external server), persisted at CHROMA_PERSIST_DIR env.
- ChromaDB's default embedding function (all-MiniLM-L6-v2 via onnx) — no external embedding API needed.
- One ChromaDB collection: "user_profiles" — one document per user (user_id as document id).
- The stored document is the compacted_summary prose string.
- Metadata stored alongside: user_id, conversation_count, last_updated, trait keys (age, lifestyle, etc.) for filtered retrieval.
- Compaction is triggered by Session F's chat service after every 10 assistant turns.
- Compaction calls Ollama — BUT the Ollama client lives in Session F. Session E receives the new summary as a string argument and stores it. This avoids circular dependency.
- Profile router exposes POST /profile/compact (manual trigger — calls compaction with a flag to force).

## files_to_produce
| file | drive_path |
|---|---|
| app/services/chroma_client.py | Claude/PersonalAssistant/src/backend/app/services/chroma_client.py |
| app/services/profile_store.py | Claude/PersonalAssistant/src/backend/app/services/profile_store.py |
| app/services/compaction.py | Claude/PersonalAssistant/src/backend/app/services/compaction.py |
| app/routers/profile.py | Claude/PersonalAssistant/src/backend/app/routers/profile.py |
| app/schemas/profile.py | Claude/PersonalAssistant/src/backend/app/schemas/profile.py |

## instructions

### app/services/chroma_client.py
```python
# Module-level singleton ChromaClient
```
- Import chromadb. Use `chromadb.PersistentClient(path=settings.CHROMA_PERSIST_DIR)`.
- Singleton pattern: `_client: chromadb.ClientAPI | None = None`
- `def get_chroma_client() -> chromadb.ClientAPI` — lazy init, returns singleton.
- `def get_profiles_collection() -> chromadb.Collection` — gets or creates collection "user_profiles" with default embedding function.
- Handle ChromaDB exceptions: wrap in try/except, raise as HTTPException 503 with message "Profile store unavailable".

### app/services/profile_store.py
Functions (all synchronous — ChromaDB embedded client is sync):

```python
def upsert_profile(
    user_id: str,
    compacted_summary: str,
    traits: dict,
    conversation_count: int,
) -> None
```
Upserts document into "user_profiles" collection:
- document = compacted_summary
- id = user_id
- metadata = {user_id, conversation_count, last_updated (ISO string), **flattened scalar traits}
  Flatten traits: only store scalar values in metadata (str, int, float, bool). Lists become comma-joined strings.

```python
def get_profile_summary(user_id: str) -> str | None
```
Query collection by id. Return document string or None if not found.

```python
def delete_profile(user_id: str) -> None
```
Delete document from collection by id. No error if not found.

```python
def search_similar_profiles(query_text: str, n_results: int = 3) -> list[dict]
```
Query collection with query_texts=[query_text], n_results=n_results.
Return list of {id, document, metadata} dicts. Used internally for future feature expansion — expose but don't wire to a route yet.

### app/services/compaction.py
Core memory compaction logic:

```python
async def should_compact(conversation: Conversation) -> bool
```
Returns True if conversation.turn_count % 10 == 0 and turn_count > 0.

```python
async def compact_profile(
    user: User,
    recent_turns: list[dict],  # [{"role": str, "content": str}, ...]
    ollama_client,             # injected — avoids circular import
    db: AsyncSession,
) -> str
```
1. Build compaction prompt:
   ```
   You are summarizing a user's life context for an AI assistant.
   
   EXISTING SUMMARY:
   {user.compacted_summary or "No prior summary."}
   
   NEW CONVERSATION TURNS:
   {format recent_turns as "Role: content\n"}
   
   USER TRAITS (raw):
   {json.loads(user.traits_json) if user.traits_json else {}}
   
   Produce a new summary of 200–400 words capturing:
   - Who this person is (demographics, lifestyle)
   - Their current concerns and domains of difficulty
   - Patterns you've observed in how they think and communicate
   - What kinds of support seem most helpful
   
   Write in third-person, present tense. Be specific and factual. No platitudes.
   Output ONLY the summary text — no preamble, no headings.
   ```
2. Call `await ollama_client.generate(prompt)` → new_summary string.
3. Update user.compacted_summary = new_summary.
4. Update user.profile_compacted_at = datetime.utcnow().
5. Commit to DB.
6. Call `profile_store.upsert_profile(user_id, new_summary, traits, conversation_count)`.
7. Return new_summary.

```python
async def get_context_for_llm(user: User) -> str
```
Returns user.compacted_summary if set, else a default string:
"No prior context available. This appears to be a new user."

### app/schemas/profile.py
```python
class ProfileResponse(BaseModel):
    user_id: str
    compacted_summary: str | None
    traits: dict
    conversation_count: int
    profile_compacted_at: str | None

class CompactRequest(BaseModel):
    force: bool = False
```

### app/routers/profile.py
- GET /profile/me → ProfileResponse: load current user, parse traits_json, return ProfileResponse.
- POST /profile/compact → trigger compaction manually.
  - Load last 20 messages from user's most recent conversation.
  - Import ollama_client lazily (from app.services.ollama_client) to avoid circular import at module level.
  - Call compact_profile → return ProfileResponse with new summary.
- This router is mounted in main.py under /profile.

## quality_requirements
- ChromaDB calls are synchronous — do NOT use asyncio.run() inside async routes. Use run_in_executor if blocking calls are too slow (not required for <1000 users, but add a comment noting this).
- traits_json parsing always uses `json.loads` with fallback to `{}` on JSONDecodeError.
- All functions have explicit return types.
- No bare except.

## do_not_build
- Ollama client (Session F)
- Chat routes (Session F)
- Auth routes (Session D)
- Frontend

## handoff
Write to Claude/PersonalAssistant/handoffs/HANDOFF_E.md

# HANDOFF_E — PersonalAssistant — Session E
plan_version: 1.0
files_produced: | file | drive_path | status | notes |
deps_added: none (chromadb already in requirements.txt)
deviations: [or none]
interfaces_exposed:
  - get_chroma_client() -> chromadb.ClientAPI
  - get_profiles_collection() -> chromadb.Collection
  - upsert_profile(user_id, compacted_summary, traits, conversation_count) -> None
  - get_profile_summary(user_id) -> str | None
  - compact_profile(user, recent_turns, ollama_client, db) -> str (async)
  - get_context_for_llm(user) -> str (async)
  - should_compact(conversation) -> bool (async)
watch_out_for:
  - compact_profile receives ollama_client as injection — Session F passes its OllamaClient instance
  - ChromaDB PersistentClient is NOT thread-safe for writes; in practice uvicorn single-worker is fine. Note in code.
  - profile_store functions are sync — called from async context using await run_in_executor if needed

HANDOFF STATUS: COMPLETE

---
▶ WHAT NEXT
════════════════════════════════════════
New chat → connect Google Drive → paste:
"Read SESSION_F.md from Claude/PersonalAssistant/ in Google Drive and begin."
════════════════════════════════════════
