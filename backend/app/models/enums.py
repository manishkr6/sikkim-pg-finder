from enum import Enum


class UserRole(str, Enum):
    USER = "user"
    OWNER = "owner"
    ADMIN = "admin"


class OwnerRequestStatus(str, Enum):
    NONE = "none"
    PENDING = "pending"
    APPROVED = "approved"


class OTPPurpose(str, Enum):
    SIGNUP = "signup"
    LOGIN = "login"


class PGStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    PENDING_UPDATE = "pending_update"


class RoomType(str, Enum):
    SINGLE = "Single"
    DOUBLE = "Double"
    TRIPLE = "Triple"


class GenderPreference(str, Enum):
    BOYS = "Boys"
    GIRLS = "Girls"
    COED = "Co-ed"


class NotificationType(str, Enum):
    ADD_PG = "ADD_PG"
    UPDATE_PG = "UPDATE_PG"
    DELETE_PG = "DELETE_PG"
    REPORT_PG = "REPORT_PG"
    FEEDBACK = "FEEDBACK"
    USER_SIGNUP = "USER_SIGNUP"
    OWNER_REQUEST = "OWNER_REQUEST"
    OWNER_APPROVED = "OWNER_APPROVED"
    PG_STATUS_UPDATE = "PG_STATUS_UPDATE"


class ReportStatus(str, Enum):
    PENDING = "pending"
    REVIEWED = "reviewed"
    DISMISSED = "dismissed"
