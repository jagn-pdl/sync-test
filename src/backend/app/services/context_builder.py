"""
app/services/context_builder.py

Assembles LLM system prompts and message history for the chat router.

Context budget (llama3.2:3b, ~4K token window):
  - System prompt:       ~300 tokens
  - Compacted summary:   ~400 tokens
  - Last 6 turns:        ~600 tokens
  - Widget instruction:  ~100 tokens
  - Total injected:      ~1400 tokens  →  ~2600 left for response
"""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.conversation import Conversation  # noqa: F401 (ensure import chain)
from app.models.message import Message
from app.models.user import User

# ---------------------------------------------------------------------------
# Prompt templates (from PLAN.md / SESSION_F spec)
# ---------------------------------------------------------------------------

_SYSTEM_PROMPT_TEMPLATE = """\
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

Emit at most ONE widget per response. Omit the widget block entirely when free-text response suffices.\
"""

_ONBOARDING_PROMPT_TEMPLATE = """\
You are beginning the first conversation with {name}, a new user of PersonalAssistant.
Your goal in this conversation is to learn about who they are through natural, professional conversation.
Gently collect: their age, approximate height and weight, general lifestyle (activity level, work situation),
and the domains of life they find most challenging or would like support with.
Do not ask all questions at once. Use structured widgets for numeric inputs (age, height, weight).
Begin by warmly welcoming them and asking a single open question about what brought them here today.\
"""


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


async def build_system_prompt(user: User, db: AsyncSession) -> str:
    """Assemble the full system prompt for the LLM.

    Injects the user's compacted_summary into the PLAN.md template.
    Falls back to a placeholder when no summary exists yet.
    """
    compacted_summary = user.compacted_summary or "No prior context available. This appears to be a new user."

    return _SYSTEM_PROMPT_TEMPLATE.format(
        name=user.name,
        compacted_summary=compacted_summary,
        # formatted_turns is intentionally left empty here; the chat router
        # builds message history separately and passes it as the messages list
        # to ollama_client.chat(). The template slot is kept for completeness
        # but the actual turns are handled via the messages array.
        formatted_turns="(see conversation history above)",
    )


async def build_message_history(
    conversation_id: str,
    db: AsyncSession,
    limit: int = 6,
) -> list[dict]:
    """Load the last `limit` messages from a conversation.

    Args:
        conversation_id: The conversation UUID.
        db: Active async DB session.
        limit: Maximum number of messages to return (default 6).

    Returns:
        List of {"role": "user"|"assistant", "content": str} dicts,
        ordered oldest-first. System messages are excluded.
        ui_widget_json is excluded from content (the LLM does not need it).
    """
    result = await db.execute(
        select(Message)
        .where(
            Message.conversation_id == conversation_id,
            Message.role.in_(["user", "assistant"]),
        )
        .order_by(Message.created_at.desc())
        .limit(limit)
    )
    messages = result.scalars().all()
    # Reverse to restore chronological order (we queried desc to get the last N)
    messages = list(reversed(messages))

    return [
        {"role": msg.role, "content": msg.content}
        for msg in messages
    ]


async def get_onboarding_prompt(user: User) -> str:
    """Return the initial system prompt for a brand-new user with no compacted summary.

    Instructs the LLM to begin trait collection conversationally.
    """
    return _ONBOARDING_PROMPT_TEMPLATE.format(name=user.name)
