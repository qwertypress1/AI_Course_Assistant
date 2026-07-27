from typing import List
from uuid import UUID
from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session
from db import get_db
from models import User, UserRole
from schemas.document import DocumentUploadResponse, DocumentStatusResponse, DocumentListResponse
from middleware.auth import get_current_user
from services.document_service import (
    ALLOWED_MIME_TYPES,
    MAX_FILE_SIZE,
    create_document_record,
    list_documents,
    get_document,
    delete_document,
)
from services.course_service import get_course_by_id, is_user_enrolled
from services.document_processing import document_processing_service

router = APIRouter(prefix="/documents", tags=["Documents"])


@router.post("/upload", response_model=DocumentUploadResponse, status_code=status.HTTP_202_ACCEPTED)
async def upload_document(
    background_tasks: BackgroundTasks,
    course_id: UUID = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify course exists
    course = get_course_by_id(db, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    # Verify enrollment / ownership
    if current_user.role == UserRole.student:
        if not is_user_enrolled(db, course_id, current_user.id):
            raise HTTPException(status_code=403, detail="Not enrolled in this course")

    # MIME type check
    mime_type = file.content_type or "application/octet-stream"
    if mime_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported file type '{mime_type}'. Allowed types: PDF, PNG, JPEG, TIFF"
        )

    # Read bytes and size check
    file_bytes = await file.read()
    file_size = len(file_bytes)
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size ({file_size} bytes) exceeds maximum limit of 10MB"
        )

    doc = create_document_record(
        db=db,
        course_id=course_id,
        uploaded_by=current_user.id,
        original_name=file.filename or "document.pdf",
        mime_type=mime_type,
        file_size_bytes=file_size,
        file_bytes=file_bytes
    )

    # Queue async background text extraction & OCR processing
    background_tasks.add_task(
        document_processing_service.process_document,
        document_id=str(doc.id)
    )

    return doc


@router.get("", response_model=List[DocumentListResponse])
async def list_documents(
    course_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return list_documents(db, course_id, current_user)


@router.get("/{document_id}/status", response_model=DocumentStatusResponse)
async def get_document_status(
    document_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = get_document(db, document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    if current_user.role == UserRole.student and doc.uploaded_by != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    return doc


@router.delete("/{document_id}", status_code=status.HTTP_200_OK)
async def delete_document(
    document_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = get_document(db, document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if current_user.role == UserRole.student and doc.uploaded_by != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    delete_document(db, doc)
    return {"message": "Document deleted successfully"}
