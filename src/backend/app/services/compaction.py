"""
app/services/compaction.py

Memory compaction logic.

Design note: compact_profile receives ollama_client as an injected argument
rather than importing it at module level. This avoids a circular dependency
because Session F's ollama_client module may itself import from compaction.py.
Session F passes its OllamaClient instance when calling compact_profile.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import TYPE_CHECKING, Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.conversation import Conversation
from app.models.user import User
from app.services import profile_store

if TYPE_CHECKING:
    # OllamaClient is defined in Session F — import only for type hints.
    from app.services.ollama_client import OllamaClient


# ---------------------------------------------------------------------------
# Compaction trigger
# ---------------------------------------------------------------------------


async def should_compact(conversation: Conversation) -> bool:
    """Return True when a compaction should be triggered.

    Triggers every 10 assistant turns (turn_count divisible by 10, and > 0).
    """
    return conversation.turn_count > 0 and conversation.turn_count % 10 == 0


# ---------------------------------------------------------------------------
# Core compaction
# ---------------------------------------------------------------------------


async def compact_profile(
    user: User,
    recent_turns: list[dict[str, str]],  # [{"role": str, "content": str}, ...]
    ollama_client: "OllamaClient",        # injected — avoids circular import
    db: AsyncSession,
) -> str:
    """Summarise recent conversation turns into a persistent user profile.

    Steps:
      1. Build a compaction prompt from existing summary + new turns + raw traits.
      2. Call ollama_client.generate(prompt) → new_summary string.
      3. Persist new_summary to the User ORM row and commit.
      4. Upsert into ChromaDB via profile_store.
      5. Return new_summary.

    Args:
        user: The authenticated User ORM instance.
        recent_turns: Up to 20 most-recent conversation turns.
        ollama_client: Injected OllamaClient (Session F).
        db: Active async DB session.

    Returns:
        The newly generated compacted summary string.
    """
    # 1. Parse traits
    traits: dict[str, Any] = {}
    if user.traits_json:
        try:
            traits = json.loads(user.traits_json)
        except json.JSONDecodeError:
            traits = {}

    # 2. Format recent turns
    formatted_turns = "\n".join(
        f"{turn['role'].capitalize()}: {turn['content']}"
        for turn in recent_turns
    )

    # 3. Build prompt
    prompt = (
        "You are summarizing a user's life context for an AI assistant.\n\n"
        "EXISTING SUMMARY:\n"
        f"{user.compacted_summary or 'No prior summary.'}\n\n"
        "NEW CONVERSATION TURNS:\n"
        f"{formatted_turns}\n\n"
        "USER TRAITS (raw):\n"
        f"{json.dumps(traits, ensure_ascii=False)}\n\n"
        "Produce a new summary of 200–400 words capturing:\n"
        "- Who this person is (demographics, lifestyle)\n"
        "- Their current concerns and domains of difficulty\n"
        "- Patterns you've observed in how they think and communicate\n"
        "- What kinds of support seem most helpful\n\n"
        "Write in third-person, present tense. Be specific and factual. No platitudes.\n"
        "Output ONLY the summary text — no preamble, no headings."
    )

    # 4. Generate new summary
    new_summary: str = await ollama_client.generate(prompt)

    # 5. Persist to DB
    user.compacted_summary = new_summary
    user.profile_compacted_at = datetime.now(timezone.utc)
    db.add(user)
    await db.commit()
    await db.refresh(user)

    # 6. Upsert to ChromaDB
    profile_store.upsert_profile(
        user_id=str(user.id),
        compacted_summary=new_summary,
        traits=traits,
        conversation_count=user.conversation_count or 0,
    )

    return new_summary


# ---------------------------------------------------------------------------
# Context retrieval
# ---------------------------------------------------------------------------


async def get_context_for_llm(user: User) -> str:
    """Return the user's compacted summary for injection into LLM system prompts.

    Returns:
        The compacted_summary string if available, otherwise a default placeholder.
    """
    if user.compacted_summary:
        return user.compacted_summary
    return "No prior context available. This appears to be a new user."
