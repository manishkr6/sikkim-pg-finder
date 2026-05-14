from app.core.exceptions import AppError
from app.models import collections
from app.utils.bson_utils import serialize_doc, serialize_many, to_object_id
from app.utils.response import paginated_response


async def get_approved_pgs_controller(db, query):
    # Keep already-live PGs visible while owner changes/deletion are awaiting admin approval.
    filter_query = {"status": {"$in": ["approved", "pending_update", "pending_delete"]}, "isDeleted": False}

    if query.city:
        filter_query["location.city"] = {"$regex": query.city, "$options": "i"}
    if query.minPrice is not None or query.maxPrice is not None:
        price_filter = {}
        if query.minPrice is not None:
            price_filter["$gte"] = query.minPrice
        if query.maxPrice is not None:
            price_filter["$lte"] = query.maxPrice
        filter_query["price"] = price_filter
    if query.roomType:
        filter_query["roomType"] = query.roomType.value
    if query.gender:
        filter_query["genderPreference"] = query.gender.value
    if query.amenities:
        filter_query["amenities"] = {"$all": [item.strip() for item in query.amenities.split(",") if item.strip()]}

    sort_map = {
        "newest": [("createdAt", -1)],
        "price_low": [("price", 1)],
        "price_high": [("price", -1)],
        "rating": [("averageRating", -1)],
    }
    page = max(1, query.page)
    limit = max(1, min(query.limit, 50))
    skip = (page - 1) * limit

    cursor = db[collections.PGS].find(filter_query).sort(sort_map.get(query.sort, sort_map["newest"])).skip(skip).limit(limit)
    pgs = await cursor.to_list(length=limit)
    total = await db[collections.PGS].count_documents(filter_query)

    owner_ids = [pg.get("owner") for pg in pgs if pg.get("owner")]
    owners = {}
    if owner_ids:
        owner_cursor = db[collections.USERS].find({"_id": {"$in": owner_ids}}, {"name": 1, "email": 1})
        owner_docs = await owner_cursor.to_list(length=500)
        owners = {str(item["_id"]): serialize_doc(item) for item in owner_docs}

    serialized = []
    for pg in pgs:
        item = serialize_doc(pg)
        owner_key = str(pg.get("owner")) if pg.get("owner") else None
        if owner_key and owner_key in owners:
            item["owner"] = owners[owner_key]
        serialized.append(item)

    return paginated_response(data=serialized, total=total, page=page, limit=limit)


async def get_pg_by_id_controller(db, pg_id: str):
    pg = await db[collections.PGS].find_one({"_id": to_object_id(pg_id), "isDeleted": False})
    if not pg:
        raise AppError(status_code=404, message="PG not found")

    owner = None
    if pg.get("owner"):
        owner_doc = await db[collections.USERS].find_one(
            {"_id": pg["owner"]},
            {"name": 1, "email": 1, "contactNumber": 1},
        )
        owner = serialize_doc(owner_doc) if owner_doc else None

    review_cursor = db[collections.REVIEWS].find({"pg": pg["_id"]}).sort("createdAt", -1)
    reviews = await review_cursor.to_list(length=300)
    user_ids = [rev.get("user") for rev in reviews if rev.get("user")]
    users = {}
    if user_ids:
        user_cursor = db[collections.USERS].find({"_id": {"$in": user_ids}}, {"name": 1})
        user_docs = await user_cursor.to_list(length=300)
        users = {str(doc["_id"]): serialize_doc(doc) for doc in user_docs}

    review_data = []
    for rev in reviews:
        row = serialize_doc(rev)
        user_key = str(rev.get("user")) if rev.get("user") else None
        if user_key and user_key in users:
            row["user"] = users[user_key]
        review_data.append(row)

    payload = serialize_doc(pg)
    payload["owner"] = owner
    payload["reviews"] = review_data
    return {"success": True, "data": payload}
