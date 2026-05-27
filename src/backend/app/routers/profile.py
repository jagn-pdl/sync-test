"""
app/routers/profile.py

Routes:
  GET  /profile/me       → ProfileResponse
  POST /profile/compact  → ProfileResponse (triggers memory compaction)

This module replaces _profile_stub.py from Session D. Update main.py to import
from app.routers.profile instead of app.routers._profile_stub.
"""

from __future__ import annotations

import json
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.conversation import Conversation
from app.models.message import Message
from app.models.user import User
from app.schemas.profile import CompactRequest, ProfileResponse
from app.services import compaction as compaction_service

router = APIRouter(prefix="/profile", tags=["profile"])

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _build_profile_response(user: User) -> ProfileResponse:
    """Construct a ProfileResponse from a User ORM instance."""
    traits: dict = {}
    if user.traits_json:
        try:
            traits = json.loads(user.traits_json)
        except json.JSONDecodeError:
            traits = {}

    return ProfileResponse(
        user_id=str(user.id),
        compacted_summary=user.compacted_summary,
        traits=traits,
        conversation_count=user.conversation_count or 0,
        profile_compacted_at=(
            user.profile_compacted_at.isoformat()
            if user.profile_compacted_at
            else None
        ),
    )


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@router.get("/me", response_model=ProfileResponse)
async def get_my_profile(
    current_user: Annotated[User, Depends(get_current_user)],
) -> ProfileResponse:
    """Return the authenticated user's current profile summary and traits."""
    return _build_profile_response(current_user)


@router.post("/compact", response_model=ProfileResponse)
async def compact_my_profile(
    body: CompactRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ProfileResponse:
    """Manually trigger profile compaction for the authenticated user.

    Loads the last 20 messages from the user's most recent conversation,
    then calls compact_profile. Pass `{"force": true}` to bypass the
    turn-count check.
    """
    # 1. Find most recent conversation
    result = await db.execute(
        select(Conversation)
        .where(Conversation.user_id == current_user.id)
        .order_by(Conversation.updated_at.desc())
        .limit(1)
    )
    conversation: Conversation | None = result.scalar_one_or_none()

    if conversation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No conversations found for this user.",
        )

    # 2. Optionally skip if compaction not yet due
    if not body.force and not await compaction_service.should_compact(conversation):
        return _build_profile_response(current_user)

    # 3. Load last 20 messages
    msgs_result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conversation.id)
        .order_by(Message.created_at.desc())
        .limit(20)
    )
    messages = list(reversed(msgs_result.scalars().all()))
    recent_turns: list[dict[str, str]] = [
        {"role": msg.role, "content": msg.content} for msg in messages
    ]

    # 4. Lazy import OllamaClient to avoid circular import at module level
    from app.services.ollama_client import get_ollama_client  # noqa: PLC0415

    ollama_client = get_ollama_client()

    # 5. Run compaction
    await compaction_service.compact_profile(
        user=current_user,
        recent_turns=recent_turns,
        ollama_client=ollama_client,
        db=db,
    )

    # 6. Refresh and return updated profile
    await db.refresh(current_user)
    return _build_profile_response(current_user)
