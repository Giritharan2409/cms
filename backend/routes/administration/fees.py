from datetime import date, datetime
from typing import Any, Optional

from fastapi import APIRouter, HTTPException, Query

from backend.db import get_db
from backend.dev_store import DEV_STORE, save_dev_store
from backend.schemas.common import NotificationCreate
from backend.schemas.fees_schema import (
    FeeAssignCreate,
    FeeAssignLegacy,
    FeeDeleteRequest,
    FeePaymentCreate,
    FeeTemplateCreate,
)
from backend.utils.fee_calculator import calculate_fee
from backend.utils.mongo import parse_object_id, serialize_doc

router = APIRouter(prefix="/fees", tags=["Fees"])

FEE_STATUS_ASSIGNED = "Assigned"
FEE_STATUS_PARTIAL = "Partially Paid"
FEE_STATUS_PAID = "Paid"
FEE_STATUS_OVERDUE = "Overdue"


def _ensure_dev_fees_store() -> None:
    DEV_STORE.setdefault("fee_templates", [])
    DEV_STORE.setdefault("fees_assignments", [])
    DEV_STORE.setdefault("notifications", [])


def _dev_make_id(prefix: str) -> str:
    return f"{prefix}_{int(datetime.utcnow().timestamp() * 1000)}"


def _normalize_date(value: Any) -> date:
    if isinstance(value, date):
        return value
    if isinstance(value, datetime):
        return value.date()
    if not value:
        return date.today()
    try:
        return date.fromisoformat(str(value)[:10])
    except ValueError as error:
        raise HTTPException(status_code=400, detail="Invalid date format, expected YYYY-MM-DD") from error


def _compute_late_fee(due_date: date, due_amount: float, late_fee_per_day: float) -> float:
    if due_amount <= 0:
        return 0.0
    today = date.today()
    if today <= due_date:
        return 0.0
    late_days = (today - due_date).days
    return round(late_days * max(late_fee_per_day, 0), 2)


def _compute_status(due_date: date, paid_amount: float, total_amount_with_late: float) -> str:
    if paid_amount >= total_amount_with_late:
        return FEE_STATUS_PAID
    if paid_amount > 0:
        if date.today() > due_date:
            return FEE_STATUS_OVERDUE
        return FEE_STATUS_PARTIAL
    if date.today() > due_date:
        return FEE_STATUS_OVERDUE
    return FEE_STATUS_ASSIGNED


def _hydrate_assignment(doc: dict[str, Any]) -> dict[str, Any]:
    assignment = serialize_doc(doc) or {}

    due_date = _normalize_date(assignment.get("dueDate"))
    assigned_date = _normalize_date(assignment.get("assignedDate"))
    total_amount = float(assignment.get("totalAmount") or 0)
    paid_amount = float(assignment.get("paidAmount") or 0)
    late_fee_per_day = float(assignment.get("lateFeePerDay") or 0)

    late_fee_amount = _compute_late_fee(due_date, max(total_amount - paid_amount, 0), late_fee_per_day)
    due_amount = round(max(total_amount + late_fee_amount - paid_amount, 0), 2)
    status = _compute_status(due_date, paid_amount, total_amount + late_fee_amount)

    assignment["dueDate"] = due_date.isoformat()
    assignment["assignedDate"] = assigned_date.isoformat()
    assignment["lateFeeAmount"] = late_fee_amount
    assignment["paidAmount"] = round(paid_amount, 2)
    assignment["dueAmount"] = due_amount
    assignment["status"] = status
    assignment["transactions"] = assignment.get("transactions", [])
    assignment["isDeleted"] = bool(assignment.get("isDeleted", False))
    assignment["breakdown"] = assignment.get("breakdown", {})

    return assignment


