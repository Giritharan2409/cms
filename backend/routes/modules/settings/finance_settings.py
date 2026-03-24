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
    "role": "Finance",
}

_DEFAULT_TOGGLES = {
    "paymentNotifications": True,
    "refundAlerts": True,
}

_FALLBACK_STORE: dict[str, dict[str, Any]] = {}


def _normalize_doc(user_id: str, doc: dict[str, Any] | None) -> dict[str, Any]:
    payload = doc or {}
    profile = deepcopy(_DEFAULT_PROFILE)
    profile.update(payload.get("profile") or {})
    toggles = deepcopy(_DEFAULT_TOGGLES)
    toggles.update(payload.get("toggles") or {})
    return {
        "user_id": user_id,
        "data": {
            "profile": profile,
            "toggles": toggles,
        },
        "profile": profile,
        "toggles": toggles,
        # Legacy aliases used by simple checks.
        "finance_id": user_id,
        "name": profile.get("fullName", ""),
        "email": profile.get("email", ""),
        "phone": profile.get("phone", ""),
        "payment_notifications": toggles.get("paymentNotifications", True),
        "refund_alerts": toggles.get("refundAlerts", True),
    }


async def _get_doc(user_id: str) -> dict[str, Any]:
    db = get_db()
    doc = await db["finance_settings"].find_one({"user_id": user_id})
    if doc:
        return {k: v for k, v in doc.items() if k not in {"_id", "user_id"}}

    seed = {
        "profile": {
            **_DEFAULT_PROFILE,
            "fullName": "Finance Manager",
            "email": "finance@mit.edu",
            "phone": "9876501234",
        },
        "toggles": deepcopy(_DEFAULT_TOGGLES),
    }
    await db["finance_settings"].update_one({"user_id": user_id}, {"$set": seed}, upsert=True)
    return seed


@router.get("/{finance_id}")
async def get_finance_settings(finance_id: str):
    try:
        doc = await _get_doc(finance_id)
        return _normalize_doc(finance_id, doc)
    except Exception as error:
        fallback = _FALLBACK_STORE.get(finance_id, {"profile": deepcopy(_DEFAULT_PROFILE), "toggles": deepcopy(_DEFAULT_TOGGLES)})
        response = _normalize_doc(finance_id, fallback)
        response["error"] = str(error)
        return response


@router.put("/{finance_id}")
async def update_finance_settings(finance_id: str, body: dict[str, Any] = Body(default_factory=dict)):
    try:
        db = get_db()
        await db["finance_settings"].update_one({"user_id": finance_id}, {"$set": body or {}}, upsert=True)
        updated = await _get_doc(finance_id)
        return {"status": "updated", **_normalize_doc(finance_id, updated)}
    except Exception as error:
        fallback = _FALLBACK_STORE.get(finance_id, {"profile": deepcopy(_DEFAULT_PROFILE), "toggles": deepcopy(_DEFAULT_TOGGLES)})
        fallback.update(body or {})
        _FALLBACK_STORE[finance_id] = fallback
        return {"status": "updated", "error": str(error), **_normalize_doc(finance_id, fallback)}


@router.put("/profile/{finance_id}")
async def update_finance_profile(finance_id: str, body: dict[str, Any] = Body(default_factory=dict)):
    try:
        db = get_db()
        current = await _get_doc(finance_id)
        profile = deepcopy(_DEFAULT_PROFILE)
        profile.update(current.get("profile") or {})
        profile.update(body or {})
        await db["finance_settings"].update_one({"user_id": finance_id}, {"$set": {"profile": profile}}, upsert=True)
        return {"message": "Finance profile updated successfully.", **profile, "user_id": finance_id, "data": profile}
    except Exception as error:
        fallback = _FALLBACK_STORE.get(finance_id, {"profile": deepcopy(_DEFAULT_PROFILE), "toggles": deepcopy(_DEFAULT_TOGGLES)})
        profile = fallback.get("profile") or {}
        profile.update(body or {})
        fallback["profile"] = profile
        _FALLBACK_STORE[finance_id] = fallback
        return {"message": "Finance profile updated successfully.", "error": str(error), **profile, "user_id": finance_id, "data": profile}


@router.put("/toggles/{finance_id}")
async def update_finance_toggles(finance_id: str, body: dict[str, Any] = Body(default_factory=dict)):
    try:
        db = get_db()
        current = await _get_doc(finance_id)
        toggles = deepcopy(_DEFAULT_TOGGLES)
        toggles.update(current.get("toggles") or {})
        toggles.update(body or {})
        await db["finance_settings"].update_one({"user_id": finance_id}, {"$set": {"toggles": toggles}}, upsert=True)
        return {"message": "Finance notification preferences saved.", "user_id": finance_id, "data": {"toggles": toggles}, "toggles": toggles}
    except Exception as error:
        fallback = _FALLBACK_STORE.get(finance_id, {"profile": deepcopy(_DEFAULT_PROFILE), "toggles": deepcopy(_DEFAULT_TOGGLES)})
        toggles = fallback.get("toggles") or {}
        toggles.update(body or {})
        fallback["toggles"] = toggles
        _FALLBACK_STORE[finance_id] = fallback
        return {"message": "Finance notification preferences saved.", "error": str(error), "user_id": finance_id, "data": {"toggles": toggles}, "toggles": toggles}
