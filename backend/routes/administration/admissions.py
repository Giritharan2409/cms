from datetime import datetime, timezone
from typing import Any, Optional

from bson import ObjectId
from fastapi import APIRouter, HTTPException, Query

from backend.db import get_db
from backend.dev_store import DEV_STORE, save_dev_store
from backend.schemas.admission_schema import AdmissionCreate
from backend.utils.auth_credentials import ensure_student_login_credential

router = APIRouter(prefix="/admissions", tags=["Admissions"])

COURSES_BY_CATEGORY: dict[str, list[dict[str, str]]] = {
    "Engineering": [
        {"code": "CSE", "name": "Computer Science Engineering"},
        {"code": "ECE", "name": "Electronics and Communication Engineering"},
        {"code": "MECH", "name": "Mechanical Engineering"},
        {"code": "CIVIL", "name": "Civil Engineering"},
        {"code": "IT", "name": "Information Technology"},
    ],
}

DEPARTMENT_BY_CODE = {
    "CSE": "Computer Science",
    "ECE": "Electronics",
    "MECH": "Mechanical",
    "CIVIL": "Civil",
    "IT": "Information Technology",
}


def _admissions_collection():
    return get_db()["admissions"]


def _to_float(value: Any, fallback: float = 0.0) -> float:
    if value is None:
        return fallback
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, str):
        cleaned = value.replace("%", "").strip()
        try:
            return float(cleaned)
        except ValueError:
            return fallback
    return fallback


def _to_int(value: Any, fallback: int = 0) -> int:
    if value is None:
        return fallback
    if isinstance(value, int):
        return value
    if isinstance(value, float):
        return int(value)
    if isinstance(value, str):
        cleaned = value.strip()
        try:
            return int(cleaned)
        except ValueError:
            return fallback
    return fallback


def _text(value: Any, fallback: str = "") -> str:
    text = str(value or "").strip()
    return text if text else fallback


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _today_ymd() -> str:
    return datetime.now(timezone.utc).date().isoformat()


def _normalize_academic_year(value: Any) -> str:
    year_text = str(value or "").strip().replace("–", "-")
    if not year_text:
        raise HTTPException(status_code=422, detail="academicYear is required")

    if "-" not in year_text:
        raise HTTPException(status_code=422, detail="academicYear must be in YYYY-YYYY format")

    start, end = [part.strip() for part in year_text.split("-", 1)]
    if len(start) != 4 or len(end) != 4 or not start.isdigit() or not end.isdigit():
        raise HTTPException(status_code=422, detail="academicYear must be in YYYY-YYYY format")

    if int(end) != int(start) + 1:
        raise HTTPException(status_code=422, detail="academicYear must represent consecutive years")

    return f"{start}-{end}"


def _derive_admission_year(academic_year: str) -> int:
    return int(academic_year.split("-", 1)[0])


def _build_lookup_query(admission_id: str) -> dict[str, Any]:
    lookup: list[dict[str, Any]] = [
        {"id": admission_id},
        {"admission_id": admission_id},
    ]
    if ObjectId.is_valid(admission_id):
        lookup.append({"_id": ObjectId(admission_id)})
    return {"$or": lookup}


def _serialize_admission(item: dict[str, Any]) -> dict[str, Any]:
    serialized = dict(item)
    raw_id = serialized.get("_id")
    serialized["_id"] = str(raw_id) if raw_id is not None else str(
        serialized.get("id") or serialized.get("admission_id") or ""
    )

    if not serialized.get("id"):
        serialized["id"] = serialized.get("admission_id") or serialized["_id"]
    if not serialized.get("admission_id"):
        serialized["admission_id"] = serialized["id"]

    payment_status = (
        serialized.get("paymentStatus")
        or serialized.get("payment_status")
        or (serialized.get("payment") or {}).get("status")
        or "Pending"
    )
    serialized["payment_status"] = payment_status
    serialized["paymentStatus"] = payment_status

    if not serialized.get("name") and serialized.get("fullName"):
        serialized["name"] = serialized["fullName"]
    if not serialized.get("fullName") and serialized.get("name"):
        serialized["fullName"] = serialized["name"]

    serialized["rollNumber"] = serialized.get("rollNumber") or serialized.get("roll_number") or serialized["id"]
    serialized["roll_number"] = serialized.get("roll_number") or serialized["rollNumber"]
    serialized["semester"] = serialized.get("semester") or (serialized.get("academic") or {}).get("semester") or 0
    serialized["cgpa"] = serialized.get("cgpa") or (serialized.get("academic") or {}).get("cgpa") or 0

    personal = serialized.get("personal") or {}
    guardian_name = serialized.get("guardianName") or serialized.get("guardian_name") or personal.get("guardian_name") or serialized.get("guardian") or ""
    guardian_phone = serialized.get("guardianPhone") or serialized.get("guardian_phone") or personal.get("guardian_phone") or ""
    guardian_relationship = (
        serialized.get("guardianRelationship")
        or serialized.get("guardian_relationship")
        or personal.get("guardian_relationship")
        or ""
    )

    serialized["address"] = serialized.get("address") or personal.get("address") or ""
    serialized["city"] = serialized.get("city") or personal.get("city") or ""
    serialized["state"] = serialized.get("state") or personal.get("state") or ""
    serialized["pincode"] = serialized.get("pincode") or personal.get("pincode") or ""
    serialized["guardianName"] = guardian_name
    serialized["guardian_name"] = guardian_name
    serialized["guardianPhone"] = guardian_phone
    serialized["guardian_phone"] = guardian_phone
    serialized["guardianRelationship"] = guardian_relationship
    serialized["guardian_relationship"] = guardian_relationship

    return serialized


