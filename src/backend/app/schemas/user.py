from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    name: str
    created_at: datetime
    profile_compacted_at: datetime | None


class TraitsUpdateRequest(BaseModel):
    # Known optional fields
    age: int | None = None
    height_cm: float | None = None
    weight_kg: float | None = None
    lifestyle: str | None = None
    goals: list[str] | None = None
    domains_of_concern: list[str] | None = None

    # Extensible: additional keys accepted via model_extra
    model_config = ConfigDict(extra="allow")

    def model_dump(self, **kwargs: Any) -> dict[str, Any]:  # type: ignore[override]
        """Include both declared fields and extra fields."""
        base = super().model_dump(**kwargs)
        base.update(self.model_extra or {})
        return base