async def _sync_assignment_state(db, assignment_id: str, assignment: dict[str, Any]) -> dict[str, Any]:
    update_fields = {
        "paidAmount": assignment["paidAmount"],
        "dueAmount": assignment["dueAmount"],
        "lateFeeAmount": assignment["lateFeeAmount"],
        "status": assignment["status"],
        "updatedAt": datetime.utcnow(),
    }
    await db["fees_assignments"].update_one(
        {"_id": parse_object_id(assignment_id)},
        {"$set": update_fields},
    )
    return assignment


async def _create_notification(
    db,
    title: str,
    message: str,
    action_id: Optional[str] = None,
    related_data: Optional[dict[str, Any]] = None,
):
    payload = NotificationCreate(
        title=title,
        message=message,
        senderRole="admin",
        receiverRole="student",
        module="fees",
        priority="medium",
        actionId=action_id,
    )
    doc = payload.model_dump()
    doc["status"] = "unread"
    doc["relatedData"] = related_data or {}
    await db["notifications"].insert_one(doc)


@router.post("/templates")
async def create_fee_template(payload: FeeTemplateCreate):
    try:
        db = get_db()
        doc = {
            "name": payload.name,
            "course": payload.course,
            "breakdown": payload.breakdown.model_dump(),
            "totalAmount": round(payload.breakdown.total, 2),
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow(),
        }
        result = await db["fee_templates"].insert_one(doc)
        created = await db["fee_templates"].find_one({"_id": result.inserted_id})
        return {"message": "Fee template created", "data": serialize_doc(created)}
    except HTTPException as error:
        if error.status_code == 503:
            _ensure_dev_fees_store()
            doc = {
                "id": _dev_make_id("template"),
                "name": payload.name,
                "course": payload.course,
                "breakdown": payload.breakdown.model_dump(),
                "totalAmount": round(payload.breakdown.total, 2),
                "createdAt": datetime.utcnow().isoformat(),
                "updatedAt": datetime.utcnow().isoformat(),
            }
            DEV_STORE["fee_templates"].insert(0, doc)
            save_dev_store()
            return {"message": "Fee template created (Dev Store)", "data": doc}
        raise


@router.get("/templates")
async def list_fee_templates(
    course: Optional[str] = Query(default=None),
):
    try:
        db = get_db()
        query: dict[str, Any] = {}
        if course:
            query["course"] = {"$regex": course, "$options": "i"}

        templates = []
        async for item in db["fee_templates"].find(query).sort("createdAt", -1):
            templates.append(serialize_doc(item))

        return {"data": templates, "count": len(templates)}
    except HTTPException as error:
        if error.status_code == 503:
            _ensure_dev_fees_store()
            templates = list(DEV_STORE["fee_templates"])
            if course:
                needle = course.lower()
                templates = [t for t in templates if needle in str(t.get("course", "")).lower()]
            return {"data": templates, "count": len(templates)}
        raise


