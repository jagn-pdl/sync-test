"""
app/schemas/profile.py

Pydantic schemas for the /profile endpoints.
"""

from __future__ import annotations

from pydantic import BaseModel


class ProfileResponse(BaseModel):
    """Response schema for GET /profile/me and POST /profile/compact."""

    user_id: str
    compacted_summary: str | None
    traits: dict
    conversation_count: int
    profile_compacted_at: str | None

    model_config = {"from_attributes": True}


class CompactRequest(BaseModel):
    """Request body for POST /profile/compact."""

    force: bool = False
