from copy import deepcopy
from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Body, Header, HTTPException, Query
from passlib.context import CryptContext

from backend.db import get_db
from backend.dev_store import create_notification as create_dev_notification

router = APIRouter(tags=["settings"])

_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain: str) -> str:
    return _pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    return _pwd_context.verify(plain, hashed)

SETTINGS_COLLECTION = "role_settings"
ADMIN_COLLECTION = "admin_settings"
PASSWORD_COLLECTION = "role_passwords"
NOTIFICATIONS_COLLECTION = "notifications"
CREDENTIAL_REQUEST_COLLECTION = "credential_change_requests"
CREDENTIAL_AUDIT_COLLECTION = "credential_change_audit"

ROLE_STUDENT = "student"
ROLE_FACULTY = "faculty"
ROLE_FINANCE = "finance"
ROLE_ADMIN = "admin"

REQUEST_TYPE_PROFILE = "profile"
REQUEST_TYPE_PASSWORD = "password"

STATUS_PENDING_FACULTY = "pending_faculty_approval"
STATUS_PENDING_ADMIN = "pending_admin_approval"
STATUS_APPROVED = "approved"
STATUS_REJECTED = "rejected"

DEFAULT_ADMIN_USER_ID = "ADM-0001"
DEFAULT_FACULTY_USER_ID = "FAC-204"

DEFAULT_PASSWORD_BY_USER_ID = {
    "STU-2024-1547": "student123",
    "ADM-0001": "admin123",
    "FAC-204": "faculty123",
    "FIN-880": "finance123",
}

_DEFAULT_HASHED_PASSWORDS = {
    user_id: hash_password(plain)
    for user_id, plain in DEFAULT_PASSWORD_BY_USER_ID.items()
}

STUDENT_FACULTY_MAP = {
    "STU-2024-1547": "FAC-204",
}

DEFAULT_STUDENT_SETTINGS = {
    "fullName": "John Anderson",
    "email": "john.anderson@mitconnect.edu",
    "phone": "",
    "department": "Computer Science",
    "address": "",
    "role": "Student",
    "photo": None,
}

DEFAULT_ADMIN_PROFILE = {
    "fullName": "Admin User",
    "adminId": "ADM-0001",
    "email": "admin@mitconnect.edu",
    "phone": "",
    "photo": None,
}

DEFAULT_ADMIN_SYSTEM = {
    "collegeName": "MIT Connect",
    "collegeLogo": "mit-logo.png",
    "address": "Main Administrative Block, Coimbatore",
    "contactEmail": "info@mitconnect.edu",
    "phoneNumber": "9876543210",
}

DEFAULT_ADMIN_ACADEMIC = {
    "departments": "Computer Science, Mechanical, Civil, ECE",
    "courses": "B.Tech CSE, B.Tech ECE, MBA",
    "semesters": "2",
}

DEFAULT_FACULTY_SETTINGS = {
    "profile": {
        "fullName": "Dr. Rajesh Iyer",
        "email": "rajesh.iyer@mitconnect.edu",
        "phone": "",
        "department": "School of Engineering",
        "address": "",
        "role": "Faculty",
        "photo": None,
    },
    "toggles": {
        "courseNotifications": True,
        "assignmentReminder": True,
    },
}

DEFAULT_FINANCE_SETTINGS = {
    "profile": {
        "fullName": "Arun Kumar",
        "email": "arun.kumar@mitconnect.edu",
        "phone": "",
        "department": "Finance",
        "address": "",
        "role": "Finance",
        "photo": None,
    },
    "toggles": {
        "paymentNotifications": True,
        "refundAlerts": True,
    },
}

PROFILE_ALLOWED_FIELDS = {
    ROLE_STUDENT: {"fullName", "email", "phone", "department", "address", "photo", "photoName"},
    ROLE_FACULTY: {"fullName", "email", "phone", "department", "address", "photo", "photoName"},
    ROLE_FINANCE: {"fullName", "email", "phone", "department", "address", "photo", "photoName"},
    ROLE_ADMIN: {"fullName", "adminId", "email", "phone", "photo", "photoName"},
}

VALID_ROLES = {ROLE_STUDENT, ROLE_FACULTY, ROLE_FINANCE, ROLE_ADMIN}

DEV_SETTINGS = {
    "student": {
        "STU-2024-1547": deepcopy(DEFAULT_STUDENT_SETTINGS),
    },
    "admin": {
        "ADM-0001": deepcopy(DEFAULT_ADMIN_PROFILE),
    },
    "admin_global": {
        "system": deepcopy(DEFAULT_ADMIN_SYSTEM),
        "academic": deepcopy(DEFAULT_ADMIN_ACADEMIC),
    },
    "faculty": {
        "FAC-204": deepcopy(DEFAULT_FACULTY_SETTINGS),
    },
    "finance": {
        "FIN-880": deepcopy(DEFAULT_FINANCE_SETTINGS),
    },
    "passwords": dict(_DEFAULT_HASHED_PASSWORDS),
    "credential_requests": [],
    "credential_audit": [],
}


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def normalize_role(role: str | None) -> str:
    return str(role or "").strip().lower()


def status_label(status: str | None) -> str:
    mapping = {
        STATUS_PENDING_FACULTY: "Pending Faculty Approval",
        STATUS_PENDING_ADMIN: "Pending Admin Approval",
        STATUS_APPROVED: "Approved",
        STATUS_REJECTED: "Rejected",
    }
    return mapping.get(str(status or ""), "Pending")