COURSE_NAME_BY_CODE = {
    str(course.get("code", "")).strip().upper(): str(course.get("name", "")).strip()
    for category_courses in COURSES_BY_CATEGORY.values()
    for course in category_courses
    if course.get("code") and course.get("name")
}

COURSE_CODE_BY_NAME = {
    name.lower(): code
    for code, name in COURSE_NAME_BY_CODE.items()
}

COURSE_CODE_BY_DEPARTMENT = {
    department.lower(): code
    for code, department in DEPARTMENT_BY_CODE.items()
}


def _normalize_text(value: Any) -> str:
    return str(value or "").strip()


def _course_candidates(course: Optional[str]) -> set[str]:
    if not course:
        return set()

    normalized = _normalize_text(course)
    lowered = normalized.lower()
    uppered = normalized.upper()
    candidates = {lowered}

    if uppered in COURSE_NAME_BY_CODE:
        candidates.add(COURSE_NAME_BY_CODE[uppered].lower())
        candidates.add(DEPARTMENT_BY_CODE.get(uppered, "").lower())
    if lowered in COURSE_CODE_BY_NAME:
        candidates.add(COURSE_CODE_BY_NAME[lowered].lower())
    if uppered in DEPARTMENT_BY_CODE:
        candidates.add(DEPARTMENT_BY_CODE[uppered].lower())
    if lowered in COURSE_CODE_BY_DEPARTMENT:
        code = COURSE_CODE_BY_DEPARTMENT[lowered]
        candidates.add(code.lower())
        candidates.add(COURSE_NAME_BY_CODE.get(code, "").lower())

    return candidates


def _derive_academic_year_from_student_identifier(student_id: str) -> str:
    parts = _normalize_text(student_id).split("-")
    if len(parts) >= 3 and parts[1].isdigit() and len(parts[1]) == 4:
        start = int(parts[1])
        return f"{start}-{start + 1}"
    return ""


def _student_row_to_admission_like(row: dict[str, Any]) -> dict[str, Any]:
    student_id = _normalize_text(row.get("id") or row.get("rollNumber"))
    academic_year = (
        _normalize_text(row.get("academicYear"))
        or _normalize_text(row.get("academic_year"))
        or _derive_academic_year_from_student_identifier(student_id)
    )
    course = _normalize_text(row.get("course") or row.get("department"))

    return {
        "_id": str(row.get("_id") or student_id),
        "id": student_id,
        "admission_id": student_id,
        "role": "student",
        "type": "student",
        "status": row.get("status") or "Active",
        "name": row.get("name") or row.get("fullName") or "",
        "fullName": row.get("fullName") or row.get("name") or "",
        "email": row.get("email") or "",
        "phone": row.get("phone") or "",
        "course": course,
        "department": row.get("department") or course,
        "academicYear": academic_year,
        "academic_year": academic_year,
        "created_at": row.get("created_at") or row.get("createdAt") or "",
    }


async def _students_collection_fallback(
    academic_year: Optional[str],
    course: Optional[str],
) -> list[dict[str, Any]]:
    db = get_db()
    data: list[dict[str, Any]] = []

    async for row in db["students"].find().sort("_id", -1):
        normalized = _student_row_to_admission_like(dict(row))
        if _matches_student_filters(normalized, academic_year, course):
            data.append(normalized)

    return data


def _matches_academic_year(record: dict[str, Any], academic_year: Optional[str]) -> bool:
    if not academic_year:
        return True

    target = _normalize_text(academic_year)
    values = {
        _normalize_text(record.get("academicYear")),
        _normalize_text(record.get("academic_year")),
        _normalize_text((record.get("course_info") or {}).get("academic_year")),
    }
    return target in values


