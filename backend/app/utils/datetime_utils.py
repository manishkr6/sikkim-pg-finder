from datetime import datetime


def utc_now() -> datetime:
    # Use naive UTC datetime to match PyMongo default datetime decoding.
    return datetime.utcnow()
