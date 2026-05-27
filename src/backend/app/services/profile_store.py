"""
app/services/profile_store.py

Synchronous CRUD operations for the ChromaDB 'user_profiles' collection.

All functions are synchronous because the ChromaDB embedded (PersistentClient)
is a synchronous client. When called from async FastAPI route handlers:
  - For <1 000 users the latency is negligible; a plain call is fine.
  - For larger deployments, wrap in `await asyncio.get_event_loop().run_in_executor(None, fn)`.
  A comment marks each call site where that escalation would apply.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from app.services.chroma_client import get_profiles_collection


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _flatten_traits(traits: dict[str, Any]) -> dict[str, str | int | float | bool]:
    """Flatten a traits dict so only ChromaDB-legal scalar types remain.

    ChromaDB metadata values must be str, int, float, or bool.
    Lists are joined as comma-separated strings; other non-scalars are cast to str.
    """
    flat: dict[str, str | int | float | bool] = {}
    for key, value in traits.items():
        if isinstance(value, (str, int, float, bool)):
            flat[key] = value
        elif isinstance(value, list):
            flat[key] = ", ".join(str(v) for v in value)
        else:
            flat[key] = str(value)
    return flat


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def upsert_profile(
    user_id: str,
    compacted_summary: str,
    traits: dict[str, Any],
    conversation_count: int,
) -> None:
    """Upsert a user's compacted summary into the ChromaDB collection.

    Args:
        user_id: Unique user identifier (used as the document ID).
        compacted_summary: Prose summary string (200–400 words).
        traits: Raw traits dict from user.traits_json (already parsed).
        conversation_count: Current conversation count for the user.
    """
    collection = get_profiles_collection()
    metadata: dict[str, str | int | float | bool] = {
        "user_id": user_id,
        "conversation_count": conversation_count,
        "last_updated": datetime.now(timezone.utc).isoformat(),
        **_flatten_traits(traits),
    }
    # run_in_executor escalation point for >1 000 users
    collection.upsert(
        ids=[user_id],
        documents=[compacted_summary],
        metadatas=[metadata],
    )


def get_profile_summary(user_id: str) -> str | None:
    """Retrieve a user's compacted summary from ChromaDB.

    Returns:
        The document string if found, otherwise None.
    """
    collection = get_profiles_collection()
    # run_in_executor escalation point for >1 000 users
    result = collection.get(ids=[user_id], include=["documents"])
    docs: list[str | None] = result.get("documents") or []
    if docs and docs[0] is not None:
        return docs[0]
    return None


def delete_profile(user_id: str) -> None:
    """Delete a user's profile document from ChromaDB.

    No-op if the document does not exist.
    """
    collection = get_profiles_collection()
    try:
        # run_in_executor escalation point for >1 000 users
        collection.delete(ids=[user_id])
    except Exception:
        # ChromaDB raises if the id is not found; swallow silently.
        pass


def search_similar_profiles(
    query_text: str,
    n_results: int = 3,
) -> list[dict[str, Any]]:
    """Semantic similarity search across all stored profiles.

    Exposed for future feature expansion (e.g. admin tooling, clustering).
    Not wired to any route in this session.

    Args:
        query_text: Free-text query to embed and compare.
        n_results: Maximum number of results to return.

    Returns:
        List of dicts with keys: id, document, metadata.
    """
    collection = get_profiles_collection()
    # run_in_executor escalation point for >1 000 users
    result = collection.query(
        query_texts=[query_text],
        n_results=n_results,
        include=["documents", "metadatas"],
    )
    ids: list[str] = (result.get("ids") or [[]])[0]
    documents: list[str | None] = (result.get("documents") or [[]])[0]
    metadatas: list[dict[str, Any] | None] = (result.get("metadatas") or [[]])[0]

    return [
        {
            "id": ids[i],
            "document": documents[i],
            "metadata": metadatas[i] or {},
        }
        for i in range(len(ids))
    ]