def _matches_course(record: dict[str, Any], course: Optional[str]) -> bool:
    if not course:
        return True

    candidates = _course_candidates(course)
    values = {
        _normalize_text(record.get("course")).lower(),
        _normalize_text(record.get("department")).lower(),
        _normalize_text((record.get("course_info") or {}).get("course")).lower(),
    }
    return any(value in candidates for value in values if value)


def _matches_student_filters(
    record: dict[str, Any],
    academic_year: Optional[str],
    course: Optional[str],
) -> bool:
    return _matches_academic_year(record, academic_year) and _matches_course(record, course)


def _normalize_from_flat_payload(payload: dict[str, Any]) -> dict[str, Any]:
    generated_id = f"STU-{int(datetime.now(timezone.utc).timestamp() * 1000)}"
    admission_id = payload.get("id") or payload.get("admission_id") or generated_id

    name = (payload.get("name") or payload.get("fullName") or "").strip()
    email = (payload.get("email") or "").strip()
    phone = (payload.get("phone") or "").strip()
    roll_number = _text(payload.get("rollNumber") or payload.get("roll_number") or admission_id)
    semester = _to_int(payload.get("semester"), fallback=0)
    cgpa = _to_float(payload.get("cgpa"), fallback=0.0)
    address = _text(payload.get("address") or payload.get("addressLine"))
    city = _text(payload.get("city"))
    state = _text(payload.get("state"))
    pincode = _text(payload.get("pincode"))
    guardian_name = _text(payload.get("guardianName") or payload.get("guardian_name") or payload.get("guardian"))
    guardian_phone = _text(payload.get("guardianPhone") or payload.get("guardian_phone"))
    guardian_relationship = _text(payload.get("guardianRelationship") or payload.get("guardian_relationship"))

    payment_status = payload.get("paymentStatus") or payload.get("payment_status") or "Pending"
    academic_year = _normalize_academic_year(payload.get("academicYear") or payload.get("academic_year"))
    admission_year = _to_int(payload.get("admissionYear"), fallback=_derive_admission_year(academic_year))

    normalized = {
        "id": admission_id,
        "admission_id": admission_id,
        "role": "student",
        "type": "student",
        "status": payload.get("status") or "Pending",
        "createdDate": payload.get("createdDate") or _today_ymd(),
        "created_at": _utc_now_iso(),
        "name": name,
        "fullName": payload.get("fullName") or name,
        "email": email,
        "phone": phone,
        "rollNumber": roll_number,
        "roll_number": roll_number,
        "semester": semester,
        "cgpa": cgpa,
        "dateOfBirth": payload.get("dateOfBirth") or payload.get("dob") or "",
        "gender": payload.get("gender") or "",
        "previousSchool": payload.get("previousSchool") or "",
        "board": payload.get("board") or "",
        "yearOfPassing": _to_int(payload.get("yearOfPassing")),
        "marksPercentage": _to_float(payload.get("marksPercentage")),
        "courseCategory": payload.get("courseCategory") or "",
        "course": payload.get("course") or "",
        "academicYear": academic_year,
        "admissionYear": admission_year,
        "quota": payload.get("quota") or "",
        "accommodation": payload.get("accommodation") or "",
        "roomType": payload.get("roomType") or "",
        "address": address,
        "city": city,
        "state": state,
        "pincode": pincode,
        "guardianName": guardian_name,
        "guardian_name": guardian_name,
        "guardianPhone": guardian_phone,
        "guardian_phone": guardian_phone,
        "guardianRelationship": guardian_relationship,
        "guardian_relationship": guardian_relationship,
        "documents": payload.get("documents") if isinstance(payload.get("documents"), list) else [
            {"id": f"DOC-PHOTO-{_utc_now_iso()}", "name": "Passport Photo", "data": payload.get("passportPhoto"), "type": "image/jpeg", "uploadDate": _utc_now_iso(), "category": "Identity"} if payload.get("passportPhoto") else None,
            {"id": f"DOC-AADHAAR-{_utc_now_iso()}", "name": "Aadhaar Card", "data": payload.get("aadhaarCard"), "type": "application/pdf", "uploadDate": _utc_now_iso(), "category": "Identity"} if payload.get("aadhaarCard") else None,
            {"id": f"DOC-MARKSHEET-{_utc_now_iso()}", "name": "Academic Marksheet", "data": payload.get("marksheet"), "type": "application/pdf", "uploadDate": _utc_now_iso(), "category": "Academic"} if payload.get("marksheet") else None,
            {"id": f"DOC-TC-{_utc_now_iso()}", "name": "Transfer Certificate", "data": payload.get("transferCertificate"), "type": "application/pdf", "uploadDate": _utc_now_iso(), "category": "Academic"} if payload.get("transferCertificate") else None,
        ],
        "payment": {
            "application_fee": _to_float(payload.get("applicationFee"), 500.0),
            "payment_method": payload.get("paymentMethod"),
            "transaction_id": payload.get("transactionId"),
            "payment_datetime": payload.get("paymentDateTime"),
            "status": payment_status,
        },
        "payment_status": payment_status,
        "paymentStatus": payment_status,
    }

    # Keep nested structure for backwards compatibility with any existing API consumers.
    normalized["personal"] = {
        "full_name": normalized["fullName"],
        "gender": normalized["gender"],
        "dob": normalized["dateOfBirth"],
        "email": normalized["email"],
        "phone": normalized["phone"],
        "student_id": normalized["id"],
        "address": address,
        "city": city,
        "state": state,
        "pincode": pincode,
        "guardian_name": guardian_name,
        "guardian_phone": guardian_phone,
        "guardian_relationship": guardian_relationship,
    }
    normalized["academic"] = {
        "previous_school": normalized["previousSchool"],
        "board": normalized["board"],
        "year_of_passing": normalized["yearOfPassing"],
        "marks_percentage": normalized["marksPercentage"],
        "semester": semester,
        "roll_number": roll_number,
        "cgpa": cgpa,
    }
    normalized["course_info"] = {
        "category": normalized["courseCategory"],
        "course": normalized["course"],
        "academic_year": normalized["academicYear"],
    }
    
    # Clean up documents if it was a list with None values from the fallback logic above
    if isinstance(normalized["documents"], list):
        normalized["documents"] = [d for d in normalized["documents"] if d is not None]
        # Ensure uploadDate is present for all
        for d in normalized["documents"]:
            if not d.get("uploadDate"):
                d["uploadDate"] = _utc_now_iso()

    return normalized