def deep_merge(base: dict, patch: dict) -> dict:
    merged = deepcopy(base)
    for key, value in (patch or {}).items():
        if isinstance(value, dict) and isinstance(merged.get(key), dict):
            merged[key] = deep_merge(merged[key], value)
        else:
            merged[key] = value
    return merged


def get_db_or_none():
    try:
        return get_db()
    except HTTPException as error:
        if error.status_code == 503:
            return None
        raise


def require_actor(x_actor_user_id: str | None, x_actor_role: str | None) -> dict:
    role = normalize_role(x_actor_role)
    user_id = str(x_actor_user_id or "").strip()

    if not user_id or role not in VALID_ROLES:
        raise HTTPException(
            status_code=401,
            detail="Authenticated actor context is required through X-Actor-UserId and X-Actor-Role headers",
        )

    return {
        "user_id": user_id,
        "role": role,
    }


def ensure_self(actor: dict, expected_role: str, target_user_id: str) -> None:
    if actor["role"] != expected_role or actor["user_id"] != target_user_id:
        raise HTTPException(status_code=403, detail="You can only submit credential requests for your own account")


def ensure_admin(actor: dict) -> None:
    if actor["role"] != ROLE_ADMIN:
        raise HTTPException(status_code=403, detail="Admin role required")


def mask_value(key: str, value):
    lowered = key.lower()

    if value is None:
        return None

    if "password" in lowered:
        return "***"

    if "email" in lowered:
        text = str(value)
        if "@" not in text:
            return "***"
        username, domain = text.split("@", 1)
        prefix = username[:1] if username else "*"
        return f"{prefix}***@{domain}"

    if "phone" in lowered:
        digits = "".join(ch for ch in str(value) if ch.isdigit())
        if not digits:
            return "***"
        if len(digits) <= 4:
            return "***"
        return f"***{digits[-4:]}"

    if "photo" in lowered or "address" in lowered:
        return "<updated>"

    text = str(value)
    if len(text) <= 1:
        return "*"
    return f"{text[:1]}***"


def mask_map(values: dict) -> dict:
    return {key: mask_value(key, value) for key, value in (values or {}).items()}


def select_changed_fields(current: dict, incoming: dict, allowed_fields: set[str]) -> dict:
    changed = {}

    for key in allowed_fields:
        if key not in incoming:
            continue

        if current.get(key) != incoming.get(key):
            changed[key] = incoming.get(key)

    return changed


def resolve_student_faculty(student_user_id: str) -> str:
    return STUDENT_FACULTY_MAP.get(student_user_id, DEFAULT_FACULTY_USER_ID)


def build_initial_approval(requester_role: str, requester_user_id: str) -> tuple[str, str, str | None, str]:
    if requester_role == ROLE_STUDENT:
        return (
            STATUS_PENDING_FACULTY,
            "faculty",
            resolve_student_faculty(requester_user_id),
            DEFAULT_ADMIN_USER_ID,
        )

    return (
        STATUS_PENDING_ADMIN,
        "admin",
        None,
        DEFAULT_ADMIN_USER_ID,
    )


def to_public_request(document: dict) -> dict:
    data = deepcopy(document)
    data.pop("_id", None)
    data.pop("requestedChanges", None)
    data["id"] = data.get("requestId")
    data["statusLabel"] = status_label(data.get("status"))
    return data


async def load_user_settings(role: str, user_id: str, defaults: dict) -> dict:
    db = get_db_or_none()
    if db is None:
        role_store = DEV_SETTINGS.setdefault(role, {})
        current = role_store.get(user_id, deepcopy(defaults))
        role_store[user_id] = deep_merge(defaults, current)
        return deepcopy(role_store[user_id])

    doc = await db[SETTINGS_COLLECTION].find_one({"role": role, "user_id": user_id})
    if not doc:
        return deepcopy(defaults)

    stored = {key: value for key, value in doc.items() if key not in {"_id", "role", "user_id"}}
    return deep_merge(defaults, stored)


async def upsert_user_settings(role: str, user_id: str, defaults: dict, patch: dict) -> dict:
    current = await load_user_settings(role, user_id, defaults)
    merged = deep_merge(current, patch)

    db = get_db_or_none()
    if db is None:
        DEV_SETTINGS.setdefault(role, {})[user_id] = deepcopy(merged)
        return merged

    await db[SETTINGS_COLLECTION].update_one(
        {"role": role, "user_id": user_id},
        {"$set": {"role": role, "user_id": user_id, **merged}},
        upsert=True,
    )
    return merged


async def load_admin_section(section: str, defaults: dict) -> dict:
    db = get_db_or_none()
    if db is None:
        value = DEV_SETTINGS["admin_global"].get(section, deepcopy(defaults))
        DEV_SETTINGS["admin_global"][section] = deep_merge(defaults, value)
        return deepcopy(DEV_SETTINGS["admin_global"][section])

    doc = await db[ADMIN_COLLECTION].find_one({"section": section})
    if not doc:
        return deepcopy(defaults)

    stored = {key: value for key, value in doc.items() if key not in {"_id", "section"}}
    return deep_merge(defaults, stored)


async def upsert_admin_section(section: str, defaults: dict, patch: dict) -> dict:
    current = await load_admin_section(section, defaults)
    merged = deep_merge(current, patch)

    db = get_db_or_none()
    if db is None:
        DEV_SETTINGS["admin_global"][section] = deepcopy(merged)
        return merged

    await db[ADMIN_COLLECTION].update_one(
        {"section": section},
        {"$set": {"section": section, **merged}},
        upsert=True,
    )
    return merged


