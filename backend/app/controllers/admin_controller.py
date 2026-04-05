from app.core.exceptions import AppError
from app.models import collections
from app.services.cloudinary_service import delete_images
from app.services.notification_service import create_notification
from app.utils.bson_utils import serialize_doc, serialize_many, to_object_id
from app.utils.datetime_utils import utc_now
from app.utils.response import paginated_response


async def get_stats_controller(db):
    total_pgs = await db[collections.PGS].count_documents({"isDeleted": False})
    pending_pgs = await db[collections.PGS].count_documents(
        {"status": {"$in": ["pending", "pending_update", "pending_delete"]}, "isDeleted": False}
    )
    total_users = await db[collections.USERS].count_documents({})
    total_owners = await db[collections.USERS].count_documents({"role": "owner"})
    unread_notifs = await db[collections.NOTIFICATIONS].count_documents({"isRead": False, "isAdminNotification": True})
    return {
        "success": True,
        "data": {
            "totalPGs": total_pgs,
            "pendingPGs": pending_pgs,
            "totalUsers": total_users,
            "totalOwners": total_owners,
            "unreadNotifs": unread_notifs,
        },
    }


async def get_all_pgs_controller(db, query):
    filter_query = {}
    if query.status == "deleted":
        filter_query["isDeleted"] = True
    elif query.status:
        filter_query["status"] = query.status

    if query.search:
        filter_query["$or"] = [
            {"title": {"$regex": query.search, "$options": "i"}},
            {"location.city": {"$regex": query.search, "$options": "i"}},
        ]

    page = max(1, query.page)
    limit = min(100, query.limit)
    skip = (page - 1) * limit

    pgs = await db[collections.PGS].find(filter_query).sort("createdAt", -1).skip(skip).limit(limit).to_list(length=limit)
    total = await db[collections.PGS].count_documents(filter_query)

    owner_ids = [pg.get("owner") for pg in pgs if pg.get("owner")]
    owners = {}
    if owner_ids:
        owner_docs = await db[collections.USERS].find({"_id": {"$in": owner_ids}}, {"name": 1, "email": 1}).to_list(length=1000)
        owners = {str(doc["_id"]): serialize_doc(doc) for doc in owner_docs}

    payload = []
    for pg in pgs:
        item = serialize_doc(pg)
        owner_key = str(pg.get("owner")) if pg.get("owner") else None
        if owner_key and owner_key in owners:
            item["owner"] = owners[owner_key]
        payload.append(item)

    return paginated_response(data=payload, total=total, page=page, limit=limit)


async def approve_pg_controller(db, pg_id: str):
    pg = await db[collections.PGS].find_one({"_id": to_object_id(pg_id)})
    if not pg:
        raise AppError(status_code=404, message="PG not found")

    # Admin approval for delete request => permanent delete.
    if pg.get("status") == "pending_delete":
        await delete_images(pg.get("images", []))
        await db[collections.REVIEWS].delete_many({"pg": pg["_id"]})
        await db[collections.REPORTS].delete_many({"pg": pg["_id"]})
        await db[collections.PGS].delete_one({"_id": pg["_id"]})
        return {"success": True, "message": "PG deletion approved and completed"}

    await db[collections.PGS].update_one(
        {"_id": pg["_id"]},
        {"$set": {"status": "approved", "rejectionReason": "", "updatedAt": utc_now()}},
    )
    updated = await db[collections.PGS].find_one({"_id": pg["_id"]})

    await create_notification(
        db,
        message=f"Your PG \"{updated['title']}\" has been approved.",
        notification_type="PG_STATUS_UPDATE",
        user_id=updated["owner"],
        related_id=updated["_id"],
        is_admin_notification=False,
    )

    saved_by = await db[collections.USERS].find({"savedPGs": updated["_id"]}, {"_id": 1}).to_list(length=1000)
    for user in saved_by:
        await create_notification(
            db,
            message=f"A PG in your saved list was approved: \"{updated['title']}\".",
            notification_type="PG_STATUS_UPDATE",
            user_id=user["_id"],
            related_id=updated["_id"],
            is_admin_notification=False,
        )

    return {"success": True, "message": "PG approved successfully", "data": serialize_doc(updated)}


