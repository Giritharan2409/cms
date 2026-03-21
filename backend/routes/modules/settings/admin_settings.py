from copy import deepcopy
from typing import Any

from fastapi import APIRouter, Body

from backend.db import get_db

router = APIRouter()

_DEFAULT_PROFILE = {
    "adminId": "",
    "fullName": "",
    "email": "",
    "phone": "",
    "photo": None,
    "photoName": "",
}

_DEFAULT_SYSTEM = {
    "collegeName": "MIT Connect",
    "collegeLogo": None,
    "collegeLogoName": "",
    "address": "",
    "contactEmail": "",
    "phoneNumber": "",
}

_DEFAULT_ACADEMIC = {
    "departments": "",
    "courses": "",
    "semesters": "",
}

_FALLBACK_STORE: dict[str, dict[str, Any]] = {}


def _normalize_doc(user_id: str, doc: dict[str, Any] | None) -> dict[str, Any]:
    payload = doc or {}
    profile = deepcopy(_DEFAULT_PROFILE)
    profile.update(payload.get("profile") or {})
    profile["adminId"] = profile.get("adminId") or user_id

    system = deepcopy(_DEFAULT_SYSTEM)
    system.update(payload.get("system") or {})

    academic = deepcopy(_DEFAULT_ACADEMIC)
    academic.update(payload.get("academic") or {})

    return {
        "user_id": user_id,
        "data": {
            "profile": profile,
            "system": system,
            "academic": academic,
        },
        "profile": profile,
        "system": system,
        "academic": academic,
        # Legacy aliases for audit checks.
        "admin_id": user_id,
        "name": profile.get("fullName", ""),
        "email": profile.get("email", ""),
        "phone": profile.get("phone", ""),
        "college_name": system.get("collegeName", "MIT Connect"),
    }


async def _get_doc(user_id: str) -> dict[str, Any]:
    db = get_db()
    doc = await db["admin_settings"].find_one({"user_id": user_id})
    if doc:
        return {k: v for k, v in doc.items() if k not in {"_id", "user_id"}}

    seed = {
        "profile": {
            **_DEFAULT_PROFILE,
            "adminId": user_id,
            "fullName": "Admin User",
            "email": "admin@mit.edu",
            "phone": "9999999999",
        },
        "system": deepcopy(_DEFAULT_SYSTEM),
        "academic": deepcopy(_DEFAULT_ACADEMIC),
        "password": "admin123",
    }
    await db["admin_settings"].update_one({"user_id": user_id}, {"$set": seed}, upsert=True)
    return seed


@router.get("/{admin_id}")
async def get_admin_settings(admin_id: str):
    try:
        doc = await _get_doc(admin_id)
        return _normalize_doc(admin_id, doc)
    except Exception as error:
        fallback = _FALLBACK_STORE.get(admin_id, {"profile": deepcopy(_DEFAULT_PROFILE), "system": deepcopy(_DEFAULT_SYSTEM), "academic": deepcopy(_DEFAULT_ACADEMIC), "password": "admin123"})
        response = _normalize_doc(admin_id, fallback)
        response["error"] = str(error)
        return response


@router.put("/{admin_id}")
async def update_admin_settings(admin_id: str, body: dict[str, Any] = Body(default_factory=dict)):
    try:
        db = get_db()
        await db["admin_settings"].update_one({"user_id": admin_id}, {"$set": body or {}}, upsert=True)
        updated = await _get_doc(admin_id)
        return {"status": "updated", **_normalize_doc(admin_id, updated)}
    except Exception as error:
        fallback = _FALLBACK_STORE.get(admin_id, {"profile": deepcopy(_DEFAULT_PROFILE), "system": deepcopy(_DEFAULT_SYSTEM), "academic": deepcopy(_DEFAULT_ACADEMIC), "password": "admin123"})
        fallback.update(body or {})
        _FALLBACK_STORE[admin_id] = fallback
        return {"status": "updated", "error": str(error), **_normalize_doc(admin_id, fallback)}