async def load_password(user_id: str, fallback: str) -> str:
    db = get_db_or_none()
    if db is None:
        if user_id in DEV_SETTINGS["passwords"]:
            return DEV_SETTINGS["passwords"][user_id]
        return _DEFAULT_HASHED_PASSWORDS.get(user_id) or hash_password(fallback)

    doc = await db[PASSWORD_COLLECTION].find_one({"user_id": user_id})
    if doc:
        return str(doc.get("password", ""))
    return _DEFAULT_HASHED_PASSWORDS.get(user_id) or hash_password(fallback)


async def upsert_password(user_id: str, password: str) -> None:
    hashed = hash_password(password)
    db = get_db_or_none()
    if db is None:
        DEV_SETTINGS["passwords"][user_id] = hashed
        return

    await db[PASSWORD_COLLECTION].update_one(
        {"user_id": user_id},
        {"$set": {"user_id": user_id, "password": hashed}},
        upsert=True,
    )


async def create_system_notification(
    receiver_role: str,
    title: str,
    message: str,
    priority: str = "medium",
    sender_role: str = "system",
    action_id: str | None = None,
    related_data: dict | None = None,
) -> None:
    notification_doc = {
        "title": title,
        "message": message,
        "senderRole": sender_role,
        "receiverRole": receiver_role,
        "module": "settings",
        "priority": priority,
        "actionId": action_id,
        "relatedData": related_data or {},
        "status": "unread",
        "createdAt": now_iso(),
    }

    db = get_db_or_none()
    if db is None:
        create_dev_notification(notification_doc)
        return

    await db[NOTIFICATIONS_COLLECTION].insert_one(notification_doc)


async def append_audit_log(entry: dict) -> None:
    db = get_db_or_none()
    if db is None:
        DEV_SETTINGS["credential_audit"].append(deepcopy(entry))
        return

    await db[CREDENTIAL_AUDIT_COLLECTION].insert_one(entry)


async def record_request_event(request_doc: dict, event: str, actor: dict, note: str | None = None) -> None:
    await append_audit_log(
        {
            "auditId": f"AUD-{uuid4().hex[:10].upper()}",
            "requestId": request_doc.get("requestId"),
            "event": event,
            "status": request_doc.get("status"),
            "actorRole": actor.get("role"),
            "actorUserId": actor.get("user_id"),
            "requesterRole": request_doc.get("requesterRole"),
            "requesterUserId": request_doc.get("requesterUserId"),
            "targetRole": request_doc.get("targetRole"),
            "targetUserId": request_doc.get("targetUserId"),
            "maskedCurrentValues": deepcopy(request_doc.get("maskedCurrentValues") or {}),
            "maskedRequestedChanges": deepcopy(request_doc.get("maskedRequestedChanges") or {}),
            "note": note,
            "createdAt": now_iso(),
        }
    )


async def save_credential_request(document: dict) -> dict:
    db = get_db_or_none()

    if db is None:
        requests = DEV_SETTINGS["credential_requests"]
        for index, existing in enumerate(requests):
            if existing.get("requestId") == document.get("requestId"):
                requests[index] = deepcopy(document)
                return deepcopy(requests[index])
        requests.append(deepcopy(document))
        return deepcopy(document)

    if document.get("_id"):
        payload = {key: value for key, value in document.items() if key != "_id"}
        await db[CREDENTIAL_REQUEST_COLLECTION].update_one(
            {"requestId": document["requestId"]},
            {"$set": payload},
            upsert=True,
        )
    else:
        await db[CREDENTIAL_REQUEST_COLLECTION].update_one(
            {"requestId": document["requestId"]},
            {"$set": document},
            upsert=True,
        )

    stored = await db[CREDENTIAL_REQUEST_COLLECTION].find_one({"requestId": document["requestId"]})
    if not stored:
        raise HTTPException(status_code=500, detail="Failed to persist credential request")
    return stored


async def find_credential_request(request_id: str) -> dict | None:
    db = get_db_or_none()
    if db is None:
        for document in DEV_SETTINGS["credential_requests"]:
            if document.get("requestId") == request_id:
                return deepcopy(document)
        return None

    return await db[CREDENTIAL_REQUEST_COLLECTION].find_one({"requestId": request_id})


async def query_credential_requests(actor: dict, scope: str, status_filter: str | None) -> list[dict]:
    scope = str(scope or "my").strip().lower()
    status_filter = str(status_filter or "").strip().lower() or None

    if scope == "my":
        query = {"requesterUserId": actor["user_id"]}
    elif scope == "faculty_queue":
        if actor["role"] != ROLE_FACULTY:
            raise HTTPException(status_code=403, detail="Faculty role required for faculty queue")
        query = {
            "status": STATUS_PENDING_FACULTY,
            "facultyApproverUserId": actor["user_id"],
        }
    elif scope == "admin_queue":
        if actor["role"] != ROLE_ADMIN:
            raise HTTPException(status_code=403, detail="Admin role required for admin queue")
        query = {
            "status": STATUS_PENDING_ADMIN,
        }
    elif scope == "all":
        if actor["role"] != ROLE_ADMIN:
            raise HTTPException(status_code=403, detail="Admin role required for all request history")
        query = {}
    else:
        raise HTTPException(status_code=400, detail="Unsupported scope. Use my, faculty_queue, admin_queue, or all")

    if status_filter:
        query["status"] = status_filter

    db = get_db_or_none()
    if db is None:
        rows = []
        for item in DEV_SETTINGS["credential_requests"]:
            matches = True
            for key, value in query.items():
                if item.get(key) != value:
                    matches = False
                    break
            if matches:
                rows.append(deepcopy(item))
        rows.sort(key=lambda value: value.get("createdAt", ""), reverse=True)
        return rows

    cursor = db[CREDENTIAL_REQUEST_COLLECTION].find(query).sort("createdAt", -1)
    rows = []
    async for row in cursor:
        rows.append(row)
    return rows