@router.post("/assignments")
async def create_fee_assignments(payload: FeeAssignCreate):
    try:
        db = get_db()

        template = None
        breakdown: dict[str, Any] = {}
        total_amount = payload.totalAmount

        if payload.feeTemplateId:
            template = await db["fee_templates"].find_one({"_id": parse_object_id(payload.feeTemplateId)})
            if not template:
                raise HTTPException(status_code=404, detail="Fee template not found")
            breakdown = template.get("breakdown", {})
            total_amount = float(template.get("totalAmount") or 0)
        elif payload.breakdown:
            breakdown = payload.breakdown.model_dump()
            total_amount = float(payload.totalAmount if payload.totalAmount is not None else payload.breakdown.total)
        else:
            breakdown = {}
            total_amount = float(payload.totalAmount or 0)

        if total_amount <= 0:
            raise HTTPException(status_code=400, detail="Total amount must be greater than zero")

        assigned_date = payload.assignedDate or date.today()
        created_docs = []

        for student in payload.students:
            doc = {
                "studentId": student.studentId,
                "studentName": student.studentName,
                "academicYear": payload.academicYear,
                "course": payload.course,
                "feeTemplateId": payload.feeTemplateId,
                "feeTemplateName": template.get("name") if template else None,
                "breakdown": breakdown,
                "totalAmount": round(total_amount, 2),
                "paidAmount": 0.0,
                "dueAmount": round(total_amount, 2),
                "dueDate": payload.dueDate.isoformat(),
                "assignedDate": assigned_date.isoformat(),
                "lateFeePerDay": payload.lateFeePerDay,
                "lateFeeAmount": 0.0,
                "status": FEE_STATUS_ASSIGNED,
                "transactions": [],
                "isDeleted": False,
                "deletedAt": None,
                "deletedReason": None,
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow(),
            }
            result = await db["fees_assignments"].insert_one(doc)
            created = await db["fees_assignments"].find_one({"_id": result.inserted_id})
            hydrated = _hydrate_assignment(created)
            await _sync_assignment_state(db, hydrated["id"], hydrated)
            created_docs.append(hydrated)

            await _create_notification(
                db,
                title="Fee Assigned",
                message=f"Fee of Rs.{hydrated['totalAmount']} assigned for {hydrated['academicYear']} - {hydrated['course']}",
                action_id=hydrated["id"],
            )

        return {
            "message": "Fee assignment completed",
            "count": len(created_docs),
            "data": created_docs,
        }
    except HTTPException as error:
        if error.status_code == 503:
            _ensure_dev_fees_store()

            template = None
            breakdown: dict[str, Any] = {}
            total_amount = payload.totalAmount

            if payload.feeTemplateId:
                template = next((t for t in DEV_STORE["fee_templates"] if str(t.get("id")) == str(payload.feeTemplateId)), None)
                if not template:
                    raise HTTPException(status_code=404, detail="Fee template not found")
                breakdown = template.get("breakdown", {})
                total_amount = float(template.get("totalAmount") or 0)
            elif payload.breakdown:
                breakdown = payload.breakdown.model_dump()
                total_amount = float(payload.totalAmount if payload.totalAmount is not None else payload.breakdown.total)
            else:
                total_amount = float(payload.totalAmount or 0)

            if total_amount <= 0:
                raise HTTPException(status_code=400, detail="Total amount must be greater than zero")

            assigned_date = payload.assignedDate or date.today()
            created_docs = []
            for student in payload.students:
                doc = {
                    "id": _dev_make_id("fee"),
                    "studentId": student.studentId,
                    "studentName": student.studentName,
                    "academicYear": payload.academicYear,
                    "course": payload.course,
                    "feeTemplateId": payload.feeTemplateId,
                    "feeTemplateName": template.get("name") if template else None,
                    "breakdown": breakdown,
                    "totalAmount": round(total_amount, 2),
                    "paidAmount": 0.0,
                    "dueAmount": round(total_amount, 2),
                    "dueDate": payload.dueDate.isoformat(),
                    "assignedDate": assigned_date.isoformat(),
                    "lateFeePerDay": payload.lateFeePerDay,
                    "lateFeeAmount": 0.0,
                    "status": FEE_STATUS_ASSIGNED,
                    "transactions": [],
                    "isDeleted": False,
                    "deletedAt": None,
                    "deletedReason": None,
                    "createdAt": datetime.utcnow().isoformat(),
                    "updatedAt": datetime.utcnow().isoformat(),
                }
                DEV_STORE["fees_assignments"].insert(0, doc)
                created_docs.append(_hydrate_assignment(doc))

            save_dev_store()
            return {
                "message": "Fee assignment completed (Dev Store)",
                "count": len(created_docs),
                "data": created_docs,
            }
        raise