def _normalize_from_nested_payload(payload: dict[str, Any]) -> dict[str, Any]:
    validated = AdmissionCreate.model_validate(payload)
    admission = validated.model_dump()

    personal = admission.get("personal") or {}
    academic = admission.get("academic") or {}
    course = admission.get("course") or {}
    payment = admission.get("payment") or {}

    admission_id = personal.get("student_id") or f"STU-{int(datetime.now(timezone.utc).timestamp() * 1000)}"
    payment_status = admission.get("payment_status") or payment.get("status") or "Pending"
    academic_year = _normalize_academic_year(course.get("academic_year"))
    admission_year = _derive_admission_year(academic_year)

    admission.update(
        {
            "id": admission_id,
            "admission_id": admission_id,
            "type": "student" if admission.get("role") == "student" else admission.get("role"),
            "status": admission.get("status") or "Pending",
            "createdDate": _today_ymd(),
            "created_at": _utc_now_iso(),
            "name": personal.get("full_name") or "",
            "fullName": personal.get("full_name") or "",
            "email": personal.get("email") or "",
            "phone": personal.get("phone") or "",
            "rollNumber": academic.get("roll_number") or personal.get("student_id") or admission_id,
            "roll_number": academic.get("roll_number") or personal.get("student_id") or admission_id,
            "semester": academic.get("semester") or 0,
            "cgpa": academic.get("cgpa") or 0,
            "dateOfBirth": personal.get("dob") or "",
            "gender": personal.get("gender") or "",
            "previousSchool": academic.get("previous_school") or "",
            "board": academic.get("board") or "",
            "yearOfPassing": academic.get("year_of_passing") or 0,
            "marksPercentage": academic.get("marks_percentage") or 0,
            "courseCategory": course.get("category") or "",
            "course": course.get("course") or "",
            "academicYear": academic_year,
            "admissionYear": admission_year,
            "address": personal.get("address") or "",
            "city": personal.get("city") or "",
            "state": personal.get("state") or "",
            "pincode": personal.get("pincode") or "",
            "guardianName": personal.get("guardian_name") or "",
            "guardian_name": personal.get("guardian_name") or "",
            "guardianPhone": personal.get("guardian_phone") or "",
            "guardian_phone": personal.get("guardian_phone") or "",
            "guardianRelationship": personal.get("guardian_relationship") or "",
            "guardian_relationship": personal.get("guardian_relationship") or "",
            "payment_status": payment_status,
            "paymentStatus": payment_status,
            "course_info": {
                "category": course.get("category") or "",
                "course": course.get("course") or "",
                "academic_year": academic_year,
            },
        }
    )

    return admission


def _normalize_payload(payload: dict[str, Any]) -> dict[str, Any]:
    if "personal" in payload and "academic" in payload and "course" in payload:
        return _normalize_from_nested_payload(payload)

    if payload.get("name") or payload.get("fullName"):
        return _normalize_from_flat_payload(payload)

    raise HTTPException(
        status_code=422,
        detail="Unsupported admission payload. Provide nested admission payload or student add form payload.",
    )


@router.get("/courses")
async def list_courses(category: str = Query(default="Engineering")):
    return {"category": category, "data": COURSES_BY_CATEGORY.get(category, [])}


