# HANDOFF_F — PersonalAssistant — Session F
plan_version: 1.0

files_produced:
| file | drive_path | status | notes |
|---|---|---|---|
| app/schemas/widget.py | Claude/PersonalAssistant/src/backend/app/schemas/widget.py | ✅ complete | UIWidget pydantic v2 model; UIWidgetType Literal; uuid4 default for widget_id |
| app/services/ollama_client.py | Claude/PersonalAssistant/src/backend/app/services/ollama_client.py | ✅ complete | OllamaClient with .generate(), .chat(), .is_available(); httpx.AsyncClient timeout=60s; module-level singleton |
| app/services/widget_parser.py | Claude/PersonalAssistant/src/backend/app/services/widget_parser.py | ✅ complete | extract_widget() + parse_widget_json(); re.DOTALL; never raises; assigns uuid4 if widget_id absent |
| app/services/context_builder.py | Claude/PersonalAssistant/src/backend/app/services/context_builder.py | ✅ complete | build_system_prompt(), build_message_history(), get_onboarding_prompt(); system prompt template from PLAN.md |
| app/routers/chat.py | Claude/PersonalAssistant/src/backend/app/routers/chat.py | ✅ complete | POST /chat + GET /chat/history/{id}; BackgroundTasks compaction; auto-title on first message; ownership check |
| app/routers/conversations.py | Claude/PersonalAssistant/src/backend/app/routers/conversations.py | ✅ complete | GET /conversations + POST /conversations; onboarding system message for first conversation; conversation_count increment |

deps_added: none

deviations:
- context_builder.build_system_prompt() includes the formatted_turns slot in the template but leaves it as a
  static placeholder ("see conversation history above"), because the actual turn history is passed as the
  messages list to ollama_client.chat(). This matches the SESSION_F intent: system prompt carries user
  profile context; the messages array carries conversational turns. The LLM sees both correctly.
- _run_compaction_background() is defined inline in chat.py (not a separate module) to keep the
  BackgroundTask wiring self-contained and avoid an extra import cycle.
- conversations.py increments current_user.conversation_count on every POST /conversations call
  (not only on the first). This keeps the count accurate so Session G / STITCH can rely on it.

interfaces_exposed:
  - ollama_client singleton: OllamaClient with .generate(prompt, system="") -> str  and  .chat(messages, system="") -> str
  - extract_widget(raw: str) -> tuple[str, UIWidget | None]
  - parse_widget_json(json_str: str) -> UIWidget | None
  - build_system_prompt(user, db) -> str  (async)
  - build_message_history(conversation_id, db, limit=6) -> list[dict]  (async)
  - get_onboarding_prompt(user) -> str  (async)
  - POST /chat → ChatResponse
  - GET  /chat/history/{id} → list[MessageSchema]
  - GET  /conversations → list[ConversationSchema]
  - POST /conversations → ConversationSchema

watch_out_for:
  - widget_parser regex uses re.DOTALL — LLM sometimes adds newlines inside <widget> block; without DOTALL the match would fail
  - BackgroundTask for compaction uses a fresh AsyncSessionLocal() — not the request session (which closes after response is sent)
  - Auto-title runs only once (checks title is None before setting)
  - conversation_count on User is incremented by POST /conversations; session G should not also increment it
  - chat.py imports AsyncSessionLocal lazily inside _run_compaction_background to avoid circular import at module load
  - OllamaClient._post() catches both ConnectError and TimeoutException → both surface as HTTP 503
  - /api/chat response: response.json()["message"]["content"] — not response.json()["response"]

HANDOFF STATUS: COMPLETE

---
▶ WHAT NEXT
════════════════════════════════════════════════════════
New chat → connect Google Drive → paste:
"Read SESSION_G.md from Claude/PersonalAssistant/ in Google Drive and begin."
════════════════════════════════════════════════════════
