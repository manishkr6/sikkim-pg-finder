from app.core.exceptions import AppError
from app.models import collections
from app.services.notification_service import create_notification
from app.utils.bson_utils import serialize_doc, to_object_id
from app.utils.datetime_utils import utc_now


async def report_pg_controller(db, pg_id: str, payload, current_user):
    pg_object_id = to_object_id(pg_id)
    pg = await db[collections.PGS].find_one({"_id": pg_object_id})
    if not pg or pg.get("isDeleted"):
        raise AppError(status_code=404, message="PG not found")

    now = utc_now()
    doc = {
        "pg": pg_object_id,
        "reportedBy": to_object_id(current_user["id"]),
        "reason": payload.reason.strip(),
        "status": "pending",
        "createdAt": now,
        "updatedAt": now,
    }
    result = await db[collections.REPORTS].insert_one(doc)
    doc["_id"] = result.inserted_id

    await create_notification(
        db,
        message=f"PG reported: \"{pg['title']}\" - {payload.reason[:60]}",
        notification_type="REPORT_PG",
        user_id=to_object_id(current_user["id"]),
        related_id=pg_object_id,
    )

    return {"success": True, "message": "Report submitted", "data": serialize_doc(doc)}