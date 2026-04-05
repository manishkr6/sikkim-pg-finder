import hashlib
import secrets

from app.core.settings import get_settings


def generate_otp() -> str:
    return str(secrets.randbelow(900000) + 100000)


def hash_value(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def otp_expiry_datetime(now):
    settings = get_settings()
    from datetime import timedelta

    return now + timedelta(minutes=settings.otp_expires_minutes)


def reset_token() -> str:
    return secrets.token_hex(20)