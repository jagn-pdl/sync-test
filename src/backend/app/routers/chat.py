"""
app/routers/chat.py

POST /chat      — send a message, receive an assistant reply + optional widget
GET  /chat/history/{conversation_id} — load all messages for a conversation
"""

from __future__ import annotations

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.conversation import Conversation
from app.models.message import Message
from app.models.user import User
from app.schemas.chat import ChatRequest, ChatResponse, MessageSchema
from app.services import compaction, context_builder
from app.services.ollama_client import ollama_client
from app.services.widget_parser import extract_widget

router = APIRouter()


# ---------------------------------------------------------------------------
# POST /chat
# ---------------------------------------------------------------------------


@router.post("/chat", response_model=ChatResponse)
async def send_message(
    body: ChatRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ChatResponse:
    """Send a user message and receive an assistant reply.

    Steps:
      1. Load + verify conversation ownership.
      2. Optionally store a widget_response as a formatted user message.
      3. Store the user message.
      4. Build system prompt and message history.
      5. Call Ollama.
      6. Parse widget from response.
      7. Store assistant message.
      8. Increment turn_count; commit.
      9. Schedule background compaction if needed.
      10. Return ChatResponse.
    """
    # 1. Load conversation and verify ownership
    result = await db.execute(
        select(Conversation).where(Conversation.id == body.conversation_id)
    )
    conversation: Conversation | None = result.scalar_one_or_none()
    if conversation is None or conversation.user_id != str(current_user.id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")

    # 2. If widget_response present, store it as a user message before the text message
    if body.widget_response is not None:
        widget_content = (
            f"[{body.widget_response.field_key}]: {body.widget_response.value}"
        )
        widget_user_msg = Message(
            conversation_id=str(conversation.id),
            role="user",
            content=widget_content,
        )
        db.add(widget_user_msg)
        await db.flush()  # assign id without committing

    # 3. Store the user's text message
    user_msg = Message(
        conversation_id=str(conversation.id),
        role="user",
        content=body.message,
    )
    db.add(user_msg)
    await db.flush()

    # Auto-title: set title from first user message if still None
    if conversation.title is None and body.message:
        title_text = body.message[:50]
        conversation.title = title_text + "…" if len(body.message) > 50 else title_text
        db.add(conversation)

    # 4a. Build system prompt
    system_prompt = await context_builder.build_system_prompt(current_user, db)

    # 4b. Build message history (last 6 user/assistant turns)
    history = await context_builder.build_message_history(
        conversation_id=str(conversation.id),
        db=db,
        limit=6,
    )

    # 5. Call Ollama
    raw_response = await ollama_client.chat(messages=history, system=system_prompt)

    # 6. Parse widget from response
    clean_text, widget = extract_widget(raw_response)

    # 7. Store assistant message
    assistant_msg = Message(
        conversation_id=str(conversation.id),
        role="assistant",
        content=clean_text,
        ui_widget_json=widget.model_dump_json() if widget is not None else None,
    )
    db.add(assistant_msg)

    # 8. Increment turn_count and commit
    conversation.turn_count = (conversation.turn_count or 0) + 1
    db.add(conversation)
    await db.commit()
    await db.refresh(assistant_msg)
    await db.refresh(conversation)

    # 9. Schedule background compaction if triggered
    if await compaction.should_compact(conversation):
        # Fetch recent turns for compaction context (up to 20)
        turns_result = await db.execute(
            select(Message)
            .where(
                Message.conversation_id == str(conversation.id),
                Message.role.in_(["user", "assistant"]),
            )
            .order_by(Message.created_at.desc())
            .limit(20)
        )
        recent_turns_raw = list(reversed(turns_result.scalars().all()))
        recent_turns = [{"role": m.role, "content": m.content} for m in recent_turns_raw]

        # Background task receives a fresh DB session — not the request session
        # (which closes after this response is sent).
        background_tasks.add_task(
            _run_compaction_background,
            user_id=str(current_user.id),
            recent_turns=recent_turns,
        )

    # 10. Return response
    message_schema = MessageSchema(
        id=str(assistant_msg.id),
        role=assistant_msg.role,
        content=assistant_msg.content,
        timestamp=assistant_msg.created_at.isoformat(),
        ui_widget=widget,
    )
    return ChatResponse(
        message=message_schema,
        widget=widget,
        conversation_id=str(conversation.id),
    )


# ---------------------------------------------------------------------------
# GET /chat/history/{conversation_id}
# ---------------------------------------------------------------------------


@router.get("/chat/history/{conversation_id}", response_model=list[MessageSchema])
async def get_chat_history(
    conversation_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[MessageSchema]:
    """Load all messages for a conversation (ownership verified)."""
    # Verify ownership
    conv_result = await db.execute(
        select(Conversation).where(Conversation.id == conversation_id)
    )
    conversation: Conversation | None = conv_result.scalar_one_or_none()
    if conversation is None or conversation.user_id != str(current_user.id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")

    result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.asc())
    )
    messages = result.scalars().all()

    return [
        MessageSchema(
            id=str(m.id),
            role=m.role,
            content=m.content,
            timestamp=m.created_at.isoformat(),
            ui_widget=None,  # widget JSON is stored; omit from history for simplicity
        )
        for m in messages
    ]


# ---------------------------------------------------------------------------
# Background compaction helper
# ---------------------------------------------------------------------------


async def _run_compaction_background(
    user_id: str,
    recent_turns: list[dict[str, str]],
) -> None:
    """Run compact_profile in the background with a fresh DB session.

    This function gets its own session so it is not tied to the request
    lifecycle (the request session closes before the background task runs).
    """
    from app.core.database import AsyncSessionLocal

    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(User).where(User.id == user_id)
        )
        user: User | None = result.scalar_one_or_none()
        if user is None:
            return
        try:
            await compaction.compact_profile(
                user=user,
                recent_turns=recent_turns,
                ollama_client=ollama_client,
                db=db,
            )
        except Exception:
            # Compaction failures must never surface to the user.
            pass
