from app.core.exceptions import AppError
from app.models import collections
from app.services.cloudinary_service import delete_images
from app.services.notification_service import create_notification
from app.utils.bson_utils import serialize_doc, serialize_many, to_object_id
from app.utils.datetime_utils import utc_now


async def get_owner_pgs_controller(db, current_user):
    cursor = db[collections.PGS].find({"owner": to_object_id(current_user["id"])}).sort("createdAt", -1)
    pgs = await cursor.to_list(length=1000)
    data = serialize_many(pgs)
    return {"success": True, "count": len(data), "data": data}


async def create_pg_controller(db, payload, current_user):
    now = utc_now()
    doc = {
        "title": payload.title,
        "description": payload.description,
        "price": payload.price,
        "location": {"city": payload.city, "area": payload.area, "address": payload.address},
        "roomType": payload.roomType.value,
        "genderPreference": payload.genderPreference.value,
        "amenities": payload.amenities,
        "rules": payload.rules,
        "images": payload.images,
        "contactNumber": payload.contactNumber,
        "owner": to_object_id(current_user["id"]),
        # Owner-approved users can list PGs directly.
        "status": "approved",
        "rejectionReason": "",
        "isDeleted": False,
        "averageRating": 0,
        "totalReviews": 0,
        "createdAt": now,
        "updatedAt": now,
    }
    result = await db[collections.PGS].insert_one(doc)
    doc["_id"] = result.inserted_id

    await create_notification(
        db,
        message=f"New PG listed by owner: {payload.title} by {current_user['name']}",
        notification_type="ADD_PG",
        user_id=to_object_id(current_user["id"]),
        related_id=result.inserted_id,
    )

    return {"success": True, "message": "PG listed successfully", "data": serialize_doc(doc)}


async def update_pg_controller(db, pg_id: str, payload, current_user):
    pg = await db[collections.PGS].find_one({"_id": to_object_id(pg_id)})
    if not pg:
        raise AppError(status_code=404, message="PG not found")
    if str(pg.get("owner")) != current_user["id"] and current_user.get("role") != "admin":
        raise AppError(status_code=403, message="Not authorized to edit this PG")
    if pg.get("isDeleted"):
        raise AppError(status_code=404, message="PG has been deleted")

    updates = {}
    if payload.title is not None:
        updates["title"] = payload.title
    if payload.description is not None:
        updates["description"] = payload.description
    if payload.price is not None:
        updates["price"] = payload.price
    if payload.roomType is not None:
        updates["roomType"] = payload.roomType.value
    if payload.genderPreference is not None:
        updates["genderPreference"] = payload.genderPreference.value
    if payload.amenities is not None:
        updates["amenities"] = payload.amenities
    if payload.rules is not None:
        updates["rules"] = payload.rules
    if payload.contactNumber is not None:
        updates["contactNumber"] = payload.contactNumber

    location = pg.get("location", {})
    if payload.city is not None:
        location["city"] = payload.city
    if payload.area is not None:
        location["area"] = payload.area
    if payload.address is not None:
        location["address"] = payload.address
    updates["location"] = location

    images = pg.get("images", [])
    if payload.removeImages:
        await delete_images(payload.removeImages)
        images = [img for img in images if img not in payload.removeImages]
    if payload.images:
        images = (images + payload.images)[:6]
    updates["images"] = images

    # Any edit must be approved by admin.
    updates["status"] = "pending_update"
    updates["updatedAt"] = utc_now()

    await db[collections.PGS].update_one({"_id": pg["_id"]}, {"$set": updates})
    updated = await db[collections.PGS].find_one({"_id": pg["_id"]})

    await create_notification(
        db,
        message=f"PG update requested: \"{updated['title']}\" needs admin approval",
        notification_type="UPDATE_PG",
        user_id=to_object_id(current_user["id"]),
        related_id=updated["_id"],
    )

    saved_by_users = await db[collections.USERS].find({"savedPGs": updated["_id"]}, {"_id": 1}).to_list(length=1000)
    for user in saved_by_users:
        await create_notification(
            db,
            message=f"A PG in your saved list was updated: \"{updated['title']}\".",
            notification_type="PG_STATUS_UPDATE",
            user_id=user["_id"],
            related_id=updated["_id"],
            is_admin_notification=False,
        )

    return {"success": True, "message": "PG update request sent to admin", "data": serialize_doc(updated)}


async def delete_pg_controller(db, pg_id: str, current_user, reason: str):
    pg = await db[collections.PGS].find_one({"_id": to_object_id(pg_id)})
    if not pg:
        raise AppError(status_code=404, message="PG not found")
    if str(pg.get("owner")) != current_user["id"] and current_user.get("role") != "admin":
        raise AppError(status_code=403, message="Not authorized to delete this PG")
    clean_reason = (reason or "").strip()
    if len(clean_reason) < 10:
        raise AppError(status_code=400, message="Please provide a delete reason with at least 10 characters")

    # Deletion must be approved by admin first.
    await db[collections.PGS].update_one(
        {"_id": pg["_id"]},
        {"$set": {"status": "pending_delete", "deleteRequestReason": clean_reason, "updatedAt": utc_now()}},
    )

    await create_notification(
        db,
        message=f"PG delete requested: \"{pg['title']}\" by {current_user['name']}. Reason: {clean_reason}",
        notification_type="DELETE_PG",
        user_id=to_object_id(current_user["id"]),
        related_id=pg["_id"],
    )

    return {"success": True, "message": "PG deletion request sent to admin"}
