from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class Payment(BaseModel):
    """Payment model for storing payment records in MongoDB"""
    user_id: str = Field(alias="userId")
    amount: float
    type: str  # "APPLICATION_FEE" or "REGISTRATION_FEE"
    status: str = "PENDING"  # "PENDING", "SUCCESS", "FAILED"
    created_at: datetime = Field(default_factory=datetime.utcnow, alias="createdAt")
    transaction_id: Optional[str] = Field(default=None, alias="transactionId")
    payment_method: Optional[str] = Field(default=None, alias="paymentMethod")
    
    class Config:
        populate_by_name = True
