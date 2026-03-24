from copy import deepcopy
from typing import Any

from fastapi import APIRouter, Body

from backend.db import get_db

router = APIRouter()

_DEFAULT_STUDENT = {
    "fullName": "",
    "email": "",
    "phone": "",
    "department": "",
    "address": "",
    "photo": None,
    "photoName": "",
    "role": "Student",
}

_FALLBACK_STORE: dict[str, dict[str, Any]] = {}


def _merge_student_payload(student_id: str, payload: dict[str, Any] | None) -> dict[str, Any]:
    data = deepcopy(_DEFAULT_STUDENT)
    if payload:
        data.update(payload)
    # Keep legacy alias for consumers that still read `name`.
    data["name"] = data.get("fullName") or payload.get("name", "") if payload else data.get("fullName")
    return {
        "user_id": student_id,
        "data": data,
        **data,
    }


@router.get("/{student_id}")
async def get_student_settings(student_id: str):
    try:
        db = get_db()
        doc = await db["student_settings"].find_one({"user_id": student_id})

        if not doc:
            seed = await db["students"].find_one({"$or": [{"id": student_id}, {"rollNumber": student_id}]})
            payload = {
                "fullName": (seed or {}).get("name", ""),
                "email": (seed or {}).get("email", ""),
                "phone": (seed or {}).get("phone", ""),
                "department": (seed or {}).get("department", ""),
                "address": (seed or {}).get("address", ""),
                "photo": None,
                "photoName": "",
                "role": "Student",
            }
            await db["student_settings"].update_one({"user_id": student_id}, {"$set": payload}, upsert=True)
            return _merge_student_payload(student_id, payload)

        payload = {k: v for k, v in doc.items() if k not in {"_id", "user_id"}}
        return _merge_student_payload(student_id, payload)
    except Exception as error:
        payload = _FALLBACK_STORE.get(student_id, deepcopy(_DEFAULT_STUDENT))
        response = _merge_student_payload(student_id, payload)
        response["error"] = str(error)
        return response


@router.put("/{student_id}")
async def update_student_settings(student_id: str, body: dict[str, Any] = Body(default_factory=dict)):
    try:
        payload = {k: v for k, v in (body or {}).items() if k not in {"user_id", "data"}}
        db = get_db()
        await db["student_settings"].update_one({"user_id": student_id}, {"$set": payload}, upsert=True)
        updated = await db["student_settings"].find_one({"user_id": student_id})
        merged = _merge_student_payload(student_id, {k: v for k, v in updated.items() if k not in {"_id", "user_id"}})
        return {"message": "Student settings updated successfully.", **merged}
    except Exception as error:
        existing = _FALLBACK_STORE.get(student_id, deepcopy(_DEFAULT_STUDENT))
        existing.update(body or {})
        _FALLBACK_STORE[student_id] = existing
        merged = _merge_student_payload(student_id, existing)
        return {"message": "Student settings updated successfully.", "error": str(error), **merged}
