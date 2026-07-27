import re
import time
from typing import Optional
from supabase import create_client, Client
from config import get_settings

settings = get_settings()


def sanitize_filename(filename: str) -> str:
    r"""
    Sanitize filename according to Architecture Section 10 rules:
    - Replace spaces with underscores
    - Remove characters: / \ : * ? " < > |
    - Truncate name (without extension) to max 100 chars
    - Prepend Unix timestamp
    """
    # Split extension
    parts = filename.rsplit(".", 1)
    name = parts[0]
    ext = f".{parts[1].lower()}" if len(parts) > 1 else ""

    # Replace spaces with underscores
    name = name.replace(" ", "_")
    # Remove prohibited characters
    name = re.sub(r'[/\\:*?"<>|]', "", name)
    # Truncate
    name = name[:100]

    timestamp = int(time.time())
    return f"{timestamp}_{name}{ext}"


class StorageService:
    def __init__(self):
        self._client: Optional[Client] = None

    @property
    def client(self) -> Client:
        if self._client is None:
            self._client = create_client(settings.supabase_url, settings.supabase_key)
        return self._client

    @property
    def bucket(self) -> str:
        return settings.supabase_storage_bucket

    def upload(self, file_bytes: bytes, storage_path: str, mime_type: str) -> str:
        """Upload file bytes to Supabase Storage. Returns storage path."""
        res = self.client.storage.from_(self.bucket).upload(
            path=storage_path,
            file=file_bytes,
            file_options={"content-type": mime_type, "upsert": "true"}
        )
        return storage_path

    def download(self, storage_path: str) -> bytes:
        """Download file bytes from Supabase Storage."""
        return self.client.storage.from_(self.bucket).download(storage_path)

    def delete(self, storage_path: str) -> bool:
        """Delete file from Supabase Storage."""
        res = self.client.storage.from_(self.bucket).remove([storage_path])
        return True

    def get_signed_url(self, storage_path: str, expires_in: int = 3600) -> str:
        """Generate temporary signed URL for file access."""
        res = self.client.storage.from_(self.bucket).create_signed_url(storage_path, expires_in)
        return res.get("signedUrl", "")


storage_service = StorageService()
