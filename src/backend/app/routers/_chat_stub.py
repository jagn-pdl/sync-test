"""Chat router stub — wired fully in Session F."""

from __future__ import annotations

from fastapi import APIRouter

router = APIRouter()


@router.post("")
async def chat_stub() -> dict[str, str]:
    return {"detail": "Not yet implemented — wired in Session F"}


@router.get("/history/{conversation_id}")
async def chat_history_stub(conversation_id: str) -> dict[str, str]:
    return {"detail": "Not yet implemented — wired in Session F"}
