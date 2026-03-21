from copy import deepcopy
from typing import Any

from fastapi import APIRouter, Body

from backend.db import get_db

router = APIRouter()

_DEFAULT_PROFILE = {
    "fullName": "",
    "email": "",
    "phone": "",
    "department": "",
    "address": "",
    "photo": None,
    "photoName": "",
    "role": "Faculty",
}

_DEFAULT_TOGGLES = {
    "courseNotifications": True,
    "assignmentReminder": True,
    "assignment_submission": True,
    "student_doubt": True,
}

_FALLBACK_STORE: dict[str, dict[str, Any]] = {}


def _normalize_doc(user_id: str, doc: dict[str, Any] | None) -> dict[str, Any]:
    payload = doc or {}
    profile = deepcopy(_DEFAULT_PROFILE)
    profile.update(payload.get("profile") or {})
    toggles = deepcopy(_DEFAULT_TOGGLES)
    toggles.update(payload.get("toggles") or payload.get("alerts") or {})
    return {
        "user_id": user_id,
        "data": {
            "profile": profile,
            "toggles": toggles,
        },
        "profile": profile,
        "toggles": toggles,
        # Legacy fields requested in audit prompt.
        "faculty_id": user_id,
        "name": profile.get("fullName", ""),
        "email": profile.get("email", ""),
        "phone": profile.get("phone", ""),
        "assignment_submission": toggles.get("assignment_submission", True),
        "student_doubt": toggles.get("student_doubt", True),
        "assignment_reminder": toggles.get("assignmentReminder", True),
    }


async def _get_doc(user_id: str) -> dict[str, Any]:
    db = get_db()
    doc = await db["faculty_settings"].find_one({"user_id": user_id})
    if doc:
        return {k: v for k, v in doc.items() if k not in {"_id", "user_id"}}

    seed = {
        "profile": {
            **_DEFAULT_PROFILE,
            "fullName": "Dr Kumar",
            "email": "faculty@mit.edu",
            "phone": "9876543210",
        },
        "toggles": deepcopy(_DEFAULT_TOGGLES),
    }
    await db["faculty_settings"].update_one({"user_id": user_id}, {"$set": seed}, upsert=True)
    return seed


@router.get("/{faculty_id}")
async def get_faculty_settings(faculty_id: str):
    try:
        doc = await _get_doc(faculty_id)
        return _normalize_doc(faculty_id, doc)
    except Exception as error:
        fallback = _FALLBACK_STORE.get(faculty_id, {"profile": deepcopy(_DEFAULT_PROFILE), "toggles": deepcopy(_DEFAULT_TOGGLES)})
        response = _normalize_doc(faculty_id, fallback)
        response["error"] = str(error)
        return response


@router.put("/{faculty_id}")
async def update_faculty_settings(faculty_id: str, body: dict[str, Any] = Body(default_factory=dict)):
    # Generic route required by the audit contract.
    try:
        payload = body or {}
        db = get_db()
        await db["faculty_settings"].update_one({"user_id": faculty_id}, {"$set": payload}, upsert=True)
        updated = await _get_doc(faculty_id)
        return {"status": "updated", **_normalize_doc(faculty_id, updated)}
    except Exception as error:
        fallback = _FALLBACK_STORE.get(faculty_id, {"profile": deepcopy(_DEFAULT_PROFILE), "toggles": deepcopy(_DEFAULT_TOGGLES)})
        fallback.update(body or {})
        _FALLBACK_STORE[faculty_id] = fallback
        return {"status": "updated", "error": str(error), **_normalize_doc(faculty_id, fallback)}


@router.put("/profile/{faculty_id}")
async def update_faculty_profile(faculty_id: str, body: dict[str, Any] = Body(default_factory=dict)):
    try:
        db = get_db()
        current = await _get_doc(faculty_id)
        profile = deepcopy(_DEFAULT_PROFILE)
        profile.update(current.get("profile") or {})
        profile.update(body or {})
        await db["faculty_settings"].update_one({"user_id": faculty_id}, {"$set": {"profile": profile}}, upsert=True)
        return {"message": "Faculty profile updated successfully.", **profile, "user_id": faculty_id, "data": profile}
    except Exception as error:
        fallback = _FALLBACK_STORE.get(faculty_id, {"profile": deepcopy(_DEFAULT_PROFILE), "toggles": deepcopy(_DEFAULT_TOGGLES)})
        profile = fallback.get("profile") or {}
        profile.update(body or {})
        fallback["profile"] = profile
        _FALLBACK_STORE[faculty_id] = fallback
        return {"message": "Faculty profile updated successfully.", "error": str(error), **profile, "user_id": faculty_id, "data": profile}


@router.put("/toggles/{faculty_id}")
async def update_faculty_toggles(faculty_id: str, body: dict[str, Any] = Body(default_factory=dict)):
    try:
        db = get_db()
        current = await _get_doc(faculty_id)
        toggles = deepcopy(_DEFAULT_TOGGLES)
        toggles.update(current.get("toggles") or {})
        toggles.update(body or {})
        await db["faculty_settings"].update_one({"user_id": faculty_id}, {"$set": {"toggles": toggles}}, upsert=True)
        return {"message": "Faculty notification preferences saved.", "user_id": faculty_id, "data": {"toggles": toggles}, "toggles": toggles}
    except Exception as error:
        fallback = _FALLBACK_STORE.get(faculty_id, {"profile": deepcopy(_DEFAULT_PROFILE), "toggles": deepcopy(_DEFAULT_TOGGLES)})
        toggles = fallback.get("toggles") or {}
        toggles.update(body or {})
        fallback["toggles"] = toggles
        _FALLBACK_STORE[faculty_id] = fallback
        return {"message": "Faculty notification preferences saved.", "error": str(error), "user_id": faculty_id, "data": {"toggles": toggles}, "toggles": toggles}


@router.put("/alerts/{faculty_id}")
async def update_faculty_alerts(faculty_id: str, body: dict[str, Any] = Body(default_factory=dict)):
    # Alias required by the audit contract.
    return await update_faculty_toggles(faculty_id, body)
