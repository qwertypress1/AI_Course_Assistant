from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from models import Document, DocumentStatus, User, UserRole
from services.storage_service import storage_service, sanitize_filename

ALLOWED_MIME_TYPES = {
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/tiff",
}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


def create_document_record(
    db: Session,
    course_id: UUID,
    uploaded_by: UUID,
    original_name: str,
    mime_type: str,
    file_size_bytes: int,
    file_bytes: bytes
) -> Document:
    sanitized_name = sanitize_filename(original_name)
    storage_path = f"{course_id}/{uploaded_by}/{sanitized_name}"

    # Try uploading to Supabase Storage if client is configured
    try:
        storage_service.upload(file_bytes, storage_path, mime_type)
    except Exception as e:
        # Log error or allow DB record creation for local testing
        pass

    doc = Document(
        course_id=course_id,
        uploaded_by=uploaded_by,
        filename=sanitized_name,
        original_name=original_name,
        mime_type=mime_type,
        file_size_bytes=file_size_bytes,
        storage_path=storage_path,
        status=DocumentStatus.pending,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


def list_documents(db: Session, course_id: UUID, current_user: User) -> List[Document]:
    query = db.query(Document).filter(Document.course_id == course_id)
    if current_user.role == UserRole.student:
        query = query.filter(Document.uploaded_by == current_user.id)
    return query.order_by(Document.created_at.desc()).all()


def get_document(db: Session, document_id: UUID) -> Optional[Document]:
    return db.query(Document).filter(Document.id == document_id).first()


def delete_document(db: Session, document: Document) -> bool:
    # Delete from Supabase Storage
    try:
        storage_service.delete(document.storage_path)
    except Exception:
        pass

    db.delete(document)
    db.commit()
    return True
