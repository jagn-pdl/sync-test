"""
app/routers/conversations.py

GET  /conversations    — list all conversations for the current user
POST /conversations    — create a new conversation (with optional onboarding prompt)
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.conversation import Conversation
from app.models.message import Message
from app.models.user import User
from app.schemas.chat import ConversationSchema
from app.services.context_builder import get_onboarding_prompt

router = APIRouter()


# ---------------------------------------------------------------------------
# GET /conversations
# ---------------------------------------------------------------------------


@router.get("/conversations", response_model=list[ConversationSchema])
async def list_conversations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[ConversationSchema]:
    """List all conversations for the current user, ordered by updated_at desc."""
    result = await db.execute(
        select(Conversation)
        .where(Conversation.user_id == str(current_user.id))
        .order_by(Conversation.updated_at.desc())
    )
    conversations = result.scalars().all()

    return [
        ConversationSchema(
            id=str(c.id),
            title=c.title,
            turn_count=c.turn_count,
            created_at=c.created_at.isoformat(),
            updated_at=c.updated_at.isoformat(),
        )
        for c in conversations
    ]


# ---------------------------------------------------------------------------
# POST /conversations
# ---------------------------------------------------------------------------


@router.post("/conversations", response_model=ConversationSchema, status_code=status.HTTP_201_CREATED)
async def create_conversation(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ConversationSchema:
    """Create a new conversation for the current user.

    - title is None initially (auto-set after first user message in chat.py).
    - If this is the user's first conversation AND they have no compacted_summary,
      store an onboarding system message in the conversation.
    """
    conversation = Conversation(
        user_id=str(current_user.id),
        title=None,
        turn_count=0,
    )
    db.add(conversation)
    await db.flush()  # get conversation.id without committing yet

    # Determine whether to inject an onboarding system message
    is_first_conversation = (current_user.conversation_count or 0) == 0
    has_no_summary = not current_user.compacted_summary

    if is_first_conversation and has_no_summary:
        onboarding_text = await get_onboarding_prompt(current_user)
        system_msg = Message(
            conversation_id=str(conversation.id),
            role="system",
            content=onboarding_text,
        )
        db.add(system_msg)

    # Increment the user's conversation_count
    current_user.conversation_count = (current_user.conversation_count or 0) + 1
    db.add(current_user)

    await db.commit()
    await db.refresh(conversation)

    return ConversationSchema(
        id=str(conversation.id),
        title=conversation.title,
        turn_count=conversation.turn_count,
        created_at=conversation.created_at.isoformat(),
        updated_at=conversation.updated_at.isoformat(),
    )