def extract_profile_from_settings(role: str, settings_payload: dict) -> dict:
    if role in {ROLE_FACULTY, ROLE_FINANCE}:
        return deepcopy(settings_payload.get("profile") or {})
    return deepcopy(settings_payload)


async def submit_credential_request(
    requester_role: str,
    requester_user_id: str,
    request_type: str,
    requested_changes: dict,
    current_values: dict,
) -> dict:
    if not requested_changes:
        raise HTTPException(status_code=400, detail="No credential changes detected")

    initial_status, approval_stage, faculty_approver, admin_approver = build_initial_approval(
        requester_role,
        requester_user_id,
    )
    request_id = f"CR-{uuid4().hex[:10].upper()}"
    timestamp = now_iso()

    request_doc = {
        "requestId": request_id,
        "requestType": request_type,
        "status": initial_status,
        "approvalStage": approval_stage,
        "requesterRole": requester_role,
        "requesterUserId": requester_user_id,
        "targetRole": requester_role,
        "targetUserId": requester_user_id,
        "changedFields": sorted(list(requested_changes.keys())),
        "requestedChanges": deepcopy(requested_changes),
        "maskedRequestedChanges": mask_map(requested_changes),
        "maskedCurrentValues": mask_map(current_values),
        "facultyApproverUserId": faculty_approver,
        "adminApproverUserId": admin_approver,
        "timeline": [
            {
                "event": "submitted",
                "actorRole": requester_role,
                "actorUserId": requester_user_id,
                "timestamp": timestamp,
                "note": "Credential update request submitted",
            }
        ],
        "createdAt": timestamp,
        "updatedAt": timestamp,
        "rejectionReason": None,
    }

    stored = await save_credential_request(request_doc)
    await record_request_event(
        stored,
        event="submitted",
        actor={"role": requester_role, "user_id": requester_user_id},
        note="Credential update request submitted",
    )

    if initial_status == STATUS_PENDING_FACULTY:
        await create_system_notification(
            receiver_role=ROLE_FACULTY,
            title="Credential change request requires faculty approval",
            message=f"Student {requester_user_id} submitted a credential update request.",
            priority="high",
            sender_role=requester_role,
            action_id=request_id,
            related_data={"requestId": request_id, "stage": "faculty"},
        )
    else:
        await create_system_notification(
            receiver_role=ROLE_ADMIN,
            title="Credential change request requires admin approval",
            message=f"{requester_role.title()} {requester_user_id} submitted a credential update request.",
            priority="high",
            sender_role=requester_role,
            action_id=request_id,
            related_data={"requestId": request_id, "stage": "admin"},
        )

    return stored


async def apply_credential_request_changes(request_doc: dict) -> None:
    target_role = request_doc.get("targetRole")
    target_user_id = request_doc.get("targetUserId")
    changes = deepcopy(request_doc.get("requestedChanges") or {})

    if request_doc.get("requestType") == REQUEST_TYPE_PASSWORD:
        new_password = str(changes.get("newPassword") or "")
        if not new_password:
            raise HTTPException(status_code=400, detail="Password request is missing newPassword")
        await upsert_password(target_user_id, new_password)
        return

    if request_doc.get("requestType") != REQUEST_TYPE_PROFILE:
        raise HTTPException(status_code=400, detail="Unsupported request type")

    if target_role == ROLE_STUDENT:
        await upsert_user_settings(ROLE_STUDENT, target_user_id, DEFAULT_STUDENT_SETTINGS, changes)
        return

    if target_role == ROLE_FACULTY:
        await upsert_user_settings(ROLE_FACULTY, target_user_id, DEFAULT_FACULTY_SETTINGS, {"profile": changes})
        return

    if target_role == ROLE_FINANCE:
        await upsert_user_settings(ROLE_FINANCE, target_user_id, DEFAULT_FINANCE_SETTINGS, {"profile": changes})
        return

    if target_role == ROLE_ADMIN:
        defaults = deep_merge(DEFAULT_ADMIN_PROFILE, {"adminId": target_user_id})
        await upsert_user_settings(ROLE_ADMIN, target_user_id, defaults, changes)
        return

    raise HTTPException(status_code=400, detail="Unsupported target role")


