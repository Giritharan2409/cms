from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from bson import ObjectId
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse

from backend.db import get_db
from backend.schemas.payment_schema import PaymentCreate, PaymentResponse

router = APIRouter(prefix="/payments", tags=["Payments"])


def _payments_collection():
    """Get payments collection from MongoDB"""
    return get_db()["payments"]


def _serialize_payment(item: dict[str, Any]) -> dict[str, Any]:
    """Serialize MongoDB payment document to JSON"""
    serialized = dict(item)
    if "_id" in serialized:
        serialized["_id"] = str(serialized["_id"])
    return serialized


@router.post("/create", response_model=PaymentResponse)
async def create_payment(payment: PaymentCreate):
    """
    Create a payment record in MongoDB.
    
    - **userId**: User/Student/Faculty ID
    - **amount**: Payment amount (500 for student, 1000 for faculty)
    - **type**: "APPLICATION_FEE" or "REGISTRATION_FEE"
    - **paymentMethod**: Optional payment method used
    
    Returns: Updated payment record with SUCCESS status
    """
    try:
        collection = _payments_collection()
        
        # Generate transaction ID
        transaction_id = f"TXN{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}{str(uuid4())[:8].upper()}"
        
        # Create payment document
        payment_doc = {
            "userId": payment.user_id,
            "amount": payment.amount,
            "type": payment.type,
            "status": "SUCCESS",  # Simulate success
            "transactionId": transaction_id,
            "paymentMethod": payment.payment_method,
            "createdAt": datetime.now(timezone.utc),
        }
        
        # Insert into MongoDB
        result = await collection.insert_one(payment_doc)
        
        # Fetch the inserted document
        inserted_doc = await collection.find_one({"_id": result.inserted_id})
        
        # Serialize and return
        serialized = _serialize_payment(inserted_doc)
        return PaymentResponse(**serialized)
        
    except Exception as e:
        print(f"Error creating payment: {e}")
        raise HTTPException(status_code=500, detail=f"Error creating payment: {str(e)}")


@router.get("/{payment_id}")
async def get_payment(payment_id: str):
    """Get a specific payment by ID"""
    try:
        collection = _payments_collection()
        
        # Try to find by ID string or MongoDB ObjectId
        query = {"_id": ObjectId(payment_id)} if ObjectId.is_valid(payment_id) else {"_id": payment_id}
        payment = await collection.find_one(query)
        
        if not payment:
            raise HTTPException(status_code=404, detail="Payment not found")
        
        return PaymentResponse(**_serialize_payment(payment))
        
    except Exception as e:
        print(f"Error fetching payment: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching payment: {str(e)}")


@router.get("/user/{user_id}")
async def get_user_payments(user_id: str):
    """Get all payments for a user"""
    try:
        collection = _payments_collection()
        
        payments = await collection.find({"userId": user_id}).to_list(length=100)
        
        return {
            "data": [PaymentResponse(**_serialize_payment(p)) for p in payments],
            "count": len(payments)
        }
        
    except Exception as e:
        print(f"Error fetching user payments: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching payments: {str(e)}")
