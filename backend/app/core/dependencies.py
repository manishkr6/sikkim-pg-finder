from typing import Annotated

from fastapi import Cookie, Depends, Header

from app.config.db import get_database
from app.core.exceptions import AppError
from app.core.security import decode_token
from app.models import collections
from app.models.enums import UserRole
from app.utils.bson_utils import serialize_doc, to_object_id


async def get_current_user(
    db=Depends(get_database),
    authorization: Annotated[str | None, Header()] = None,
    token_cookie: Annotated[str | None, Cookie(alias="token")] = None,
):
    token: str | None = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ", 1)[1]
    elif token_cookie:
        token = token_cookie

    if not token:
        raise AppError(status_code=401, message="Not authorized, no token provided")

    payload = decode_token(token)
    user_id = payload.get("id")
    if not user_id:
        raise AppError(status_code=401, message="Invalid token")

    user = await db[collections.USERS].find_one({"_id": to_object_id(user_id)})
    if not user:
        raise AppError(status_code=401, message="User no longer exists")
    if user.get("isBlocked"):
        raise AppError(status_code=403, message="Your account has been blocked by admin")
    return serialize_doc(user)


def require_roles(*roles: UserRole):
    async def checker(current_user=Depends(get_current_user)):
        if current_user["role"] not in [role.value for role in roles]:
            raise AppError(
                status_code=403,
                message=f"Role '{current_user['role']}' is not authorized to access this route",
            )
        return current_user

    return checker