async def reject_pg_controller(db, pg_id: str, reason: str):
    pg = await db[collections.PGS].find_one({"_id": to_object_id(pg_id)})
    if not pg:
        raise AppError(status_code=404, message="PG not found")

    target_status = "approved" if pg.get("status") == "pending_delete" else "rejected"
    await db[collections.PGS].update_one(
        {"_id": pg["_id"]},
        {
            "$set": {
                "status": target_status,
                "rejectionReason": reason.strip(),
                "deleteRequestReason": "" if pg.get("status") == "pending_delete" else pg.get("deleteRequestReason", ""),
                "updatedAt": utc_now(),
            }
        },
    )
    updated = await db[collections.PGS].find_one({"_id": pg["_id"]})

    await create_notification(
        db,
        message=f"Your PG \"{updated['title']}\" was rejected. Reason: {reason.strip()}",
        notification_type="PG_STATUS_UPDATE",
        user_id=updated["owner"],
        related_id=updated["_id"],
        is_admin_notification=False,
    )

    saved_by = await db[collections.USERS].find({"savedPGs": updated["_id"]}, {"_id": 1}).to_list(length=1000)
    for user in saved_by:
        await create_notification(
            db,
            message=f"A PG in your saved list was rejected: \"{updated['title']}\".",
            notification_type="PG_STATUS_UPDATE",
            user_id=user["_id"],
            related_id=updated["_id"],
            is_admin_notification=False,
        )

    return {"success": True, "message": "PG rejected", "data": serialize_doc(updated)}


async def force_delete_pg_controller(db, pg_id: str):
    pg = await db[collections.PGS].find_one({"_id": to_object_id(pg_id)})
    if not pg:
        raise AppError(status_code=404, message="PG not found")

    await delete_images(pg.get("images", []))
    await db[collections.REVIEWS].delete_many({"pg": pg["_id"]})
    await db[collections.REPORTS].delete_many({"pg": pg["_id"]})
    await db[collections.PGS].delete_one({"_id": pg["_id"]})

    return {"success": True, "message": "PG permanently deleted"}


async def get_all_users_controller(db, query):
    filter_query = {}
    if query.role:
        filter_query["role"] = query.role
    if query.search:
        filter_query["$or"] = [
            {"name": {"$regex": query.search, "$options": "i"}},
            {"email": {"$regex": query.search, "$options": "i"}},
        ]

    page = max(1, query.page)
    limit = min(100, query.limit)
    skip = (page - 1) * limit

    users = await db[collections.USERS].find(filter_query).sort("createdAt", -1).skip(skip).limit(limit).to_list(length=limit)
    total = await db[collections.USERS].count_documents(filter_query)

    user_ids = [user["_id"] for user in users]
    owner_requests = await db[collections.OWNER_REQUESTS].find({"user": {"$in": user_ids}}).sort("createdAt", -1).to_list(length=3000)

    latest_by_user = {}
    for req in owner_requests:
        key = str(req.get("user")) if req.get("user") else None
        if key and key not in latest_by_user:
            latest_by_user[key] = req

    payload = []
    for user in users:
        row = serialize_doc(user)
        row.pop("password", None)
        req = latest_by_user.get(row["id"])
        row["ownerRequestDetails"] = (
            {
                "id": str(req["_id"]),
                "phoneNumber": req.get("phoneSnapshot"),
                "propertyDocumentUrl": req.get("propertyDocumentUrl"),
                "identityDocumentUrl": req.get("identityDocumentUrl"),
                "status": req.get("status"),
                "requestedAt": req.get("createdAt"),
            }
            if req
            else None
        )
        payload.append(row)

    return paginated_response(data=payload, total=total, page=page, limit=limit)