async def approve_credential_request(request_doc: dict, actor: dict, comment: str | None) -> dict:
    status = request_doc.get("status")
    timestamp = now_iso()

    if status == STATUS_PENDING_FACULTY:
        if actor["role"] != ROLE_FACULTY:
            raise HTTPException(status_code=403, detail="Only faculty can approve this request at current stage")
        if request_doc.get("facultyApproverUserId") != actor["user_id"]:
            raise HTTPException(status_code=403, detail="This request is not assigned to your faculty account")

        request_doc["status"] = STATUS_PENDING_ADMIN
        request_doc["approvalStage"] = "admin"
        request_doc["updatedAt"] = timestamp
        request_doc["facultyDecision"] = {
            "approved": True,
            "comment": str(comment or ""),
            "actorRole": actor["role"],
            "actorUserId": actor["user_id"],
            "timestamp": timestamp,
        }
        request_doc.setdefault("timeline", []).append(
            {
                "event": "faculty_approved",
                "actorRole": actor["role"],
                "actorUserId": actor["user_id"],
                "timestamp": timestamp,
                "note": str(comment or "Faculty approved request"),
            }
        )

        stored = await save_credential_request(request_doc)
        await record_request_event(stored, "faculty_approved", actor, str(comment or "Faculty approved request"))

        await create_system_notification(
            receiver_role=ROLE_ADMIN,
            title="Credential request escalated to admin",
            message=f"Request {stored.get('requestId')} from {stored.get('requesterUserId')} is pending admin approval.",
            priority="high",
            sender_role=ROLE_FACULTY,
            action_id=stored.get("requestId"),
            related_data={"requestId": stored.get("requestId"), "stage": "admin"},
        )

        await create_system_notification(
            receiver_role=stored.get("requesterRole") or ROLE_STUDENT,
            title="Credential request advanced",
            message=f"Request {stored.get('requestId')} was approved by faculty and is pending admin approval.",
            priority="medium",
            sender_role=ROLE_FACULTY,
            action_id=stored.get("requestId"),
            related_data={"requestId": stored.get("requestId"), "status": STATUS_PENDING_ADMIN},
        )

        return stored

    if status == STATUS_PENDING_ADMIN:
        ensure_admin(actor)

        await apply_credential_request_changes(request_doc)

        request_doc["status"] = STATUS_APPROVED
        request_doc["approvalStage"] = "completed"
        request_doc["approvedAt"] = timestamp
        request_doc["appliedAt"] = timestamp
        request_doc["updatedAt"] = timestamp
        request_doc["adminDecision"] = {
            "approved": True,
            "comment": str(comment or ""),
            "actorRole": actor["role"],
            "actorUserId": actor["user_id"],
            "timestamp": timestamp,
        }
        request_doc.setdefault("timeline", []).append(
            {
                "event": "admin_approved_and_applied",
                "actorRole": actor["role"],
                "actorUserId": actor["user_id"],
                "timestamp": timestamp,
                "note": str(comment or "Admin approved and applied request"),
            }
        )

        stored = await save_credential_request(request_doc)
        await record_request_event(stored, "admin_approved_and_applied", actor, str(comment or "Admin approved request"))

        await create_system_notification(
            receiver_role=stored.get("requesterRole") or ROLE_STUDENT,
            title="Credential request approved",
            message=f"Request {stored.get('requestId')} has been approved and applied.",
            priority="medium",
            sender_role=ROLE_ADMIN,
            action_id=stored.get("requestId"),
            related_data={"requestId": stored.get("requestId"), "status": STATUS_APPROVED},
        )

        return stored

    raise HTTPException(status_code=400, detail="Only pending requests can be approved")


async def reject_credential_request(request_doc: dict, actor: dict, reason: str | None) -> dict:
    status = request_doc.get("status")
    timestamp = now_iso()
    rejection_reason = str(reason or "Request rejected by approver")

    if status == STATUS_PENDING_FACULTY:
        if actor["role"] != ROLE_FACULTY:
            raise HTTPException(status_code=403, detail="Only faculty can reject this request at current stage")
        if request_doc.get("facultyApproverUserId") != actor["user_id"]:
            raise HTTPException(status_code=403, detail="This request is not assigned to your faculty account")
    elif status == STATUS_PENDING_ADMIN:
        ensure_admin(actor)
    else:
        raise HTTPException(status_code=400, detail="Only pending requests can be rejected")

    request_doc["status"] = STATUS_REJECTED
    request_doc["approvalStage"] = "completed"
    request_doc["rejectionReason"] = rejection_reason
    request_doc["rejectedAt"] = timestamp
    request_doc["updatedAt"] = timestamp
    request_doc["rejectedBy"] = {
        "actorRole": actor["role"],
        "actorUserId": actor["user_id"],
        "timestamp": timestamp,
    }
    request_doc.setdefault("timeline", []).append(
        {
            "event": "rejected",
            "actorRole": actor["role"],
            "actorUserId": actor["user_id"],
            "timestamp": timestamp,
            "note": rejection_reason,
        }
    )

    stored = await save_credential_request(request_doc)
    await record_request_event(stored, "rejected", actor, rejection_reason)

    await create_system_notification(
        receiver_role=stored.get("requesterRole") or ROLE_STUDENT,
        title="Credential request rejected",
        message=f"Request {stored.get('requestId')} was rejected. Reason: {rejection_reason}",
        priority="high",
        sender_role=actor["role"],
        action_id=stored.get("requestId"),
        related_data={"requestId": stored.get("requestId"), "status": STATUS_REJECTED},
    )

    return stored


async def log_direct_admin_change(actor: dict, change_type: str, old_values: dict, new_values: dict) -> None:
    await append_audit_log(
        {
            "auditId": f"AUD-{uuid4().hex[:10].upper()}",
            "requestId": f"DIRECT-{uuid4().hex[:8].upper()}",
            "event": f"direct_admin_{change_type}",
            "status": STATUS_APPROVED,
            "actorRole": actor.get("role"),
            "actorUserId": actor.get("user_id"),
            "requesterRole": actor.get("role"),
            "requesterUserId": actor.get("user_id"),
            "targetRole": ROLE_ADMIN,
            "targetUserId": actor.get("user_id"),
            "maskedCurrentValues": mask_map(old_values),
            "maskedRequestedChanges": mask_map(new_values),
            "note": "Direct admin credential update",
            "createdAt": now_iso(),
        }
    )


