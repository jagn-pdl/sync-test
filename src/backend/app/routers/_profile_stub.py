"""Profile router stub — wired fully in Session E."""

from __future__ import annotations

from fastapi import APIRouter

router = APIRouter()


@router.post("/compact")
async def compact_profile_stub() -> dict[str, str]:
    return {"detail": "Not yet implemented — wired in Session E"}
