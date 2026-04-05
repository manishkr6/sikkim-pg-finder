from typing import Iterable

import cloudinary
import cloudinary.uploader

from app.core.settings import get_settings

settings = get_settings()
if settings.cloudinary_cloud_name and settings.cloudinary_api_key and settings.cloudinary_api_secret:
    cloudinary.config(
        cloud_name=settings.cloudinary_cloud_name,
        api_key=settings.cloudinary_api_key,
        api_secret=settings.cloudinary_api_secret,
    )


def extract_public_id_from_url(url: str, folder_prefix: str) -> str:
    filename = url.rstrip("/").split("/")[-1]
    base = filename.split(".")[0]
    return f"{folder_prefix}/{base}"


async def delete_images(image_urls: Iterable[str], folder_prefix: str = "sikkimpg/pgs") -> None:
    if not (settings.cloudinary_cloud_name and settings.cloudinary_api_key and settings.cloudinary_api_secret):
        return
    for url in image_urls:
        public_id = extract_public_id_from_url(url, folder_prefix)
        try:
            cloudinary.uploader.destroy(public_id)
        except Exception:
            # Non-blocking cleanup behavior, matching the Node implementation.
            continue


async def upload_file(file, folder: str) -> str:
    if not (settings.cloudinary_cloud_name and settings.cloudinary_api_key and settings.cloudinary_api_secret):
        # Fallback when cloudinary is not configured: keep a deterministic pseudo path.
        return f"/uploads/{folder}/{file.filename}"

    uploaded = cloudinary.uploader.upload(file.file, folder=folder, resource_type="auto")
    return uploaded.get("secure_url") or uploaded.get("url")
