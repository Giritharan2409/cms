from datetime import datetime

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.stores.settings_store import get_credential
from backend.utils.auth_credentials import (
    DEFAULT_STUDENT_PASSWORD,
    ensure_student_login_credential,
    get_student_password,
    is_default_student_password,
    migrate_legacy_default_student_password,
    student_exists,
)

router = APIRouter(prefix="/auth", tags=["Auth"])

DEMO_ROLE_CREDENTIALS = {
    "admin": {"identifier": "ADM-0001", "password": "admin123"},
    "faculty": {"identifier": "FAC-204", "password": "faculty123"},
    "finance": {"identifier": "FIN-880", "password": "finance123"},
}


class LoginRequest(BaseModel):
    role: str
    identifier: str
    password: str


@router.post("/login")
async def login(payload: LoginRequest):
    role = (payload.role or "").strip().lower()
    identifier = (payload.identifier or "").strip()
    password = payload.password or ""

    if role not in {"student", "admin", "faculty", "finance"}:
        raise HTTPException(status_code=400, detail="Invalid role")
    if not identifier or not password:
        raise HTTPException(status_code=400, detail="Identifier and password are required")

    if role == "student":
        exists = await student_exists(identifier)
        if not exists:
            raise HTTPException(status_code=401, detail="Invalid credentials")

        stored_password = await get_student_password(identifier)

        # Backward-compatible migration path: if this is a legacy student without
        # credential row, allow default password and provision once.
        if not stored_password:
            if not is_default_student_password(password):
                raise HTTPException(status_code=401, detail="Invalid credentials")
            await ensure_student_login_credential(identifier)
            if password != DEFAULT_STUDENT_PASSWORD:
                await migrate_legacy_default_student_password(identifier)
            stored_password = await get_student_password(identifier)

        # If a legacy default password is stored, allow login with new default and migrate.
        if password == DEFAULT_STUDENT_PASSWORD and stored_password != password:
            await migrate_legacy_default_student_password(identifier)
            stored_password = await get_student_password(identifier)

        if not stored_password or stored_password != password:
            raise HTTPException(status_code=401, detail="Invalid credentials")

        return {
            "message": "Login successful",
            "role": "student",
            "userId": identifier,
            "authenticatedAt": datetime.utcnow().isoformat(),
        }

    expected = DEMO_ROLE_CREDENTIALS.get(role)
    if expected and expected["identifier"] == identifier and expected["password"] == password:
        return {
            "message": "Login successful",
            "role": role,
            "userId": identifier,
            "authenticatedAt": datetime.utcnow().isoformat(),
        }

    # Keep backward compatibility where non-student credentials might be in settings store.
    stored_password = get_credential(identifier)
    if stored_password and stored_password == password:
        return {
            "message": "Login successful",
            "role": role,
            "userId": identifier,
            "authenticatedAt": datetime.utcnow().isoformat(),
        }

    raise HTTPException(status_code=401, detail="Invalid credentials")
