from datetime import datetime
from typing import Optional

from bson import ObjectId
from fastapi import HTTPException

from backend.db import get_db
from backend.dev_store import DEV_STORE
from backend.stores.settings_store import get_credential, update_credential

DEFAULT_STUDENT_PASSWORD = "student123"
LEGACY_DEFAULT_STUDENT_PASSWORDS = ("student 123", "student@123")


def is_default_student_password(password: Optional[str]) -> bool:
    if password is None:
        return False
    return str(password) in {DEFAULT_STUDENT_PASSWORD, *LEGACY_DEFAULT_STUDENT_PASSWORDS}


async def migrate_legacy_default_student_password(student_id: str) -> None:
    if not student_id:
        return

    try:
        db = get_db()
        await db["auth_credentials"].update_one(
            {
                "userId": student_id,
                "role": "student",
                "isDefaultPassword": True,
                "password": {"$in": list(LEGACY_DEFAULT_STUDENT_PASSWORDS)},
            },
            {
                "$set": {
                    "password": DEFAULT_STUDENT_PASSWORD,
                    "updatedAt": datetime.utcnow(),
                }
            },
        )
    except HTTPException as error:
        if error.status_code != 503:
            raise

    stored = get_credential(student_id)
    if stored in LEGACY_DEFAULT_STUDENT_PASSWORDS:
        update_credential(student_id, DEFAULT_STUDENT_PASSWORD)


def _student_lookup_conditions(student_id: str) -> list[dict]:
    conditions = [
        {"id": student_id},
        {"admission_id": student_id},
        {"rollNumber": student_id},
    ]
    if ObjectId.is_valid(student_id):
        conditions.append({"_id": ObjectId(student_id)})
    return conditions


async def ensure_student_login_credential(student_id: str) -> bool:
    """Create default student credential only if it does not already exist."""
    if not student_id:
        return False

    created = False
    try:
        db = get_db()
        result = await db["auth_credentials"].update_one(
            {"userId": student_id},
            {
                "$setOnInsert": {
                    "userId": student_id,
                    "role": "student",
                    "password": DEFAULT_STUDENT_PASSWORD,
                    "isDefaultPassword": True,
                    "createdAt": datetime.utcnow(),
                },
                "$set": {"updatedAt": datetime.utcnow()},
            },
            upsert=True,
        )
        created = result.upserted_id is not None
    except HTTPException as error:
        if error.status_code != 503:
            raise

    if get_credential(student_id) is None:
        update_credential(student_id, DEFAULT_STUDENT_PASSWORD)
        created = True

    return created


async def get_student_password(student_id: str) -> Optional[str]:
    try:
        db = get_db()
        record = await db["auth_credentials"].find_one({"userId": student_id})
        if record and record.get("password"):
            return str(record.get("password"))
    except HTTPException as error:
        if error.status_code != 503:
            raise

    return get_credential(student_id)


async def student_exists(student_id: str) -> bool:
    if not student_id:
        return False

    try:
        db = get_db()
        conditions = _student_lookup_conditions(student_id)
        student = await db["students"].find_one({"$or": conditions})
        if student:
            return True

        admission = await db["admissions"].find_one({"$or": conditions})
        return admission is not None
    except HTTPException as error:
        if error.status_code != 503:
            raise

    for item in DEV_STORE.get("students", []):
        if str(item.get("id")) == str(student_id) or str(item.get("rollNumber")) == str(student_id):
            return True

    for item in DEV_STORE.get("admissions", []):
        if (
            str(item.get("id")) == str(student_id)
            or str(item.get("admission_id")) == str(student_id)
            or str(item.get("rollNumber")) == str(student_id)
        ):
            return True

    return False
