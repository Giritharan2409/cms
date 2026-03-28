from datetime import date
from typing import Literal, Optional

from pydantic import BaseModel, Field, field_validator, model_validator


class FeeBreakdown(BaseModel):
    tuitionFee: float = 0
    hostelFee: float = 0
    examFee: float = 0
    miscFee: float = 0

    @property
    def total(self) -> float:
        return self.tuitionFee + self.hostelFee + self.examFee + self.miscFee


class FeeTemplateCreate(BaseModel):
    name: str
    course: str
    breakdown: FeeBreakdown


class FeeAssignTarget(BaseModel):
    studentId: str
    studentName: str


class FeeAssignCreate(BaseModel):
    students: list[FeeAssignTarget]
    academicYear: str
    course: str
    feeTemplateId: Optional[str] = None
    breakdown: Optional[FeeBreakdown] = None
    totalAmount: Optional[float] = Field(default=None, ge=0)
    dueDate: date
    assignedDate: Optional[date] = None
    lateFeePerDay: float = Field(default=100, ge=0)

    @model_validator(mode="after")
    def validate_source(self):
        if not self.feeTemplateId and not self.breakdown and self.totalAmount is None:
            raise ValueError("Provide feeTemplateId or breakdown or totalAmount")
        return self


class FeeAssignLegacy(BaseModel):
    student_id: str
    student_name: str
    course: str
    semester: int
    first_graduate: bool = False
    hostel_required: bool = False


class FeePaymentCreate(BaseModel):
    amount: float = Field(gt=0)
    paymentMethod: Literal["UPI", "Card", "Net Banking"]
    transactionId: str
    date: Optional[date] = None


class StudentFeeRecordCreate(BaseModel):
    studentId: str
    studentName: str
    feeType: Literal["tuition", "exam", "hostel", "transport", "fine"]
    amount: float = Field(gt=0)
    dueDate: date
    academicYear: Optional[str] = None
    course: Optional[str] = None
    notes: Optional[str] = None
    lateFeePerDay: float = Field(default=0, ge=0)


class StudentFeeRecordUpdate(BaseModel):
    studentName: Optional[str] = None
    feeType: Optional[Literal["tuition", "exam", "hostel", "transport", "fine"]] = None
    amount: Optional[float] = Field(default=None, gt=0)
    dueDate: Optional[date] = None
    academicYear: Optional[str] = None
    course: Optional[str] = None
    notes: Optional[str] = None
    lateFeePerDay: Optional[float] = Field(default=None, ge=0)


class FeeDeleteRequest(BaseModel):
    reason: Optional[str] = None
    softDelete: bool = True


class FeeListFilters(BaseModel):
    status: Optional[str] = None
    course: Optional[str] = None
    semester: Optional[str] = None
    search: Optional[str] = None
    includeDeleted: bool = False

    @field_validator("status")
    @classmethod
    def normalize_status(cls, value: Optional[str]):
        return value.strip() if value else value