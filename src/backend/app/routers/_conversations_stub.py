"""Conversations router stub — wired fully in Session F."""

from __future__ import annotations

from fastapi import APIRouter

router = APIRouter()


@router.get("")
async def list_conversations_stub() -> dict[str, str]:
    return {"detail": "Not yet implemented — wired in Session F"}


@router.post("")
async def create_conversation_stub() -> dict[str, str]:
    return {"detail": "Not yet implemented — wired in Session F"}