@router.post("/create")
async def create_admission(payload: dict[str, Any]):
    try:
        admissions_collection = _admissions_collection()
        admission = _normalize_payload(payload)
        result = await admissions_collection.insert_one(admission)
        await ensure_student_login_credential(admission.get("id") or admission.get("admission_id") or "")
        return {
            "message": "Admission created successfully",
            "mongo_id": str(result.inserted_id),
            "id": admission.get("id"),
            "admission_id": admission.get("admission_id"),
        }
    except HTTPException as e:
        if e.status_code == 503:
            admission = _normalize_payload(payload)
            if "admissions" not in DEV_STORE: DEV_STORE["admissions"] = []
            DEV_STORE["admissions"].append(admission)
            save_dev_store()
            await ensure_student_login_credential(admission.get("id") or admission.get("admission_id") or "")
            return {
                "message": "Admission created successfully (Dev Store)",
                "id": admission.get("id"),
                "admission_id": admission.get("admission_id"),
            }
        raise
    except Exception as e:
        print(f"Error creating admission: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error creating admission: {str(e)}")


@router.post("")
async def create_admission_v2(payload: dict[str, Any]):
    return await create_admission(payload)


@router.get("/")
async def get_all_admissions():
    admissions_collection = _admissions_collection()
    data: list[dict[str, Any]] = []

    async for item in admissions_collection.find().sort("created_at", -1):
        data.append(_serialize_admission(item))

    return data


@router.get("/students")
async def get_student_admissions(
    academic_year: Optional[str] = Query(None, alias="academicYear"),
    course: Optional[str] = Query(None),
):
    try:
        admissions_collection = _admissions_collection()
        data: list[dict[str, Any]] = []
        base_query: dict[str, Any] = {"$or": [{"role": "student"}, {"type": "student"}]}

        async for item in admissions_collection.find(base_query).sort("created_at", -1):
            serialized = _serialize_admission(item)
            if _matches_student_filters(serialized, academic_year, course):
                data.append(serialized)

        if not data:
            data = await _students_collection_fallback(academic_year, course)

        if academic_year or course:
            return {"data": data, "count": len(data)}
        return data
    except HTTPException as e:
        if e.status_code == 503:
            if "admissions" not in DEV_STORE: DEV_STORE["admissions"] = []
            query_results = [
                _serialize_admission(item) for item in DEV_STORE["admissions"]
                if item.get("role") == "student" or item.get("type") == "student"
            ]

            query_results = [
                item
                for item in query_results
                if _matches_student_filters(item, academic_year, course)
            ]

            if not query_results:
                student_results = [
                    _student_row_to_admission_like(item)
                    for item in DEV_STORE.get("students", [])
                ]
                query_results = [
                    item
                    for item in student_results
                    if _matches_student_filters(item, academic_year, course)
                ]

            data = sorted(query_results, key=lambda x: x.get("created_at", ""), reverse=True)
            if academic_year or course:
                return {"data": data, "count": len(data)}
            return data
        raise


@router.get("/students/filter")
async def get_filtered_students(
    academic_year: Optional[str] = Query(None, alias="academicYear"),
    course: Optional[str] = Query(None),
):
    """
    Get students filtered by academic year and course.
    Used for fee assignment module.
    """
    try:
        admissions_collection = _admissions_collection()
        
        query = {"$or": [{"role": "student"}, {"type": "student"}]}

        data: list[dict[str, Any]] = []
        async for item in admissions_collection.find(query).sort("created_at", -1):
            serialized = _serialize_admission(item)
            if _matches_student_filters(serialized, academic_year, course):
                data.append(serialized)
        
        return {"data": data, "count": len(data)}
        
    except HTTPException as e:
        if e.status_code == 503:
            # Fallback to dev store
            if "admissions" not in DEV_STORE: DEV_STORE["admissions"] = []
            
            query_results = [
                item for item in DEV_STORE["admissions"]
                if item.get("role") == "student" or item.get("type") == "student"
            ]
            
            query_results = [
                item
                for item in query_results
                if _matches_student_filters(item, academic_year, course)
            ]
            
            data = [_serialize_admission(item) for item in query_results]
            return {"data": data, "count": len(data)}
        raise


