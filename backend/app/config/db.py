from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.core.settings import get_settings


class MongoDB:
    client: AsyncIOMotorClient | None = None
    database: AsyncIOMotorDatabase | None = None


db = MongoDB()


def get_database() -> AsyncIOMotorDatabase:
    if db.database is None:
        settings = get_settings()
        db.client = AsyncIOMotorClient(settings.mongodb_uri)
        db.database = db.client[settings.mongodb_db_name]
    return db.database

@asynccontextmanager
async def lifespan(_: FastAPI):
    settings = get_settings()
    db.client = AsyncIOMotorClient(settings.mongodb_uri)
    db.database = db.client[settings.mongodb_db_name]
    try:
        yield
    finally:
        if db.client:
            db.client.close()


def now_utc() -> Any:
    from datetime import datetime, timezone

    return datetime.now(timezone.utc)
