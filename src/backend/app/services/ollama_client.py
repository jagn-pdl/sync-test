"""
app/services/ollama_client.py

Async HTTP client for the local Ollama LLM service.
"""

from __future__ import annotations

import httpx
from fastapi import HTTPException

from app.core.config import settings

_TIMEOUT = 60.0  # generation on a 3B model can be slow


class OllamaClient:
    """Thin async wrapper around the Ollama REST API."""

    def __init__(self, base_url: str, model: str) -> None:
        self._base_url = base_url.rstrip("/")
        self._model = model

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def generate(self, prompt: str, system: str = "") -> str:
        """Call /api/generate (single-turn completion).

        Args:
            prompt: The user prompt string.
            system: Optional system prompt injected at the top.

        Returns:
            The full response text from the model.

        Raises:
            HTTPException 503: If Ollama is unreachable or returns a non-200 status.
        """
        payload: dict[str, object] = {
            "model": self._model,
            "prompt": prompt,
            "stream": False,
        }
        if system:
            payload["system"] = system

        return await self._post("/api/generate", payload, key="response")

    async def chat(self, messages: list[dict], system: str = "") -> str:
        """Call /api/chat (multi-turn chat completion).

        Args:
            messages: List of {"role": str, "content": str} dicts.
            system: Optional system prompt; prepended as a system message if provided.

        Returns:
            The assistant content string.

        Raises:
            HTTPException 503: If Ollama is unreachable or returns a non-200 status.
        """
        # Prepend system message when provided and not already present
        effective_messages = list(messages)
        if system:
            effective_messages = [{"role": "system", "content": system}] + effective_messages

        payload: dict[str, object] = {
            "model": self._model,
            "messages": effective_messages,
            "stream": False,
        }

        raw = await self._post("/api/chat", payload, key=None)
        # /api/chat response shape: {"message": {"role": "assistant", "content": "..."}}
        if not isinstance(raw, dict):
            raise HTTPException(status_code=503, detail="LLM service unavailable")
        message = raw.get("message")
        if not isinstance(message, dict):
            raise HTTPException(status_code=503, detail="LLM service unavailable")
        content = message.get("content")
        if not isinstance(content, str):
            raise HTTPException(status_code=503, detail="LLM service unavailable")
        return content

    async def is_available(self) -> bool:
        """GET /api/tags — returns True if Ollama is reachable."""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(f"{self._base_url}/api/tags")
            return response.status_code == 200
        except (httpx.ConnectError, httpx.TimeoutException):
            return False

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    async def _post(
        self,
        path: str,
        payload: dict[str, object],
        key: str | None,
    ) -> str | dict:
        """POST to Ollama, raise 503 on any connection/HTTP error.

        Args:
            path: URL path (e.g. "/api/generate").
            payload: JSON-serialisable request body.
            key: If a str, extract response.json()[key] and return it.
                 If None, return the full parsed JSON dict.

        Returns:
            Either a string (when key is provided) or the full response dict.

        Raises:
            HTTPException 503: On any connection error or non-200 HTTP response.
        """
        try:
            async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
                response = await client.post(
                    f"{self._base_url}{path}",
                    json=payload,
                )
        except httpx.ConnectError as exc:
            raise HTTPException(status_code=503, detail="LLM service unavailable") from exc
        except httpx.TimeoutException as exc:
            raise HTTPException(status_code=503, detail="LLM service unavailable") from exc

        if response.status_code != 200:
            raise HTTPException(status_code=503, detail="LLM service unavailable")

        data = response.json()
        if key is None:
            return data  # type: ignore[return-value]

        value = data.get(key)
        if not isinstance(value, str):
            raise HTTPException(status_code=503, detail="LLM service unavailable")
        return value


# ---------------------------------------------------------------------------
# Module-level singleton
# ---------------------------------------------------------------------------

ollama_client = OllamaClient(settings.OLLAMA_BASE_URL, settings.OLLAMA_MODEL)


def get_ollama_client() -> OllamaClient:
    """Return the module-level OllamaClient singleton.

    Used by profile.py (lazy import to avoid circular imports at module load).
    chat.py imports the singleton directly — both reference the same instance.
    """
    return ollama_client