@router.get("/api/student/settings/{user_id}")
async def get_student_settings(
    user_id: str,
    x_actor_user_id: str | None = Header(default=None, alias="X-Actor-UserId"),
    x_actor_role: str | None = Header(default=None, alias="X-Actor-Role"),
):
    actor = require_actor(x_actor_user_id, x_actor_role)
    ensure_self(actor, ROLE_STUDENT, user_id)
    return await load_user_settings(ROLE_STUDENT, user_id, DEFAULT_STUDENT_SETTINGS)


@router.put("/api/student/settings/{user_id}")
async def update_student_settings(
    user_id: str,
    payload: dict = Body(default={}),
    x_actor_user_id: str | None = Header(default=None, alias="X-Actor-UserId"),
    x_actor_role: str | None = Header(default=None, alias="X-Actor-Role"),
):
    actor = require_actor(x_actor_user_id, x_actor_role)
    ensure_self(actor, ROLE_STUDENT, user_id)

    current = await load_user_settings(ROLE_STUDENT, user_id, DEFAULT_STUDENT_SETTINGS)
    changed = select_changed_fields(current, payload or {}, PROFILE_ALLOWED_FIELDS[ROLE_STUDENT])

    request_doc = await submit_credential_request(
        requester_role=ROLE_STUDENT,
        requester_user_id=user_id,
        request_type=REQUEST_TYPE_PROFILE,
        requested_changes=changed,
        current_values={key: current.get(key) for key in changed},
    )

    return {
        "success": True,
        "message": "Credential change request submitted. Pending Faculty Approval.",
        "request": to_public_request(request_doc),
    }


@router.get("/api/admin/profile/{user_id}")
async def get_admin_profile(
    user_id: str,
    x_actor_user_id: str | None = Header(default=None, alias="X-Actor-UserId"),
    x_actor_role: str | None = Header(default=None, alias="X-Actor-Role"),
):
    actor = require_actor(x_actor_user_id, x_actor_role)
    ensure_self(actor, ROLE_ADMIN, user_id)
    defaults = deep_merge(DEFAULT_ADMIN_PROFILE, {"adminId": user_id})
    return await load_user_settings(ROLE_ADMIN, user_id, defaults)


@router.put("/api/admin/profile/{user_id}")
async def update_admin_profile(
    user_id: str,
    payload: dict = Body(default={}),
    x_actor_user_id: str | None = Header(default=None, alias="X-Actor-UserId"),
    x_actor_role: str | None = Header(default=None, alias="X-Actor-Role"),
):
    actor = require_actor(x_actor_user_id, x_actor_role)
    ensure_self(actor, ROLE_ADMIN, user_id)

    defaults = deep_merge(DEFAULT_ADMIN_PROFILE, {"adminId": user_id})
    current = await load_user_settings(ROLE_ADMIN, user_id, defaults)
    changed = select_changed_fields(current, payload or {}, PROFILE_ALLOWED_FIELDS[ROLE_ADMIN])

    updated = await upsert_user_settings(ROLE_ADMIN, user_id, defaults, changed)
    await log_direct_admin_change(actor, "profile_update", {key: current.get(key) for key in changed}, changed)
    return updated


