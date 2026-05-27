"""
app/services/widget_parser.py

Extracts and validates <widget>...</widget> blocks from raw LLM output.
Never raises — all parse failures return (text, None).
"""

from __future__ import annotations

import json
import re
from uuid import uuid4

from pydantic import ValidationError

from app.schemas.widget import UIWidget

# re.DOTALL so "." matches newlines — the LLM sometimes inserts line breaks
# inside the <widget> block.
WIDGET_PATTERN = re.compile(r"<widget>(.*?)</widget>", re.DOTALL)


def extract_widget(raw_response: str) -> tuple[str, UIWidget | None]:
    """Given raw LLM output, extract the <widget> block if present.

    Returns:
        (clean_message_text, widget_or_None)
        clean_message_text has the <widget> block stripped and is strip()ed.
    """
    match = WIDGET_PATTERN.search(raw_response)
    if match is None:
        return raw_response.strip(), None

    json_str = match.group(1).strip()
    clean_text = WIDGET_PATTERN.sub("", raw_response).strip()
    widget = parse_widget_json(json_str)
    return clean_text, widget


def parse_widget_json(json_str: str) -> UIWidget | None:
    """Parse a widget JSON string into a UIWidget.

    Returns:
        A valid UIWidget instance, or None on any parse / validation error.
        Assigns a UUID widget_id if the LLM did not include one.
    """
    try:
        data: dict = json.loads(json_str)
    except json.JSONDecodeError:
        return None

    if not isinstance(data, dict):
        return None

    # Assign a UUID widget_id if absent or empty
    if not data.get("widget_id"):
        data["widget_id"] = str(uuid4())

    try:
        return UIWidget.model_validate(data)
    except ValidationError:
        return None
