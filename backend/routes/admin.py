from copy import deepcopy
from typing import Any

from fastapi import APIRouter

from backend.db import get_db
from backend.schemas.settings import ChangePasswordPayload, PartialSettingsPayload

router = APIRouter(prefix="/api/admin", tags=["admin"])

_DEFAULT_PROFILE = {
    "adminId": "",
    "fullName": "Admin User",
    "email": "admin@mit.edu",
    "phone": "9999999999",
    "photo": None,
    "photoName": "",
}

_DEFAULT_SYSTEM = {
    "collegeName": "MIT Connect",
    "collegeLogo": None,
    "collegeLogoName": "",
    "address": "Coimbatore",
    "contactEmail": "admin@mit.edu",
    "phoneNumber": "9999999999",
}

_DEFAULT_ACADEMIC = {
    "departments": "CSE, ECE, EEE, MECH, CIVIL",
    "courses": "B.E, B.Tech, M.E, MBA",
    "semesters": "8",
}

_DEFAULT_PASSWORD = "admin123"

_FALLBACK_STORE: dict[str, dict[str, Any]] = {}


async def _apply_admin_password_change(user_id: str, old_password: str, new_password: str) -> dict[str, Any]:
    try:
        db = get_db()
        current = await _get_or_seed_admin(user_id)
        existing_password = current.get("password", _DEFAULT_PASSWORD)
        if old_password != existing_password:
            return {
                "user_id": user_id,
                "data": {},
                "error": "Current password is incorrect.",
            }

        await db["admin_settings"].update_one(
            {"user_id": user_id},
            {"$set": {"password": new_password}},
            upsert=True,
        )
        return {
            "message": "Password changed successfully.",
            "user_id": user_id,
            "data": {"status": "updated"},
        }
    except Exception as error:
        fallback = _FALLBACK_STORE.get(user_id, {
            "profile": {**_DEFAULT_PROFILE, "adminId": user_id},
            "system": deepcopy(_DEFAULT_SYSTEM),
            "academic": deepcopy(_DEFAULT_ACADEMIC),
            "password": _DEFAULT_PASSWORD,
        })
        fallback["password"] = new_password
        _FALLBACK_STORE[user_id] = fallback
        return {
            "message": "Password changed successfully.",
            "user_id": user_id,
            "data": {"status": "updated"},
            "error": str(error),
        }


def _normalize_admin_doc(user_id: str, doc: dict[str, Any] | None) -> dict[str, Any]:
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
    }


async def _get_or_seed_admin(user_id: str) -> dict[str, Any]:
    db = get_db()
    doc = await db["admin_settings"].find_one({"user_id": user_id})
    if doc:
        return {k: v for k, v in doc.items() if k not in {"_id", "user_id"}}

    seed = {
        "profile": {**_DEFAULT_PROFILE, "adminId": user_id},
        "system": deepcopy(_DEFAULT_SYSTEM),
        "academic": deepcopy(_DEFAULT_ACADEMIC),
        "password": _DEFAULT_PASSWORD,
    }
    await db["admin_settings"].update_one({"user_id": user_id}, {"$set": seed}, upsert=True)
    return seed


@router.get("/profile/{admin_id}")
async def get_admin_profile(admin_id: str):
    try:
        doc = await _get_or_seed_admin(admin_id)
        normalized = _normalize_admin_doc(admin_id, doc)
        return {
            **normalized["profile"],
            "user_id": normalized["user_id"],
            "data": normalized["profile"],
        }
    except Exception as error:
        fallback = _FALLBACK_STORE.get(admin_id, {
            "profile": {**_DEFAULT_PROFILE, "adminId": admin_id},
            "system": deepcopy(_DEFAULT_SYSTEM),
            "academic": deepcopy(_DEFAULT_ACADEMIC),
            "password": _DEFAULT_PASSWORD,
        })
        normalized = _normalize_admin_doc(admin_id, fallback)
        return {
            **normalized["profile"],
            "user_id": normalized["user_id"],
            "data": normalized["profile"],
            "error": str(error),
        }


@router.put("/profile/{admin_id}")
async def update_admin_profile(admin_id: str, payload: PartialSettingsPayload):
    try:
        db = get_db()
        current = await _get_or_seed_admin(admin_id)
        profile = deepcopy(_DEFAULT_PROFILE)
        profile.update(current.get("profile") or {})
        profile.update(payload.as_dict())
        profile["adminId"] = profile.get("adminId") or admin_id

        await db["admin_settings"].update_one(
            {"user_id": admin_id},
            {"$set": {"profile": profile}},
            upsert=True,
        )

        return {
            "message": "Admin profile updated successfully.",
            **profile,
            "user_id": admin_id,
            "data": profile,
        }
    except Exception as error:
        fallback = _FALLBACK_STORE.get(admin_id, {
            "profile": {**_DEFAULT_PROFILE, "adminId": admin_id},
            "system": deepcopy(_DEFAULT_SYSTEM),
            "academic": deepcopy(_DEFAULT_ACADEMIC),
            "password": _DEFAULT_PASSWORD,
        })
        profile = fallback.get("profile") or {}
        profile.update(payload.as_dict())
        profile["adminId"] = profile.get("adminId") or admin_id
        fallback["profile"] = profile
        _FALLBACK_STORE[admin_id] = fallback
        return {
            "message": "Admin profile updated successfully.",
            **profile,
            "user_id": admin_id,
            "data": profile,
            "error": str(error),
        }


