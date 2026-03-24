from fastapi import APIRouter, HTTPException
from datetime import datetime
import uuid
from bson import ObjectId

from backend.db import get_db

router = APIRouter(prefix="/invoices", tags=["Invoices"])


@router.post("/generate/{fee_id}")
async def generate_invoice(fee_id: str):

    db = get_db()

    fees_structure_collection = db["fees_structure"]
    fees_collection = db["fees"]
    invoices_collection = db["invoices"]

    if not ObjectId.is_valid(fee_id):
        raise HTTPException(status_code=400, detail="Invalid fee id")

    fee = await fees_structure_collection.find_one({"_id": ObjectId(fee_id)})
    if not fee:
        fee = await fees_collection.find_one({"_id": ObjectId(fee_id)})
    if not fee:
        raise HTTPException(status_code=404, detail="Fee record not found")

    invoice_id = "INV" + str(uuid.uuid4())[:8]

    invoice = {
        "invoice_id": invoice_id,
        "student_id": fee["student_id"],
        "student_name": fee["student_name"],
        "total_amount": fee["total_fee"],
        "payment_status": "Pending",
        "generated_date": datetime.now()
    }

    await invoices_collection.insert_one(invoice)

    return {
        "message": "Invoice generated",
        "invoice_id": invoice_id
    }