from pydantic import BaseModel
from typing import Optional, Any


class SuccessResponse(BaseModel):
    message: str
    data: Optional[Any] = None


class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None


class ErrorResponseDetail(BaseModel):
    error: str
    detail: list
