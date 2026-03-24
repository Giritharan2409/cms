from pydantic import BaseModel, Field


class Faculty(BaseModel):
    name: str
    email: str
    phone: str = ""
    department_id: str = Field(alias="departmentId")
    designation: str = ""