@router.put("/api/admin/change-password")
async def change_admin_password(
    payload: dict = Body(default={}),
    x_actor_user_id: str | None = Header(default=None, alias="X-Actor-UserId"),
    x_actor_role: str | None = Header(default=None, alias="X-Actor-Role"),
):
    actor = require_actor(x_actor_user_id, x_actor_role)
    ensure_admin(actor)

    user_id = str(payload.get("userId") or actor["user_id"])
    if user_id != actor["user_id"]:
        raise HTTPException(status_code=403, detail="Admin can update only own credentials")

    current_password = str(payload.get("currentPassword") or "")
    new_password = str(payload.get("newPassword") or "")

    if not current_password or not new_password:
        raise HTTPException(status_code=400, detail="currentPassword and newPassword are required")

    existing_password = await load_password(user_id, "admin123")
    if not verify_password(current_password, existing_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    if len(new_password) < 8:
        raise HTTPException(status_code=400, detail="New password must be at least 8 characters")

    await upsert_password(user_id, new_password)
    await log_direct_admin_change(
        actor,
        "password_change",
        {"currentPassword": current_password},
        {"newPassword": new_password},
    )
    return {"message": "Password changed successfully"}


@router.post("/api/settings/change-password")
async def change_role_password(
    payload: dict = Body(default={}),
    x_actor_user_id: str | None = Header(default=None, alias="X-Actor-UserId"),
    x_actor_role: str | None = Header(default=None, alias="X-Actor-Role"),
):
    actor = require_actor(x_actor_user_id, x_actor_role)

    user_id = str(payload.get("userId") or "")
    role = normalize_role(payload.get("role") or actor["role"])
    old_password = str(payload.get("oldPassword") or payload.get("currentPassword") or "")
    new_password = str(payload.get("newPassword") or "")

    if role not in {ROLE_STUDENT, ROLE_FACULTY, ROLE_FINANCE}:
        raise HTTPException(status_code=400, detail="Password approval flow is supported for student, faculty, and finance")

    if not user_id or not old_password or not new_password:
        raise HTTPException(status_code=400, detail="userId, oldPassword/currentPassword and newPassword are required")

    ensure_self(actor, role, user_id)

    fallback = DEFAULT_PASSWORD_BY_USER_ID.get(user_id, "password123")
    existing_password = await load_password(user_id, fallback)
    if not verify_password(old_password, existing_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    if len(new_password) < 8:
        raise HTTPException(status_code=400, detail="New password must be at least 8 characters")

    request_doc = await submit_credential_request(
        requester_role=role,
        requester_user_id=user_id,
        request_type=REQUEST_TYPE_PASSWORD,
        requested_changes={"newPassword": new_password},
        current_values={"currentPassword": old_password},
    )

    if role == ROLE_STUDENT:
        message = "Credential change request submitted. Pending Faculty Approval."
    else:
        message = "Credential change request submitted. Pending Admin Approval."

    return {
        "success": True,
        "message": message,
        "request": to_public_request(request_doc),
    }


@router.get("/api/settings/credential-requests")
async def list_credential_requests(
    scope: str = Query(default="my"),
    status: str | None = Query(default=None),
    x_actor_user_id: str | None = Header(default=None, alias="X-Actor-UserId"),
    x_actor_role: str | None = Header(default=None, alias="X-Actor-Role"),
):
    actor = require_actor(x_actor_user_id, x_actor_role)
    rows = await query_credential_requests(actor, scope, status)
    return {
        "success": True,
        "scope": scope,
        "count": len(rows),
        "data": [to_public_request(row) for row in rows],
    }


@router.get("/api/settings/credential-requests/{request_id}")
async def get_credential_request(
    request_id: str,
    x_actor_user_id: str | None = Header(default=None, alias="X-Actor-UserId"),
    x_actor_role: str | None = Header(default=None, alias="X-Actor-Role"),
):
    actor = require_actor(x_actor_user_id, x_actor_role)
    request_doc = await find_credential_request(request_id)
    if not request_doc:
        raise HTTPException(status_code=404, detail="Credential request not found")

    can_view = False
    if actor["role"] == ROLE_ADMIN:
        can_view = True
    elif request_doc.get("requesterUserId") == actor["user_id"]:
        can_view = True
    elif actor["role"] == ROLE_FACULTY and request_doc.get("facultyApproverUserId") == actor["user_id"]:
        can_view = True

    if not can_view:
        raise HTTPException(status_code=403, detail="Not authorized to view this credential request")

    return {
        "success": True,
        "data": to_public_request(request_doc),
    }


@router.post("/api/settings/credential-requests/{request_id}/approve")
async def approve_request(
    request_id: str,
    payload: dict = Body(default={}),
    x_actor_user_id: str | None = Header(default=None, alias="X-Actor-UserId"),
    x_actor_role: str | None = Header(default=None, alias="X-Actor-Role"),
):
    actor = require_actor(x_actor_user_id, x_actor_role)
    request_doc = await find_credential_request(request_id)
    if not request_doc:
        raise HTTPException(status_code=404, detail="Credential request not found")

    updated = await approve_credential_request(request_doc, actor, str(payload.get("comment") or ""))
    return {
        "success": True,
        "message": "Credential request approved",
        "data": to_public_request(updated),
    }


@router.post("/api/settings/credential-requests/{request_id}/reject")
async def reject_request(
    request_id: str,
    payload: dict = Body(default={}),
    x_actor_user_id: str | None = Header(default=None, alias="X-Actor-UserId"),
    x_actor_role: str | None = Header(default=None, alias="X-Actor-Role"),
):
    actor = require_actor(x_actor_user_id, x_actor_role)
    request_doc = await find_credential_request(request_id)
    if not request_doc:
        raise HTTPException(status_code=404, detail="Credential request not found")

    updated = await reject_credential_request(request_doc, actor, str(payload.get("reason") or ""))
    return {
        "success": True,
        "message": "Credential request rejected",
        "data": to_public_request(updated),
    }


@router.get("/api/settings/credential-audit/export")
async def export_credential_audit(
    limit: int = Query(default=250, ge=1, le=2000),
    x_actor_user_id: str | None = Header(default=None, alias="X-Actor-UserId"),
    x_actor_role: str | None = Header(default=None, alias="X-Actor-Role"),
):
    actor = require_actor(x_actor_user_id, x_actor_role)
    ensure_admin(actor)

    db = get_db_or_none()
    if db is None:
        data = sorted(DEV_SETTINGS["credential_audit"], key=lambda row: row.get("createdAt", ""), reverse=True)[:limit]
        return {"success": True, "count": len(data), "data": data}

    cursor = db[CREDENTIAL_AUDIT_COLLECTION].find({}).sort("createdAt", -1).limit(limit)
    rows = []
    async for row in cursor:
        clean_row = dict(row)
        clean_row.pop("_id", None)
        rows.append(clean_row)

    return {
        "success": True,
        "count": len(rows),
        "data": rows,
    }


@router.get("/api/admin/system")
async def get_admin_system_settings(
    x_actor_user_id: str | None = Header(default=None, alias="X-Actor-UserId"),
    x_actor_role: str | None = Header(default=None, alias="X-Actor-Role"),
):
    actor = require_actor(x_actor_user_id, x_actor_role)
    ensure_admin(actor)
    return await load_admin_section("system", DEFAULT_ADMIN_SYSTEM)


@router.put("/api/admin/system")
async def update_admin_system_settings(
    payload: dict = Body(default={}),
    x_actor_user_id: str | None = Header(default=None, alias="X-Actor-UserId"),
    x_actor_role: str | None = Header(default=None, alias="X-Actor-Role"),
):
    actor = require_actor(x_actor_user_id, x_actor_role)
    ensure_admin(actor)
    return await upsert_admin_section("system", DEFAULT_ADMIN_SYSTEM, payload or {})


@router.get("/api/admin/academic")
async def get_admin_academic_settings(
    x_actor_user_id: str | None = Header(default=None, alias="X-Actor-UserId"),
    x_actor_role: str | None = Header(default=None, alias="X-Actor-Role"),
):
    actor = require_actor(x_actor_user_id, x_actor_role)
    ensure_admin(actor)
    return await load_admin_section("academic", DEFAULT_ADMIN_ACADEMIC)


@router.put("/api/admin/academic")
async def update_admin_academic_settings(
    payload: dict = Body(default={}),
    x_actor_user_id: str | None = Header(default=None, alias="X-Actor-UserId"),
    x_actor_role: str | None = Header(default=None, alias="X-Actor-Role"),
):
    actor = require_actor(x_actor_user_id, x_actor_role)
    ensure_admin(actor)
    return await upsert_admin_section("academic", DEFAULT_ADMIN_ACADEMIC, payload or {})


@router.get("/api/settings/faculty/{user_id}")
async def get_faculty_settings(
    user_id: str,
    x_actor_user_id: str | None = Header(default=None, alias="X-Actor-UserId"),
    x_actor_role: str | None = Header(default=None, alias="X-Actor-Role"),
):
    actor = require_actor(x_actor_user_id, x_actor_role)
    ensure_self(actor, ROLE_FACULTY, user_id)
    return await load_user_settings(ROLE_FACULTY, user_id, DEFAULT_FACULTY_SETTINGS)


@router.put("/api/settings/faculty/profile/{user_id}")
async def update_faculty_profile(
    user_id: str,
    payload: dict = Body(default={}),
    x_actor_user_id: str | None = Header(default=None, alias="X-Actor-UserId"),
    x_actor_role: str | None = Header(default=None, alias="X-Actor-Role"),
):
    actor = require_actor(x_actor_user_id, x_actor_role)
    ensure_self(actor, ROLE_FACULTY, user_id)

    current_settings = await load_user_settings(ROLE_FACULTY, user_id, DEFAULT_FACULTY_SETTINGS)
    current_profile = extract_profile_from_settings(ROLE_FACULTY, current_settings)
    changed = select_changed_fields(current_profile, payload or {}, PROFILE_ALLOWED_FIELDS[ROLE_FACULTY])

    request_doc = await submit_credential_request(
        requester_role=ROLE_FACULTY,
        requester_user_id=user_id,
        request_type=REQUEST_TYPE_PROFILE,
        requested_changes=changed,
        current_values={key: current_profile.get(key) for key in changed},
    )

    return {
        "success": True,
        "message": "Credential change request submitted. Pending Admin Approval.",
        "request": to_public_request(request_doc),
    }


@router.put("/api/settings/faculty/toggles/{user_id}")
async def update_faculty_toggles(
    user_id: str,
    payload: dict = Body(default={}),
    x_actor_user_id: str | None = Header(default=None, alias="X-Actor-UserId"),
    x_actor_role: str | None = Header(default=None, alias="X-Actor-Role"),
):
    actor = require_actor(x_actor_user_id, x_actor_role)
    ensure_self(actor, ROLE_FACULTY, user_id)
    patch = {"toggles": payload or {}}
    return await upsert_user_settings(ROLE_FACULTY, user_id, DEFAULT_FACULTY_SETTINGS, patch)


@router.get("/api/settings/finance/{user_id}")
async def get_finance_settings(
    user_id: str,
    x_actor_user_id: str | None = Header(default=None, alias="X-Actor-UserId"),
    x_actor_role: str | None = Header(default=None, alias="X-Actor-Role"),
):
    actor = require_actor(x_actor_user_id, x_actor_role)
    ensure_self(actor, ROLE_FINANCE, user_id)
    return await load_user_settings(ROLE_FINANCE, user_id, DEFAULT_FINANCE_SETTINGS)


@router.put("/api/settings/finance/profile/{user_id}")
async def update_finance_profile(
    user_id: str,
    payload: dict = Body(default={}),
    x_actor_user_id: str | None = Header(default=None, alias="X-Actor-UserId"),
    x_actor_role: str | None = Header(default=None, alias="X-Actor-Role"),
):
    actor = require_actor(x_actor_user_id, x_actor_role)
    ensure_self(actor, ROLE_FINANCE, user_id)

    current_settings = await load_user_settings(ROLE_FINANCE, user_id, DEFAULT_FINANCE_SETTINGS)
    current_profile = extract_profile_from_settings(ROLE_FINANCE, current_settings)
    changed = select_changed_fields(current_profile, payload or {}, PROFILE_ALLOWED_FIELDS[ROLE_FINANCE])

    request_doc = await submit_credential_request(
        requester_role=ROLE_FINANCE,
        requester_user_id=user_id,
        request_type=REQUEST_TYPE_PROFILE,
        requested_changes=changed,
        current_values={key: current_profile.get(key) for key in changed},
    )

    return {
        "success": True,
        "message": "Credential change request submitted. Pending Admin Approval.",
        "request": to_public_request(request_doc),
    }


@router.put("/api/settings/finance/toggles/{user_id}")
async def update_finance_toggles(
    user_id: str,
    payload: dict = Body(default={}),
    x_actor_user_id: str | None = Header(default=None, alias="X-Actor-UserId"),
    x_actor_role: str | None = Header(default=None, alias="X-Actor-Role"),
):
    actor = require_actor(x_actor_user_id, x_actor_role)
    ensure_self(actor, ROLE_FINANCE, user_id)
    patch = {"toggles": payload or {}}
    return await upsert_user_settings(ROLE_FINANCE, user_id, DEFAULT_FINANCE_SETTINGS, patch)
