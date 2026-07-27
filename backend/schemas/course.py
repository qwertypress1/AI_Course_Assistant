from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime


class CreateCourseRequest(BaseModel):
    name: str
    code: str
    description: Optional[str] = None

    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    from pydantic import field_validator

    @field_validator("code")
    @classmethod
    def code_valid(cls, v: str) -> str:
        import re
        v = v.strip().upper()
        if len(v) < 2 or len(v) > 50:
            raise ValueError("Course code must be 2–50 characters")
        if not re.match(r"^[A-Z0-9]+$", v):
            raise ValueError("Course code must be uppercase alphanumeric only")
        return v


class CourseResponse(BaseModel):
    id: UUID
    name: str
    code: str
    description: Optional[str]
    created_by: UUID
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class EnrollRequest(BaseModel):
    course_id: UUID
    role: str = "student"