@router.get("/students/approved-for-fees")
async def get_approved_students_for_fees():
    """Get only APPROVED students with valid ID fields - ready for fee assignment.
    STRICT validation: Only returns students that can be found with exact ID match."""
    try:
        admissions_collection = _admissions_collection()
        data: list[dict[str, Any]] = []

        # Query: only approved students
        query = {
            "$and": [
                {"$or": [{"role": "student"}, {"type": "student"}]},
                {"status": "Approved"}
            ]
        }

        async for item in admissions_collection.find(query).sort("created_at", -1):
            serialized = _serialize_admission(item)
            student_id = serialized.get("id")

            # STRICT VALIDATION: Verify using EXACT field match (not $or queries)
            # This prevents false positives from corrupted records
            if student_id:
                # Try exact match on 'id' field first (most reliable)
                exact_match = await admissions_collection.find_one({"id": student_id})

                if exact_match:
                    # Double-check this is the same student (compare MongoDB IDs)
                    if str(exact_match.get("_id")) == str(item.get("_id")):
                        data.append(serialized)

        return {"approved_students": data, "count": len(data)}
    except HTTPException as e:
        if e.status_code == 503:
            if "admissions" not in DEV_STORE:
                DEV_STORE["admissions"] = []
            data = [
                _serialize_admission(item) for item in DEV_STORE["admissions"]
                if (item.get("role") == "student" or item.get("type") == "student")
                and item.get("status") == "Approved"
                and item.get("id")
            ]
            data = sorted(data, key=lambda x: x.get("created_at", ""), reverse=True)
            return {"approved_students": data, "count": len(data)}
        raise


@router.delete("/purge-invalid-approved")
async def purge_invalid_approved():
    """Admin endpoint: Remove approved students with invalid/non-existent IDs."""
    try:
        admissions_collection = _admissions_collection()
        removed_count = 0
        to_delete = []

        # Find all approved students
        query = {
            "$and": [
                {"$or": [{"role": "student"}, {"type": "student"}]},
                {"status": "Approved"}
            ]
        }

        async for item in admissions_collection.find(query):
            student_id = item.get("id") or item.get("admission_id")

            if not student_id:
                # No ID field at all - mark for deletion
                to_delete.append(item.get("_id"))
            else:
                # ID exists, verify it can be found
                exact_match = await admissions_collection.find_one({"id": student_id})

                # If ID doesn't match exactly, it's corrupted - delete
                if not exact_match or str(exact_match.get("_id")) != str(item.get("_id")):
                    to_delete.append(item.get("_id"))

        # Delete invalid records
        if to_delete:
            result = await admissions_collection.delete_many({"_id": {"$in": to_delete}})
            removed_count = result.deleted_count
            print(f"[PURGE] Removed {removed_count} invalid approved students")

        return {
            "message": f"Purged {removed_count} invalid records",
            "removed_count": removed_count
        }
    except HTTPException as e:
        if e.status_code == 503:
            if "admissions" not in DEV_STORE:
                DEV_STORE["admissions"] = []

            before = len(DEV_STORE["admissions"])
            DEV_STORE["admissions"] = [
                item for item in DEV_STORE["admissions"]
                if not (
                    (item.get("role") == "student" or item.get("type") == "student")
                    and item.get("status") == "Approved"
                    and not (item.get("id") or item.get("admission_id"))
                )
            ]
            removed_count = before - len(DEV_STORE["admissions"])
            save_dev_store()
            return {
                "message": f"Purged {removed_count} invalid records (Dev Store)",
                "removed_count": removed_count,
            }
        raise


