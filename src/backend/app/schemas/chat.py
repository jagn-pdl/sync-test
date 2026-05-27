from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict


class MessageSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    role: str
    content: str
    timestamp: datetime
    ui_widget: dict[str, Any] | None = None


class ChatRequest(BaseModel):
    message: str
    conversation_id: str
    widget_response: dict[str, Any] | None = None


class ChatResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    message: MessageSchema
    widget: dict[str, Any] | None = None
    conversation_id: str


class ConversationSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    title: str | None
    created_at: datetime
    updated_at: datetime
    turn_count: int
