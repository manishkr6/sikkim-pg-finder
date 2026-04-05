from pydantic import BaseModel, Field

from app.models.enums import GenderPreference, RoomType


class PGLocation(BaseModel):
    city: str
    area: str
    address: str


class PGCreateRequest(BaseModel):
    title: str = Field(min_length=10, max_length=100)
    description: str = Field(min_length=50)
    price: float = Field(ge=500)
    city: str
    area: str
    address: str
    roomType: RoomType
    genderPreference: GenderPreference
    amenities: list[str] = []
    contactNumber: str = Field(pattern=r"^[+]?[6-9]\d{9}$")
    images: list[str] = []


class PGUpdateRequest(BaseModel):
    title: str | None = Field(default=None, min_length=10, max_length=100)
    description: str | None = Field(default=None, min_length=50)
    price: float | None = Field(default=None, ge=500)
    city: str | None = None
    area: str | None = None
    address: str | None = None
    roomType: RoomType | None = None
    genderPreference: GenderPreference | None = None
    amenities: list[str] | None = None
    contactNumber: str | None = Field(default=None, pattern=r"^[+]?[6-9]\d{9}$")
    removeImages: list[str] | None = None
    images: list[str] | None = None


class PGListQuery(BaseModel):
    city: str | None = None
    minPrice: float | None = None
    maxPrice: float | None = None
    roomType: RoomType | None = None
    gender: GenderPreference | None = None
    amenities: str | None = None
    page: int = 1
    limit: int = 9
    sort: str = "newest"