async def approve_owner_controller(db, user_id: str, admin_user):
    user = await db[collections.USERS].find_one({"_id": to_object_id(user_id)})
    if not user:
        raise AppError(status_code=404, message="User not found")

    owner_request = await db[collections.OWNER_REQUESTS].find_one({"user": user["_id"], "status": "pending"})
    if not owner_request:
        raise AppError(status_code=400, message="No pending owner request documents found for this user")

    now = utc_now()
    await db[collections.USERS].update_one(
        {"_id": user["_id"]},
        {"$set": {"role": "owner", "ownerRequestStatus": "approved", "updatedAt": now}},
    )
    await db[collections.OWNER_REQUESTS].update_one(
        {"_id": owner_request["_id"]},
        {
            "$set": {
                "status": "approved",
                "reviewedBy": to_object_id(admin_user["id"]),
                "reviewedAt": now,
                "updatedAt": now,
            }
        },
    )

    await create_notification(
        db,
        message="Your owner access request has been approved. You can now list PGs.",
        notification_type="OWNER_APPROVED",
        user_id=user["_id"],
        related_id=owner_request["_id"],
        is_admin_notification=False,
    )

    updated_user = await db[collections.USERS].find_one({"_id": user["_id"]})
    return {"success": True, "message": "Owner access approved", "data": serialize_doc(updated_user)}


async def toggle_block_user_controller(db, user_id: str):
    user = await db[collections.USERS].find_one({"_id": to_object_id(user_id)})
    if not user:
        raise AppError(status_code=404, message="User not found")
    if user.get("role") == "admin":
        raise AppError(status_code=403, message="Cannot block admin accounts")

    new_value = not user.get("isBlocked", False)
    await db[collections.USERS].update_one(
        {"_id": user["_id"]},
        {"$set": {"isBlocked": new_value, "updatedAt": utc_now()}},
    )

    return {
        "success": True,
        "message": f"User {'blocked' if new_value else 'unblocked'} successfully",
        "data": {"id": str(user["_id"]), "name": user.get("name"), "isBlocked": new_value},
    }


async def get_reports_controller(db, status: str | None):
    query = {"status": status} if status else {}
    reports = await db[collections.REPORTS].find(query).sort("createdAt", -1).to_list(length=2000)

    pg_ids = [item.get("pg") for item in reports if item.get("pg")]
    user_ids = [item.get("reportedBy") for item in reports if item.get("reportedBy")]

    pg_docs = await db[collections.PGS].find({"_id": {"$in": pg_ids}}, {"title": 1, "location": 1}).to_list(length=2000) if pg_ids else []
    user_docs = await db[collections.USERS].find({"_id": {"$in": user_ids}}, {"name": 1, "email": 1}).to_list(length=2000) if user_ids else []

    pg_map = {str(doc["_id"]): serialize_doc(doc) for doc in pg_docs}
    user_map = {str(doc["_id"]): serialize_doc(doc) for doc in user_docs}

    payload = []
    for report in reports:
        row = serialize_doc(report)
        pg_key = str(report.get("pg")) if report.get("pg") else None
        user_key = str(report.get("reportedBy")) if report.get("reportedBy") else None
        if pg_key and pg_key in pg_map:
            row["pg"] = pg_map[pg_key]
        if user_key and user_key in user_map:
            row["reportedBy"] = user_map[user_key]
        payload.append(row)

    return {"success": True, "count": len(payload), "data": payload}


async def update_report_controller(db, report_id: str, status: str):
    if status not in ["pending", "reviewed", "dismissed"]:
        raise AppError(status_code=400, message="Invalid status value")

    report = await db[collections.REPORTS].find_one({"_id": to_object_id(report_id)})
    if not report:
        raise AppError(status_code=404, message="Report not found")

    await db[collections.REPORTS].update_one(
        {"_id": report["_id"]},
        {"$set": {"status": status, "updatedAt": utc_now()}},
    )
    updated = await db[collections.REPORTS].find_one({"_id": report["_id"]})

    pg = await db[collections.PGS].find_one({"_id": updated.get("pg")}, {"title": 1}) if updated.get("pg") else None
    reporter = (
        await db[collections.USERS].find_one({"_id": updated.get("reportedBy")}, {"name": 1, "email": 1})
        if updated.get("reportedBy")
        else None
    )

    data = serialize_doc(updated)
    if pg:
        data["pg"] = serialize_doc(pg)
    if reporter:
        data["reportedBy"] = serialize_doc(reporter)

    return {"success": True, "data": data}
