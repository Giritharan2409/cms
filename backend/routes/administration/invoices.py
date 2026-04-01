from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime
import uuid
from typing import List, Optional
from bson import ObjectId

from backend.db import get_db
from backend.dev_store import DEV_STORE, save_dev_store
from backend.utils.mongo import parse_object_id, serialize_doc
from backend.schemas.invoice import InvoiceUpdate, InvoiceResponse, InvoiceCreate
from backend.utils.invoice_utils import create_invoice_from_payroll

router = APIRouter(prefix="/api/invoices", tags=["Invoices"])


def _build_fee_invoice_doc(fee_id: str, assignment: dict):
    breakdown = assignment.get("breakdown") or {}
    transactions = assignment.get("transactions") or []
    latest_transaction = transactions[-1] if transactions else {}

    tuition_fee = float(breakdown.get("tuitionFee") or 0)
    hostel_fee = float(breakdown.get("hostelFee") or 0)
    exam_fee = float(breakdown.get("examFee") or 0)
    misc_fee = float(breakdown.get("miscFee") or 0)
    late_fee = float(assignment.get("lateFeeAmount") or 0)

    total_amount = round(
        float(assignment.get("totalAmount") or 0) + late_fee,
        2,
    )

    items = [
        {"description": "Tuition Fee", "amount": tuition_fee},
        {"description": "Hostel Fee", "amount": hostel_fee},
        {"description": "Exam Fee", "amount": exam_fee},
        {"description": "Misc Fee", "amount": misc_fee},
    ]
    if late_fee > 0:
        items.append({"description": "Late Fee", "amount": late_fee})

    is_paid = str(assignment.get("status") or "").lower() == "paid"
    paid_date = latest_transaction.get("date") if is_paid else None

    return {
        "invoice_id": "INV-FEE-" + str(uuid.uuid4())[:8].upper(),
        "fee_assignment_id": fee_id,
        "student_id": assignment.get("studentId") or "",
        "student_name": assignment.get("studentName") or "",
        "course": assignment.get("course") or "",
        "academic_year": assignment.get("academicYear") or "",
        "total_amount": total_amount,
        "payment_status": "Paid" if is_paid else "Pending",
        "payment_method": latest_transaction.get("paymentMethod") or None,
        "transaction_id": latest_transaction.get("transactionId") or None,
        "paid_date": paid_date,
        "generated_date": datetime.utcnow(),
        "items": items,
        "generated_from": "fees",
    }

@router.get("", response_model=List[dict])
async def get_invoices():
    db = get_db()
    invoices = []
    async for inv in db["invoices"].find().sort("generated_date", -1):
        invoices.append(serialize_doc(inv))
    return invoices

@router.post("/generate-from-payroll/{payroll_id}")
async def generate_invoice_from_payroll(payroll_id: str):
    db = get_db()
    
    # Check if payroll record exists
    oid = parse_object_id(payroll_id)
    payroll = await db["payroll"].find_one({"_id": oid})
    if not payroll:
        raise HTTPException(status_code=404, detail="Payroll record not found")
    
    invoice = await create_invoice_from_payroll(db, payroll_id, payroll)
    return serialize_doc(invoice)


@router.post("/generate-from-fee-assignment/{fee_id}")
async def generate_invoice_from_fee_assignment(fee_id: str):
    try:
        db = get_db()

        fee_query = {"_id": ObjectId(fee_id)} if ObjectId.is_valid(fee_id) else {"id": fee_id}
        assignment = await db["fees_assignments"].find_one(fee_query)
        if not assignment or assignment.get("isDeleted"):
            raise HTTPException(status_code=404, detail="Fee assignment not found")

        existing_invoice = await db["invoices"].find_one({"fee_assignment_id": fee_id})
        if existing_invoice:
            return serialize_doc(existing_invoice)

        invoice_doc = _build_fee_invoice_doc(fee_id, assignment)
        result = await db["invoices"].insert_one(invoice_doc)
        created = await db["invoices"].find_one({"_id": result.inserted_id})
        return serialize_doc(created)
    except HTTPException as error:
        if error.status_code == 503:
            DEV_STORE.setdefault("fees_assignments", [])
            DEV_STORE.setdefault("invoices", [])

            assignment = next(
                (item for item in DEV_STORE["fees_assignments"] if str(item.get("id")) == str(fee_id) and not item.get("isDeleted")),
                None,
            )
            if not assignment:
                raise HTTPException(status_code=404, detail="Fee assignment not found")

            existing_invoice = next(
                (inv for inv in DEV_STORE["invoices"] if str(inv.get("fee_assignment_id")) == str(fee_id)),
                None,
            )
            if existing_invoice:
                return existing_invoice

            invoice_doc = _build_fee_invoice_doc(fee_id, assignment)
            invoice_doc["id"] = invoice_doc["invoice_id"]
            DEV_STORE["invoices"].insert(0, invoice_doc)
            save_dev_store()
            return invoice_doc
        raise

@router.patch("/{invoice_id}/status")
async def update_invoice_status(invoice_id: str, update: InvoiceUpdate):
    db = get_db()
    oid = parse_object_id(invoice_id)
    
    # Find active invoice
    invoice = await db["invoices"].find_one({"_id": oid})
    if not invoice:
        # Try finding by invoice_id string if _id fails
        invoice = await db["invoices"].find_one({"invoice_id": invoice_id})
        if not invoice:
            raise HTTPException(status_code=404, detail="Invoice not found")
        oid = invoice["_id"]

    update_data = update.model_dump(exclude_unset=True)
    
    # Status transition logic (optional validation could go here)
    # Draft -> Processing -> Paid
    
    result = await db["invoices"].find_one_and_update(
        {"_id": oid},
        {"$set": update_data},
        return_document=True
    )
    
    # Update synchronized payroll status if linked
    if invoice.get("payroll_id"):
        payroll_id = invoice["payroll_id"]
        try:
            p_oid = parse_object_id(payroll_id)
            sync_res = await db["payroll"].update_one(
                {"_id": p_oid},
                {"$set": {"status": update.payment_status}}
            )
            if sync_res.matched_count > 0:
                print(f"Synchronized Payroll {payroll_id} status to {update.payment_status} (Modified: {sync_res.modified_count})")
            else:
                print(f"WARNING: Linked Payroll {payroll_id} not found during sync.")
        except Exception as e:
            print(f"ERROR: Failed to sync payroll status: {e}")

    return serialize_doc(result)

@router.delete("/{invoice_id}")
async def delete_invoice(invoice_id: str):
    db = get_db()
    try:
        oid = parse_object_id(invoice_id)
        result = await db["invoices"].delete_one({"_id": oid})
    except:
        result = await db["invoices"].delete_one({"invoice_id": invoice_id})
        
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Invoice not found")
        
    return {"message": "Invoice deleted"}