from typing import Any

from bson import ObjectId
from bson.errors import InvalidId

from app.core.exceptions import AppError


def to_object_id(value: str) -> ObjectId:
    try:
        return ObjectId(value)
    except (InvalidId, TypeError) as exc:
        raise AppError(status_code=400, message=f"Invalid ID: {value}") from exc


def serialize_doc(doc: dict[str, Any] | None) -> dict[str, Any] | None:
    if not doc:
        return None
    result = dict(doc)
    if "_id" in result:
        result["id"] = str(result.pop("_id"))
    for key in ["owner", "user", "userId", "pg", "reportedBy", "relatedId", "reviewedBy"]:
        if key in result and isinstance(result[key], ObjectId):
            result[key] = str(result[key])
    if "savedPGs" in result:
        result["savedPGs"] = [str(item) if isinstance(item, ObjectId) else item for item in result["savedPGs"]]
    return result


def serialize_many(docs: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [serialize_doc(doc) for doc in docs]