"""
app/services/chroma_client.py

Module-level singleton ChromaDB client.

NOTE: chromadb.PersistentClient is NOT thread-safe for concurrent writes.
In production, run uvicorn with a single worker (--workers 1). For multi-worker
deployments, switch to chromadb.HttpClient pointing at a dedicated Chroma server.
"""

from __future__ import annotations

import chromadb
from chromadb.config import Settings as ChromaSettings
from fastapi import HTTPException

from app.core.config import settings

# ---------------------------------------------------------------------------
# Singleton state
# ---------------------------------------------------------------------------
_client: chromadb.ClientAPI | None = None
_profiles_collection: chromadb.Collection | None = None

COLLECTION_NAME = "user_profiles"


# ---------------------------------------------------------------------------
# Public accessors
# ---------------------------------------------------------------------------


def get_chroma_client() -> chromadb.ClientAPI:
    """Return (or lazily initialise) the module-level ChromaDB client."""
    global _client
    if _client is None:
        try:
            _client = chromadb.PersistentClient(
                path=settings.CHROMA_PERSIST_DIR,
                settings=ChromaSettings(anonymized_telemetry=False),
            )
        except Exception as exc:
            raise HTTPException(
                status_code=503,
                detail="Profile store unavailable",
            ) from exc
    return _client


def get_profiles_collection() -> chromadb.Collection:
    """Return (or lazily create) the 'user_profiles' collection.

    Uses ChromaDB's default embedding function (all-MiniLM-L6-v2 via ONNX).
    No external embedding API is required.
    """
    global _profiles_collection
    if _profiles_collection is None:
        try:
            client = get_chroma_client()
            _profiles_collection = client.get_or_create_collection(
                name=COLLECTION_NAME,
                # Default embedding function — omitting `embedding_function`
                # causes Chroma to use its built-in all-MiniLM-L6-v2 model.
            )
        except HTTPException:
            raise
        except Exception as exc:
            raise HTTPException(
                status_code=503,
                detail="Profile store unavailable",
            ) from exc
    return _profiles_collection
