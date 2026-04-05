from typing import Any


def paginated_response(*, data: list[dict[str, Any]], total: int, page: int, limit: int, extra: dict[str, Any] | None = None) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "success": True,
        "count": len(data),
        "total": total,
        "totalPages": (total + limit - 1) // limit if limit else 1,
        "currentPage": page,
        "data": data,
    }
    if extra:
        payload.update(extra)
    return payload