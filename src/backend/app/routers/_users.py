"""Users router — GET /users/me and PATCH /users/me/traits."""

from __future__ import annotations

import json

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.user import TraitsUpdateRequest, UserResponse

router = APIRouter()


@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user: User = Depends(get_current_user),
) -> UserResponse:
    return UserResponse.model_validate(current_user)


@router.patch("/me/traits", response_model=UserResponse)
async def update_traits(
    body: TraitsUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    # Load existing traits
    existing: dict = {}
    if current_user.traits_json:
        existing = json.loads(current_user.traits_json)

    # Merge — only update keys that are explicitly provided (non-None in body)
    incoming = body.model_dump(exclude_none=True)
    existing.update(incoming)

    current_user.traits_json = json.dumps(existing)
    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)

    return UserResponse.model_validate(current_user)