@router.get("/assignments")
async def list_fee_assignments(
    status: Optional[str] = Query(default=None),
    course: Optional[str] = Query(default=None),
    academicYear: Optional[str] = Query(default=None),
    search: Optional[str] = Query(default=None),
    includeDeleted: bool = Query(default=False),
):
    try:
        db = get_db()
        query: dict[str, Any] = {}

        if not includeDeleted:
            query["isDeleted"] = {"$ne": True}
        if academicYear:
            query["academicYear"] = academicYear
        if course:
            query["course"] = {"$regex": course, "$options": "i"}
        if search:
            query["studentName"] = {"$regex": search, "$options": "i"}

        data = []
        async for item in db["fees_assignments"].find(query).sort("createdAt", -1):
            assignment = _hydrate_assignment(item)
            if status and assignment["status"].lower() != status.lower():
                continue
            await _sync_assignment_state(db, assignment["id"], assignment)
            data.append(assignment)

        return {"data": data, "count": len(data)}
    except HTTPException as error:
        if error.status_code == 503:
            _ensure_dev_fees_store()
            data = []
            for item in DEV_STORE["fees_assignments"]:
                if not includeDeleted and item.get("isDeleted"):
                    continue
                if academicYear and item.get("academicYear") != academicYear:
                    continue
                if course and course.lower() not in str(item.get("course", "")).lower():
                    continue
                if search and search.lower() not in str(item.get("studentName", "")).lower():
                    continue
                assignment = _hydrate_assignment(item)
                if status and assignment["status"].lower() != status.lower():
                    continue
                data.append(assignment)
            data = sorted(data, key=lambda x: x.get("createdAt", ""), reverse=True)
            return {"data": data, "count": len(data)}
        raise


@router.get("/assignments/{fee_id}")
async def get_fee_assignment(fee_id: str):
    db = get_db()
    doc = await db["fees_assignments"].find_one({"_id": parse_object_id(fee_id)})
    if not doc or doc.get("isDeleted"):
        raise HTTPException(status_code=404, detail="Fee assignment not found")

    assignment = _hydrate_assignment(doc)
    await _sync_assignment_state(db, assignment["id"], assignment)
    return {"data": assignment}


@router.post("/assignments/{fee_id}/payments")
async def add_fee_payment(fee_id: str, payload: FeePaymentCreate):
    db = get_db()
    doc = await db["fees_assignments"].find_one({"_id": parse_object_id(fee_id)})
    if not doc or doc.get("isDeleted"):
        raise HTTPException(status_code=404, detail="Fee assignment not found")

    assignment = _hydrate_assignment(doc)

    transaction_date = (payload.date or date.today()).isoformat()
    transaction = {
        "id": f"TXN-{int(datetime.utcnow().timestamp() * 1000)}",
        "amount": round(payload.amount, 2),
        "paymentMethod": payload.paymentMethod,
        "transactionId": payload.transactionId,
        "date": transaction_date,
    }

    updated_paid = round(float(assignment.get("paidAmount", 0)) + transaction["amount"], 2)
    total_with_late = round(float(assignment.get("totalAmount", 0)) + float(assignment.get("lateFeeAmount", 0)), 2)
    if updated_paid > total_with_late:
        raise HTTPException(status_code=400, detail="Payment exceeds payable amount")

    transactions = assignment.get("transactions", [])
    transactions.append(transaction)

    assignment["transactions"] = transactions
    assignment["paidAmount"] = updated_paid
    assignment["dueAmount"] = round(max(total_with_late - updated_paid, 0), 2)

    due_date = _normalize_date(assignment.get("dueDate"))
    assignment["status"] = _compute_status(due_date, assignment["paidAmount"], total_with_late)

    await db["fees_assignments"].update_one(
        {"_id": parse_object_id(fee_id)},
        {
            "$set": {
                "transactions": transactions,
                "paidAmount": assignment["paidAmount"],
                "dueAmount": assignment["dueAmount"],
                "status": assignment["status"],
                "updatedAt": datetime.utcnow(),
            }
        },
    )

    if assignment["status"] == FEE_STATUS_PAID:
        await _create_notification(
            db,
            title="Payment Completed",
            message=f"Payment completed for {assignment['studentName']} ({assignment.get('academicYear', 'N/A')})",
            action_id=fee_id,
        )

    return {
        "message": "Payment recorded",
        "transaction": transaction,
        "data": assignment,
    }


