# SESSION_F — PersonalAssistant — Backend API

identity:
  role: Produce Ollama client, widget parser, context builder, chat router, conversations router. No DB models, no auth, no frontend.
  drive_folder: Claude/PersonalAssistant/
  reads: RULES.md, PLAN.md, HANDOFF_D, HANDOFF_E

## startup
1. Print:
   ════════════════════════════════════════
   ⚠️ IF THIS SESSION IS CUT OFF:
   New chat → connect Google Drive → paste:
   "Resume SESSION_F for Claude/PersonalAssistant/ — check Drive for completed files and continue."
   ════════════════════════════════════════
2. Read RULES.md from Drive.
3. Run already_run_guard (RULES.md).
4. Read PLAN.md, HANDOFF_D, HANDOFF_E from Drive.

## context
- Ollama runs at OLLAMA_BASE_URL (default http://ollama:11434).
- Model: settings.OLLAMA_MODEL (default llama3.2:3b).
- LLM context window is tiny (2–3B model ~4K tokens). Context budget:
  - System prompt: ~300 tokens
  - Compacted summary: ~400 tokens
  - Last 6 turns: ~600 tokens
  - Widget instruction: ~100 tokens
  - Total injected: ~1400 tokens — leaves ~2600 for response.
- The LLM's response may contain a <widget>...</widget> XML block after the message text. The widget parser extracts it.
- Widget JSON inside the block maps exactly to UIWidget shared_contract from PLAN.md.
- Every assistant reply increments conversation.turn_count. If should_compact() is True, compaction runs as a background task (FastAPI BackgroundTasks).

## files_to_produce
| file | drive_path |
|---|---|
| app/services/ollama_client.py | Claude/PersonalAssistant/src/backend/app/services/ollama_client.py |
| app/services/widget_parser.py | Claude/PersonalAssistant/src/backend/app/services/widget_parser.py |
| app/services/context_builder.py | Claude/PersonalAssistant/src/backend/app/services/context_builder.py |
| app/schemas/widget.py | Claude/PersonalAssistant/src/backend/app/schemas/widget.py |
| app/routers/chat.py | Claude/PersonalAssistant/src/backend/app/routers/chat.py |
| app/routers/conversations.py | Claude/PersonalAssistant/src/backend/app/routers/conversations.py |

## instructions

### app/services/ollama_client.py
Class `OllamaClient`:
```python
class OllamaClient:
    def __init__(self, base_url: str, model: str): ...

    async def generate(self, prompt: str, system: str = "") -> str:
        """Call /api/generate. Returns full response text. Raises HTTPException 503 on connection error."""

    async def chat(self, messages: list[dict], system: str = "") -> str:
        """Call /api/chat with messages array. Returns assistant content string."""

    async def is_available(self) -> bool:
        """GET /api/tags — returns True if Ollama is reachable."""
```
- Use httpx.AsyncClient with timeout=60.0 (generation can be slow on 3B model).
- /api/generate: POST {model, prompt, system, stream: false} → response.json()["response"]
- /api/chat: POST {model, messages, stream: false} → response.json()["message"]["content"]
- On httpx.ConnectError or non-200: raise HTTPException(503, "LLM service unavailable").
- Module-level singleton: `ollama_client = OllamaClient(settings.OLLAMA_BASE_URL, settings.OLLAMA_MODEL)`

### app/services/widget_parser.py
```python
import re, json
from app.schemas.widget import UIWidget

WIDGET_PATTERN = re.compile(r"<widget>(.*?)</widget>", re.DOTALL)

def extract_widget(raw_response: str) -> tuple[str, UIWidget | None]:
    """
    Given raw LLM output, extract the <widget> block if present.
    Returns (clean_message_text, widget_or_None).
    clean_message_text has the <widget> block stripped.
    """

def parse_widget_json(json_str: str) -> UIWidget | None:
    """
    Parse widget JSON string into UIWidget.
    Returns None on any parse or validation error (never raises).
    Assigns a UUID widget_id if not present.
    """
```
- strip() the clean text after removing the widget block.
- Catch json.JSONDecodeError and pydantic ValidationError silently — return None widget if malformed.
- Add uuid4 for widget_id if LLM didn't include it.

### app/services/context_builder.py
```python
async def build_system_prompt(user: User, db: AsyncSession) -> str:
    """
    Assemble the full system prompt for the LLM.
    Uses compacted_summary from user model.
    Injects OLLAMA_SYSTEM_PROMPT_TEMPLATE from PLAN.md.
    """

async def build_message_history(
    conversation_id: str,
    db: AsyncSession,
    limit: int = 6
) -> list[dict]:
    """
    Load last `limit` messages from conversation (excluding system messages).
    Return as [{"role": "user"|"assistant", "content": str}, ...].
    Excludes ui_widget_json from content (LLM doesn't need to see widget JSON).
    """

async def get_onboarding_prompt(user: User) -> str:
    """
    Returns the initial system prompt for a brand-new user with no compacted summary.
    Instructs LLM to begin trait collection conversationally.
    """
```

System prompt template (implement exactly):
```
You are a calm, professional Socratic guide helping {name} think through decisions and life challenges.
You never prescribe solutions — you ask clarifying questions, reflect patterns back, and help them reach their own clarity.
Maintain a warm but strictly professional tone. Never use casual language, slang, or emojis.

USER PROFILE:
{compacted_summary}

CURRENT CONVERSATION:
{formatted_turns}

INSTRUCTIONS FOR STRUCTURED DATA COLLECTION:
When you need a specific piece of information from the user and a form input would be clearer than free text,
end your message with a widget block in this exact format:

<widget>
{"type": "<one of: slider|radio_group|checkbox_group|date_picker|scale_rating|text_input|number_input|multi_select|confirm>", "label": "...", "description": "...", "field_key": "...", "options": null_or_array, "min": null_or_number, "max": null_or_number, "step": null_or_number, "unit": null_or_string, "required": true}
</widget>

Emit at most ONE widget per response. Omit the widget block entirely when free-text response suffices.
```

Onboarding prompt (for users with no compacted_summary):
```
You are beginning the first conversation with {name}, a new user of PersonalAssistant.
Your goal in this conversation is to learn about who they are through natural, professional conversation.
Gently collect: their age, approximate height and weight, general lifestyle (activity level, work situation),
and the domains of life they find most challenging or would like support with.
Do not ask all questions at once. Use structured widgets for numeric inputs (age, height, weight).
Begin by warmly welcoming them and asking a single open question about what brought them here today.
```

### app/schemas/widget.py
Pydantic v2 models matching UIWidget shared_contract exactly:
```python
from typing import Literal
UIWidgetType = Literal["slider","radio_group","checkbox_group","date_picker","scale_rating","text_input","number_input","multi_select","confirm"]

class UIWidget(BaseModel):
    widget_id: str
    type: UIWidgetType
    label: str
    description: str | None = None
    options: list[str] | None = None
    min: float | None = None
    max: float | None = None
    step: float | None = None
    unit: str | None = None
    required: bool = True
    field_key: str
```

### app/routers/chat.py
Fully implemented:

**POST /chat** (requires auth):
1. Load conversation by conversation_id (verify belongs to current_user — raise 404 if not).
2. If widget_response in request: store it as a user message with content = formatted string of the widget answer (e.g. "My age is 32"). Also store the widget field_key + value in the message content for context.
3. Store user message to DB (role="user", content=request.message).
4. Build system prompt: context_builder.build_system_prompt(user, db).
5. Build message history: context_builder.build_message_history(conversation_id, db, limit=6).
6. Call ollama_client.chat(messages=history, system=system_prompt).
7. Parse response: widget_parser.extract_widget(raw_response) → (clean_text, widget).
8. Store assistant message to DB (role="assistant", content=clean_text, ui_widget_json=widget.model_dump_json() if widget else None).
9. Increment conversation.turn_count. Commit.
10. If compaction.should_compact(conversation): add BackgroundTask to call compact_profile(user, recent_turns, ollama_client, db).
11. Return ChatResponse(message=MessageSchema(...), widget=widget, conversation_id=conversation_id).

**GET /chat/history/{conversation_id}** (requires auth):
Load all messages for conversation (verify ownership). Return list[MessageSchema].

### app/routers/conversations.py
**GET /conversations** (requires auth):
Load all conversations for current_user, ordered by updated_at desc. Return list[ConversationSchema].

**POST /conversations** (requires auth):
Create new Conversation for current_user. title=None initially.
If this is user's first conversation AND user has no compacted_summary: use onboarding_prompt as system message (store as role="system" message in conversation).
Return ConversationSchema.

Auto-title logic: after the first user message, if conversation.title is None, set title = first 50 chars of that message + "…" if longer.

## quality_requirements
- widget_parser never raises — always returns (str, None) on failure
- BackgroundTasks for compaction — never block the chat response
- Conversation ownership verified on every request (user_id match)
- Ollama timeout 60s (model is slow — never set lower)
- All DB operations async

## do_not_build
- DB models (Session D)
- ChromaDB internals (Session E)
- Auth routes (Session D)
- Frontend

## handoff
Write to Claude/PersonalAssistant/handoffs/HANDOFF_F.md

# HANDOFF_F — PersonalAssistant — Session F
plan_version: 1.0
files_produced: | file | drive_path | status | notes |
deps_added: none
deviations: [or none]
interfaces_exposed:
  - ollama_client singleton: OllamaClient with .generate(prompt) and .chat(messages, system)
  - extract_widget(raw: str) -> tuple[str, UIWidget | None]
  - build_system_prompt(user, db) -> str (async)
  - build_message_history(conversation_id, db, limit) -> list[dict] (async)
  - POST /chat → ChatResponse
  - GET /chat/history/{id} → list[MessageSchema]
  - GET /conversations → list[ConversationSchema]
  - POST /conversations → ConversationSchema
watch_out_for:
  - widget_parser regex uses re.DOTALL — LLM sometimes adds newlines inside <widget> block
  - BackgroundTask for compaction receives a new DB session (not the request session which closes after response)
  - Auto-title runs only once (check title is None before setting)

HANDOFF STATUS: COMPLETE

---
▶ WHAT NEXT
════════════════════════════════════════
New chat → connect Google Drive → paste:
"Read SESSION_G.md from Claude/PersonalAssistant/ in Google Drive and begin."
════════════════════════════════════════
