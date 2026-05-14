from typing import Any

from pydantic import BaseModel, ConfigDict


class APIResponse(BaseModel):
    success: bool = True
    message: str | None = None
    data: Any | None = None


class PaginatedResponse(APIResponse):
    count: int
    total: int
    totalPages: int
    currentPage: int


class MongoModel(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    id: str