@router.put("/approve/{admission_id}")
async def approve_admission(admission_id: str):
    try:
        admissions_collection = _admissions_collection()
        # First, fetch the admission to check if it has an ID
        admission = await admissions_collection.find_one(_build_lookup_query(admission_id))
        if not admission:
            raise HTTPException(status_code=404, detail="Admission not found")
        
        # Ensure the admission has an ID field (for fee assignment lookup)
        update_data = {
            "status": "Approved",
            "updated_at": _utc_now_iso()
        }
        
        # If no ID field exists, generate one
        if not admission.get("id") and not admission.get("admission_id"):
            new_id = f"STU-{int(datetime.now(timezone.utc).timestamp() * 1000)}"
            update_data["id"] = new_id
            update_data["admission_id"] = new_id
        
        result = await admissions_collection.update_one(
            _build_lookup_query(admission_id),
            {"$set": update_data},
        )

        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Admission not found")

        # Sync to official 'students' collection
        try:
            db = get_db()
            # Fetch the updated admission with the ID
            adm = await admissions_collection.find_one(_build_lookup_query(admission_id))
            if adm:
                # Map admission data to student structure
                student_data = {
                    "id": adm.get("id") or str(adm.get("_id")),
                    "rollNumber": adm.get("rollNumber") or adm.get("roll_number") or adm.get("id") or str(adm.get("_id")),
                    "roll_number": adm.get("rollNumber") or adm.get("roll_number") or adm.get("id") or str(adm.get("_id")),
                    "name": adm.get("name") or adm.get("fullName") or "N/A",
                    "email": adm.get("email") or "",
                    "phone": adm.get("phone") or "",
                    "department": adm.get("course") or adm.get("department") or "N/A",
                    "year": "1st Year",
                    "semester": adm.get("semester") or 1,
                    "section": "A",
                    "cgpa": adm.get("cgpa") or 0,
                    "status": "Active",
                    "feeStatus": adm.get("payment_status") or "Pending",
                    "enrollDate": adm.get("updated_at") or _utc_now_iso(),
                    "address": adm.get("address") or (adm.get("personal") or {}).get("address", ""),
                    "city": adm.get("city") or (adm.get("personal") or {}).get("city", ""),
                    "state": adm.get("state") or (adm.get("personal") or {}).get("state", ""),
                    "pincode": adm.get("pincode") or (adm.get("personal") or {}).get("pincode", ""),
                    "guardian": adm.get("guardianName") or adm.get("guardian_name") or (adm.get("personal") or {}).get("guardian_name", ""),
                    "guardianName": adm.get("guardianName") or adm.get("guardian_name") or (adm.get("personal") or {}).get("guardian_name", ""),
                    "guardianPhone": adm.get("guardianPhone") or adm.get("guardian_phone") or (adm.get("personal") or {}).get("guardian_phone", ""),
                    "guardianRelationship": adm.get("guardianRelationship") or adm.get("guardian_relationship") or (adm.get("personal") or {}).get("guardian_relationship", ""),
                    "motherName": adm.get("motherName") or (adm.get("personal") or {}).get("mother_name", ""),
                    "bloodGroup": adm.get("bloodGroup") or "",
                    "skills": adm.get("skills") or [],
                    "gender": adm.get("gender") or (adm.get("personal") or {}).get("gender", ""),
                    "avatar": f"https://ui-avatars.com/api/?name={adm.get('name', 'S')}&background=2563eb&color=fff&size=128",
                    "documents": adm.get("documents") or []
                }
                
                # Upsert into students collection
                await db["students"].update_one(
                    {"$or": [{"id": student_data["id"]}, {"rollNumber": student_data["rollNumber"]}]},
                    {"$set": student_data},
                    upsert=True
                )
        except Exception as e:
            print(f"[SYNC ERROR] Failed to sync admission to students: {str(e)}")

        return {"message": "Admission approved successfully", "id": admission_id}

    except HTTPException as e:
        if e.status_code == 503:
            if "admissions" not in DEV_STORE: DEV_STORE["admissions"] = []
            # Find and update in DEV_STORE
            found = False
            for adm in DEV_STORE["admissions"]:
                if adm.get("id") == admission_id or adm.get("admission_id") == admission_id:
                    adm["status"] = "Approved"
                    adm["updated_at"] = _utc_now_iso()
                    # Sync to DEV_STORE students
                    if "students" not in DEV_STORE: DEV_STORE["students"] = []
                    student_data = {
                        "id": adm.get("id"),
                        "rollNumber": adm.get("rollNumber") or adm.get("roll_number") or adm.get("id"),
                        "roll_number": adm.get("rollNumber") or adm.get("roll_number") or adm.get("id"),
                        "name": adm.get("name") or adm.get("fullName"),
                        "email": adm.get("email"),
                        "phone": adm.get("phone"),
                        "department": adm.get("course"),
                        "year": "1st Year",
                        "semester": adm.get("semester") or 1,
                        "cgpa": adm.get("cgpa") or 0,
                        "status": "Active",
                        "feeStatus": adm.get("payment_status") or "Pending",
                        "enrollDate": adm.get("updated_at"),
                        "address": adm.get("address") or "",
                        "city": adm.get("city") or "",
                        "state": adm.get("state") or "",
                        "pincode": adm.get("pincode") or "",
                        "guardian": adm.get("guardianName") or adm.get("guardian_name") or "",
                        "guardianName": adm.get("guardianName") or adm.get("guardian_name") or "",
                        "guardianPhone": adm.get("guardianPhone") or adm.get("guardian_phone") or "",
                        "guardianRelationship": adm.get("guardianRelationship") or adm.get("guardian_relationship") or "",
                        "avatar": f"https://ui-avatars.com/api/?name={adm.get('name', 'S')}&background=2563eb&color=fff&size=128"
                    }
                    # Upsert in dev students
                    idx = next((i for i, s in enumerate(DEV_STORE["students"]) if s.get("id") == student_data["id"]), None)
                    if idx is not None:
                        DEV_STORE["students"][idx].update(student_data)
                    else:
                        DEV_STORE["students"].insert(0, student_data)
                    found = True
                    break
            if not found:
                raise HTTPException(status_code=404, detail="Admission not found in Dev Store")
            save_dev_store()
            return {"message": "Admission approved successfully (Dev Store)", "id": admission_id}
        raise


