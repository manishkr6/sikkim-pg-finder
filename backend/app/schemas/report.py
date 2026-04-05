from pydantic import BaseModel, Field


class ReportCreateRequest(BaseModel):
    reason: str = Field(min_length=10, max_length=500)


class ReportUpdateRequest(BaseModel):
    status: str