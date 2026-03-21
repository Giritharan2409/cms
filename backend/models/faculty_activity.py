from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, date

class CourseAssignment(BaseModel):
    faculty_id: str = Field(alias="facultyId")
    course_id: str = Field(alias="courseId")
    course_name: str
    semester: str
    academic_year: str
    credits: int = 0
    assigned_date: datetime = Field(default_factory=datetime.utcnow)

class PerformanceMetric(BaseModel):
    faculty_id: str = Field(alias="facultyId")
    semester: str
    academic_year: str
    student_feedback_score: float = 0.0  # e.g., out of 5.0
    course_completion_rate: float = 0.0  # percentage 0-100
    attendance_rate: float = 0.0         # percentage 0-100
    recorded_date: datetime = Field(default_factory=datetime.utcnow)

class ProfessionalDevelopment(BaseModel):
    faculty_id: str = Field(alias="facultyId")
    activity_type: str  # Training, Conference, Workshop, Certification
    title: str
    date: str
    location: Optional[str] = None
    description: Optional[str] = None
    status: str = "Completed" # Planned, In-Progress, Completed
    credits_earned: Optional[float] = None