@router.put("/reject/{admission_id}")
async def reject_admission(admission_id: str):
    admissions_collection = _admissions_collection()
    result = await admissions_collection.update_one(
        _build_lookup_query(admission_id),
        {"$set": {"status": "Rejected", "updated_at": _utc_now_iso()}},
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Admission not found")

    return {"message": "Admission rejected successfully", "id": admission_id}


@router.delete("/{admission_id}")
async def delete_admission(admission_id: str):
    admissions_collection = _admissions_collection()
    result = await admissions_collection.delete_one(_build_lookup_query(admission_id))

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Admission not found")

    return {"message": "Admission deleted successfully", "id": admission_id}


# -----------------
# Faculty Admissions Routes
# -----------------

def _faculty_admissions_collection():
    return get_db()["faculty_admissions"]


async def _get_faculty_collection():
    db = get_db()
    return db["faculty"]


def _serialize_faculty_admission(item: dict[str, Any]) -> dict[str, Any]:
    """Serialize faculty admission document"""
    serialized = dict(item)
    serialized["_id"] = str(serialized["_id"])
    
    if not serialized.get("id"):
        serialized["id"] = serialized.get("admission_id") or serialized["_id"]
    if not serialized.get("admission_id"):
        serialized["admission_id"] = serialized["id"]
    
    return serialized


def _build_faculty_lookup_query(faculty_admission_id: str) -> dict[str, Any]:
    """Build query for finding faculty admission by multiple fields"""
    lookup: list[dict[str, Any]] = [
        {"id": faculty_admission_id},
        {"admission_id": faculty_admission_id},
    ]
    if ObjectId.is_valid(faculty_admission_id):
        lookup.append({"_id": ObjectId(faculty_admission_id)})
    return {"$or": lookup}


@router.get("/faculty")
async def get_faculty_admissions():
    """Get all faculty admissions"""
    try:
        faculty_admissions_collection = _faculty_admissions_collection()
        data: list[dict[str, Any]] = []

        async for item in faculty_admissions_collection.find().sort("created_at", -1):
            data.append(_serialize_faculty_admission(item))

        return data
    except HTTPException as e:
        if e.status_code == 503:
            if "faculty_admissions" not in DEV_STORE:
                DEV_STORE["faculty_admissions"] = []
            data = [dict(item) for item in DEV_STORE["faculty_admissions"]]
            for item in data:
                if not item.get("id"):
                    item["id"] = item.get("admission_id") or str(item.get("_id", ""))
                if not item.get("admission_id"):
                    item["admission_id"] = item.get("id")
            return sorted(data, key=lambda x: x.get("created_at", ""), reverse=True)
        raise


@router.get("/faculty/{faculty_admission_id}")
async def get_faculty_admission(faculty_admission_id: str):
    """Get specific faculty admission by ID"""
    faculty_admissions_collection = _faculty_admissions_collection()
    
    # Try to find by multiple ID formats
    doc = None
    try:
        obj_id = ObjectId(faculty_admission_id)
        doc = await faculty_admissions_collection.find_one({"_id": obj_id})
    except:
        pass
    
    if not doc:
        doc = await faculty_admissions_collection.find_one(
            {"$or": [{"id": faculty_admission_id}, {"admission_id": faculty_admission_id}]}
        )
    
    if not doc:
        raise HTTPException(status_code=404, detail="Faculty admission not found")
    
    return _serialize_faculty_admission(doc)


@router.put("/faculty/approve/{faculty_admission_id}")
async def approve_faculty_admission(faculty_admission_id: str):
    """Approve faculty admission"""
    faculty_admissions_collection = _faculty_admissions_collection()
    
    result = await faculty_admissions_collection.update_one(
        _build_faculty_lookup_query(faculty_admission_id),
        {"$set": {"status": "Approved", "updated_at": _utc_now_iso()}},
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Faculty admission not found")
    
    return {"message": "Faculty admission approved successfully", "id": faculty_admission_id}


@router.put("/faculty/reject/{faculty_admission_id}")
async def reject_faculty_admission(faculty_admission_id: str):
    """Reject faculty admission"""
    faculty_admissions_collection = _faculty_admissions_collection()
    
    result = await faculty_admissions_collection.update_one(
        _build_faculty_lookup_query(faculty_admission_id),
        {"$set": {"status": "Rejected", "updated_at": _utc_now_iso()}},
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Faculty admission not found")
    
    return {"message": "Faculty admission rejected successfully", "id": faculty_admission_id}


@router.delete("/faculty/{faculty_admission_id}")
async def delete_faculty_admission(faculty_admission_id: str):
    """Delete faculty admission"""
    faculty_admissions_collection = _faculty_admissions_collection()
    
    result = await faculty_admissions_collection.delete_one(
        _build_faculty_lookup_query(faculty_admission_id)
    )
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Faculty admission not found")
    
    return {"message": "Faculty admission deleted successfully", "id": faculty_admission_id}