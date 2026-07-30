from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from db import get_db
from models import User
from schemas.chat import CreateSessionRequest, ChatMessageRequest, SessionResponse, MessageResponse
from middleware.auth import get_current_user
from services.chat_service import chat_service
from services.course_service import get_course_by_id

router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post("/sessions", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
async def create_session(
    body: CreateSessionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if body.course_id:
        course = get_course_by_id(db, body.course_id)
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")

    session = chat_service.create_session(
        db=db,
        user_id=current_user.id,
        course_id=body.course_id,
        title=body.title or ("General AI Assistant" if not body.course_id else "New Chat")
    )
    return session


@router.get("/sessions", response_model=List[SessionResponse])
async def list_sessions(
    course_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return chat_service.list_sessions(db, current_user.id, course_id)


@router.post("/sessions/{session_id}/messages")
async def send_message(
    session_id: UUID,
    body: ChatMessageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = chat_service.get_session(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")
        
    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    return StreamingResponse(
        chat_service.generate_rag_response(db, session, body.message),
        media_type="text/event-stream"
    )


@router.get("/sessions/{session_id}/messages", response_model=List[MessageResponse])
async def get_message_history(
    session_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = chat_service.get_session(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")

    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    return chat_service.get_messages(db, session_id)


@router.delete("/sessions/{session_id}", status_code=status.HTTP_200_OK)
async def delete_session(
    session_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = chat_service.get_session(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")

    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    chat_service.delete_session(db, session_id)
    return {"message": "Session deleted successfully"}