@router.put("/change-password")
@router.post("/change-password")
async def change_admin_password(payload: ChangePasswordPayload):
    return await _apply_admin_password_change(payload.userId, payload.oldPassword, payload.newPassword)


@router.put("/change-password/{admin_id}")
@router.post("/change-password/{admin_id}")
async def change_admin_password_by_id(admin_id: str, payload: PartialSettingsPayload):
    body = payload.as_dict()
    old_password = body.get("oldPassword") or body.get("currentPassword") or ""
    new_password = body.get("newPassword") or ""

    if not old_password or not new_password:
        return {
            "user_id": admin_id,
            "data": {},
            "error": "Both oldPassword/currentPassword and newPassword are required.",
        }

    return await _apply_admin_password_change(admin_id, old_password, new_password)


@router.get("/system")
async def get_admin_system(admin_id: str = "ADM-0001"):
    try:
        doc = await _get_or_seed_admin(admin_id)
        normalized = _normalize_admin_doc(admin_id, doc)
        return {
            **normalized["system"],
            "user_id": normalized["user_id"],
            "data": normalized["system"],
        }
    except Exception as error:
        fallback = _FALLBACK_STORE.get(admin_id, {
            "profile": {**_DEFAULT_PROFILE, "adminId": admin_id},
            "system": deepcopy(_DEFAULT_SYSTEM),
            "academic": deepcopy(_DEFAULT_ACADEMIC),
            "password": _DEFAULT_PASSWORD,
        })
        normalized = _normalize_admin_doc(admin_id, fallback)
        return {
            **normalized["system"],
            "user_id": normalized["user_id"],
            "data": normalized["system"],
            "error": str(error),
        }


@router.put("/system")
async def update_admin_system(payload: PartialSettingsPayload, admin_id: str = "ADM-0001"):
    try:
        db = get_db()
        current = await _get_or_seed_admin(admin_id)
        system = deepcopy(_DEFAULT_SYSTEM)
        system.update(current.get("system") or {})
        system.update(payload.as_dict())

        await db["admin_settings"].update_one(
            {"user_id": admin_id},
            {"$set": {"system": system}},
            upsert=True,
        )

        return {
            "message": "System settings updated successfully.",
            **system,
            "user_id": admin_id,
            "data": system,
        }
    except Exception as error:
        fallback = _FALLBACK_STORE.get(admin_id, {
            "profile": {**_DEFAULT_PROFILE, "adminId": admin_id},
            "system": deepcopy(_DEFAULT_SYSTEM),
            "academic": deepcopy(_DEFAULT_ACADEMIC),
            "password": _DEFAULT_PASSWORD,
        })
        system = fallback.get("system") or {}
        system.update(payload.as_dict())
        fallback["system"] = system
        _FALLBACK_STORE[admin_id] = fallback
        return {
            "message": "System settings updated successfully.",
            **system,
            "user_id": admin_id,
            "data": system,
            "error": str(error),
        }


@router.get("/academic")
async def get_admin_academic(admin_id: str = "ADM-0001"):
    try:
        doc = await _get_or_seed_admin(admin_id)
        normalized = _normalize_admin_doc(admin_id, doc)
        return {
            **normalized["academic"],
            "user_id": normalized["user_id"],
            "data": normalized["academic"],
        }
    except Exception as error:
        fallback = _FALLBACK_STORE.get(admin_id, {
            "profile": {**_DEFAULT_PROFILE, "adminId": admin_id},
            "system": deepcopy(_DEFAULT_SYSTEM),
            "academic": deepcopy(_DEFAULT_ACADEMIC),
            "password": _DEFAULT_PASSWORD,
        })
        normalized = _normalize_admin_doc(admin_id, fallback)
        return {
            **normalized["academic"],
            "user_id": normalized["user_id"],
            "data": normalized["academic"],
            "error": str(error),
        }


@router.put("/academic")
async def update_admin_academic(payload: PartialSettingsPayload, admin_id: str = "ADM-0001"):
    try:
        db = get_db()
        current = await _get_or_seed_admin(admin_id)
        academic = deepcopy(_DEFAULT_ACADEMIC)
        academic.update(current.get("academic") or {})
        academic.update(payload.as_dict())

        await db["admin_settings"].update_one(
            {"user_id": admin_id},
            {"$set": {"academic": academic}},
            upsert=True,
        )

        return {
            "message": "Academic settings updated successfully.",
            **academic,
            "user_id": admin_id,
            "data": academic,
        }
    except Exception as error:
        fallback = _FALLBACK_STORE.get(admin_id, {
            "profile": {**_DEFAULT_PROFILE, "adminId": admin_id},
            "system": deepcopy(_DEFAULT_SYSTEM),
            "academic": deepcopy(_DEFAULT_ACADEMIC),
            "password": _DEFAULT_PASSWORD,
        })
        academic = fallback.get("academic") or {}
        academic.update(payload.as_dict())
        fallback["academic"] = academic
        _FALLBACK_STORE[admin_id] = fallback
        return {
            "message": "Academic settings updated successfully.",
            **academic,
            "user_id": admin_id,
            "data": academic,
            "error": str(error),
        }
