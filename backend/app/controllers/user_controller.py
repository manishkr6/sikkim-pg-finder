from app.core.exceptions import AppError
from app.core.security import hash_password, verify_password
from app.models import collections
from app.services.notification_service import create_notification
from app.utils.bson_utils import serialize_doc, serialize_many, to_object_id
from app.utils.datetime_utils import utc_now


async def toggle_save_pg_controller(db, pg_id: str, current_user):
    pg = await db[collections.PGS].find_one({"_id": to_object_id(pg_id)})
    if not pg or pg.get("isDeleted"):
        raise AppError(status_code=404, message="PG not found")
    if pg.get("status") != "approved":
        raise AppError(status_code=400, message="Can only save approved PGs")

    user_oid = to_object_id(current_user["id"])
    user = await db[collections.USERS].find_one({"_id": user_oid})
    if not user:
        raise AppError(status_code=404, message="User not found")

    saved = [str(item) for item in user.get("savedPGs", [])]
    if pg_id in saved:
        new_saved = [oid for oid in user.get("savedPGs", []) if str(oid) != pg_id]
        saved_state = False
        message = "PG removed from saved"
    else:
        new_saved = user.get("savedPGs", []) + [to_object_id(pg_id)]
        saved_state = True
        message = "PG saved successfully"

    await db[collections.USERS].update_one(
        {"_id": user_oid},
        {"$set": {"savedPGs": new_saved, "updatedAt": utc_now()}},
    )
    return {"success": True, "saved": saved_state, "message": message}


async def get_saved_pgs_controller(db, current_user):
    user = await db[collections.USERS].find_one({"_id": to_object_id(current_user["id"])})
    if not user:
        raise AppError(status_code=404, message="User not found")

    saved_ids = user.get("savedPGs", [])
    if not saved_ids:
        return {"success": True, "count": 0, "data": []}

    pgs = await db[collections.PGS].find(
        {
            "_id": {"$in": saved_ids},
            "isDeleted": False,
            "status": "approved",
        }
    ).to_list(length=300)

    owner_ids = [pg.get("owner") for pg in pgs if pg.get("owner")]
    owners = {}
    if owner_ids:
        owner_docs = await db[collections.USERS].find({"_id": {"$in": owner_ids}}, {"name": 1}).to_list(length=300)
        owners = {str(doc["_id"]): serialize_doc(doc) for doc in owner_docs}

    payload = []
    for pg in pgs:
        item = serialize_doc(pg)
        owner_key = str(pg.get("owner")) if pg.get("owner") else None
        if owner_key and owner_key in owners:
            item["owner"] = owners[owner_key]
        payload.append(item)

    return {"success": True, "count": len(payload), "data": payload}


async def request_owner_controller(db, payload, current_user):
    user_oid = to_object_id(current_user["id"])
    user = await db[collections.USERS].find_one({"_id": user_oid})
    if not user:
        raise AppError(status_code=404, message="User not found")

    if user.get("role") in ["owner", "admin"]:
        raise AppError(status_code=400, message="You already have owner or admin privileges")

    existing_pending = await db[collections.OWNER_REQUESTS].find_one({"user": user_oid, "status": "pending"})
    if existing_pending or user.get("ownerRequestStatus") == "pending":
        raise AppError(status_code=400, message="Your owner request is already pending review")

    now = utc_now()
    req_doc = {
        "user": user_oid,
        "nameSnapshot": payload.fullName.strip(),
        "emailSnapshot": user["email"],
        "phoneSnapshot": payload.phoneNumber.strip(),
        "propertyDocumentUrl": payload.propertyDocumentUrl,
        "identityDocumentUrl": payload.identityDocumentUrl,
        "status": "pending",
        "reviewRemark": "",
        "createdAt": now,
        "updatedAt": now,
    }
    await db[collections.OWNER_REQUESTS].insert_one(req_doc)
    await db[collections.USERS].update_one(
        {"_id": user_oid},
        {"$set": {"ownerRequestStatus": "pending", "updatedAt": utc_now()}},
    )

    await create_notification(
        db,
        message=f"Owner access requested by {user['name']} ({user['email']})",
        notification_type="OWNER_REQUEST",
        user_id=user_oid,
        related_id=user_oid,
    )

    return {"success": True, "message": "Owner request submitted successfully"}


async def update_profile_controller(db, payload, current_user):
    await db[collections.USERS].update_one(
        {"_id": to_object_id(current_user["id"])},
        {"$set": {"name": payload.name.strip(), "updatedAt": utc_now()}},
    )
    user = await db[collections.USERS].find_one({"_id": to_object_id(current_user["id"])})
    clean = serialize_doc(user)
    clean.pop("password", None)
    return {"success": True, "message": "Profile updated", "data": clean}


async def change_password_controller(db, payload, current_user):
    if payload.newPassword == payload.currentPassword:
        raise AppError(status_code=400, message="New password must be different from current password")

    user = await db[collections.USERS].find_one({"_id": to_object_id(current_user["id"])})
    if not user or not verify_password(payload.currentPassword, user.get("password", "")):
        raise AppError(status_code=400, message="Current password is incorrect")

    await db[collections.USERS].update_one(
        {"_id": user["_id"]},
        {"$set": {"password": hash_password(payload.newPassword), "updatedAt": utc_now()}},
    )
    return {"success": True, "message": "Password changed successfully"}