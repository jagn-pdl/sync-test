"""
app/core/errors.py

Structured application exceptions for PersonalAssistant.

All custom exceptions inherit from AppError, which carries an HTTP
status_code and a detail string.  A global exception handler in
main.py catches AppError and converts it to a JSONResponse.

Usage:
    raise NotFoundError("Conversation not found")
    raise UnauthorizedError()
    raise ConflictError("Email already registered")
    raise ServiceUnavailableError("Ollama is not reachable")
"""

from __future__ import annotations


# ---------------------------------------------------------------------------
# Base
# ---------------------------------------------------------------------------


class AppError(Exception):
    """Base class for all application-level errors.

    Args:
        detail: Human-readable error description returned in the JSON response.
        status_code: HTTP status code (defaults to 500).
    """

    status_code: int = 500

    def __init__(self, detail: str = "An unexpected error occurred") -> None:
        super().__init__(detail)
        self.detail = detail


# ---------------------------------------------------------------------------
# 4xx client errors
# ---------------------------------------------------------------------------


class NotFoundError(AppError):
    """HTTP 404 — the requested resource does not exist."""

    status_code = 404

    def __init__(self, detail: str = "Not found") -> None:
        super().__init__(detail)


class UnauthorizedError(AppError):
    """HTTP 401 — missing or invalid authentication credentials."""

    status_code = 401

    def __init__(self, detail: str = "Not authenticated") -> None:
        super().__init__(detail)


class ConflictError(AppError):
    """HTTP 409 — the request conflicts with existing state (e.g. duplicate email)."""

    status_code = 409

    def __init__(self, detail: str = "Conflict") -> None:
        super().__init__(detail)


# ---------------------------------------------------------------------------
# 5xx server errors
# ---------------------------------------------------------------------------


class ServiceUnavailableError(AppError):
    """HTTP 503 — a downstream service (Ollama, ChromaDB) is unreachable.

    Used by:
    - app.services.ollama_client  (LLM inference failures)
    - app.services.chroma_client  (vector DB unavailability)
    """

    status_code = 503

    def __init__(self, detail: str = "Service temporarily unavailable") -> None:
        super().__init__(detail)