@router.get("/assignments/{fee_id}/transactions")
async def list_fee_transactions(fee_id: str):
    db = get_db()
    doc = await db["fees_assignments"].find_one({"_id": parse_object_id(fee_id)})
    if not doc or doc.get("isDeleted"):
        raise HTTPException(status_code=404, detail="Fee assignment not found")

    assignment = _hydrate_assignment(doc)
    return {
        "feeId": fee_id,
        "studentId": assignment.get("studentId"),
        "studentName": assignment.get("studentName"),
        "transactions": assignment.get("transactions", []),
    }


@router.delete("/assignments/{fee_id}")
async def delete_fee_assignment(fee_id: str, payload: FeeDeleteRequest):
    db = get_db()

    if payload.softDelete:
        updated = await db["fees_assignments"].find_one_and_update(
            {"_id": parse_object_id(fee_id)},
            {
                "$set": {
                    "isDeleted": True,
                    "deletedAt": datetime.utcnow().isoformat(),
                    "deletedReason": payload.reason,
                    "updatedAt": datetime.utcnow(),
                }
            },
        )
        if not updated:
            raise HTTPException(status_code=404, detail="Fee assignment not found")
        return {"message": "Fee assignment archived"}

    result = await db["fees_assignments"].delete_one({"_id": parse_object_id(fee_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Fee assignment not found")
    return {"message": "Fee assignment deleted"}


@router.post("/send-overdue-reminders")
async def send_overdue_reminders():
    db = get_db()
    sent = 0
    today_key = date.today().isoformat()

    async for item in db["fees_assignments"].find({"isDeleted": {"$ne": True}}):
        assignment = _hydrate_assignment(item)
        await _sync_assignment_state(db, assignment["id"], assignment)

        if assignment["status"] == FEE_STATUS_OVERDUE:
            already_sent = await db["notifications"].find_one(
                {
                    "title": "Due Reminder",
                    "actionId": assignment["id"],
                    "relatedData.reminderDate": today_key,
                }
            )
            if already_sent:
                continue
            await _create_notification(
                db,
                title="Due Reminder",
                message=f"Fee due reminder for {assignment['studentName']} - amount due Rs.{assignment['dueAmount']}",
                action_id=assignment["id"],
                related_data={"reminderDate": today_key},
            )
            sent += 1

    return {"message": "Overdue reminders processed", "sent": sent}


# Legacy endpoint retained for compatibility
@router.post("/assign")
async def assign_fee_legacy(data: FeeAssignLegacy):
    db = get_db()

    fee = calculate_fee(data.first_graduate, data.hostel_required)
    today = date.today().isoformat()

    record = {
        "studentId": data.student_id,
        "studentName": data.student_name,
        "course": data.course,
        "semester": str(data.semester),
        "feeTemplateId": None,
        "feeTemplateName": "Legacy Formula",
        "breakdown": {
            "tuitionFee": fee["semester_fee"],
            "hostelFee": fee["hostel_fee"],
            "examFee": fee["exam_fee"],
            "miscFee": fee["book_fee"] + fee["misc_fee"],
        },
        "totalAmount": fee["total"],
        "paidAmount": 0,
        "dueAmount": fee["total"],
        "dueDate": today,
        "assignedDate": today,
        "lateFeePerDay": 100,
        "lateFeeAmount": 0,
        "status": FEE_STATUS_ASSIGNED,
        "transactions": [],
        "isDeleted": False,
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow(),
    }

    result = await db["fees_assignments"].insert_one(record)
    created = await db["fees_assignments"].find_one({"_id": result.inserted_id})
    assignment = _hydrate_assignment(created)

    return {
        "message": "Fee assigned successfully",
        "id": assignment["id"],
        "total": assignment["totalAmount"],
        "data": assignment,
    }
