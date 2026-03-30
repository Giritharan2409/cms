"""
MongoDB utility helpers.

Connection is managed centrally by ``backend.db``.  This module re-exports
a thin ``get_database()`` async wrapper (for routes that still call it) and
keeps the pure-utility functions ``parse_object_id`` / ``serialize_doc``.
"""

from typing import Optional

from bson import ObjectId
from fastapi import HTTPException

from backend.db import get_db


# ---------------------------------------------------------------------------
# Backwards-compatible async wrapper
# ---------------------------------------------------------------------------
async def get_database():
    """
    Return the shared MongoDB database handle.

    This is an async function only for API compatibility — the actual
    connection is managed by the self-healing loop in ``backend.db``.
    """
    return get_db()


# ---------------------------------------------------------------------------
# Utility helpers (unchanged)
# ---------------------------------------------------------------------------
def parse_object_id(value: str) -> ObjectId:
    try:
        return ObjectId(value)
    except Exception as error:
        raise HTTPException(status_code=400, detail="Invalid ID format") from error


def serialize_doc(document: Optional[dict]) -> Optional[dict]:
    if not document:
        return document

    doc = dict(document)  # Work on a copy to avoid in-place mutation
    if "_id" in doc:
        doc["id"] = str(doc["_id"])
        del doc["_id"]

    return doc
