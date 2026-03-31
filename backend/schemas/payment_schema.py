from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class PaymentCreate(BaseModel):
    """Schema for creating a payment"""
    user_id: str = Field(..., alias="userId")
    amount: float
    type: str  # "APPLICATION_FEE" or "REGISTRATION_FEE"
    payment_method: Optional[str] = Field(default=None, alias="paymentMethod")
    
    class Config:
        populate_by_name = True


class PaymentResponse(BaseModel):
    """Schema for payment response"""
    id: Optional[str] = None
    user_id: str = Field(alias="userId")
    amount: float
    type: str
    status: str
    created_at: datetime = Field(alias="createdAt")
    transaction_id: Optional[str] = Field(default=None, alias="transactionId")
    payment_method: Optional[str] = Field(default=None, alias="paymentMethod")
    
    class Config:
        populate_by_name = True
