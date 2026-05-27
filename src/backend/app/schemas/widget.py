"""
app/schemas/widget.py

Pydantic v2 models for the UIWidget shared_contract defined in PLAN.md.
"""

from __future__ import annotations

from typing import Literal
from uuid import uuid4

from pydantic import BaseModel, ConfigDict, Field

UIWidgetType = Literal[
    "slider",
    "radio_group",
    "checkbox_group",
    "date_picker",
    "scale_rating",
    "text_input",
    "number_input",
    "multi_select",
    "confirm",
]


class UIWidget(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    widget_id: str = Field(default_factory=lambda: str(uuid4()))
    type: UIWidgetType
    label: str
    description: str | None = None
    options: list[str] | None = None
    min: float | None = None
    max: float | None = None
    step: float | None = None
    unit: str | None = None
    required: bool = True
    field_key: str
