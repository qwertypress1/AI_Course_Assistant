from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from models import Course, CourseEnrollment, User, UserRole, Document, DocumentChunk, ChatSession, ChatMessage
from schemas.course import CreateCourseRequest, EnrollRequest


def create_course(db: Session, body: CreateCourseRequest, creator_id: UUID) -> Course:
    course = Course(
        name=body.name,
        code=body.code.upper(),
        description=body.description,
        created_by=creator_id,
        is_active=True,
    )
    db.add(course)
    db.commit()
    db.refresh(course)

    # Automatically enroll the creator as lecturer
    enrollment = CourseEnrollment(
        course_id=course.id,
        user_id=creator_id,
        role="lecturer",
    )
    db.add(enrollment)
    db.commit()

    return course


def list_courses(db: Session, current_user: User) -> List[Course]:
    if current_user.role == UserRole.admin:
        return db.query(Course).filter(Course.is_active == True).all()
    
    # Students and Lecturers: list courses they are enrolled in or created
    enrolled_course_ids = (
        db.query(CourseEnrollment.course_id)
        .filter(CourseEnrollment.user_id == current_user.id)
        .subquery()
    )
    return db.query(Course).filter(
        Course.is_active == True,
        (Course.id.in_(enrolled_course_ids)) | (Course.created_by == current_user.id)
    ).all()


def list_available_courses(db: Session, current_user: User) -> List[Course]:
    """List all public active courses that the student is NOT currently enrolled in."""
    enrolled_course_ids = (
        db.query(CourseEnrollment.course_id)
        .filter(CourseEnrollment.user_id == current_user.id)
        .subquery()
    )
    return db.query(Course).filter(
        Course.is_active == True,
        ~Course.id.in_(enrolled_course_ids),
        Course.created_by != current_user.id
    ).all()


def get_course_by_id(db: Session, course_id: UUID) -> Optional[Course]:
    return db.query(Course).filter(Course.id == course_id, Course.is_active == True).first()


def enroll_user(db: Session, course_id: UUID, user_id: UUID, role: str = "student") -> CourseEnrollment:
    existing = db.query(CourseEnrollment).filter(
        CourseEnrollment.course_id == course_id,
        CourseEnrollment.user_id == user_id
    ).first()
    if existing:
        return existing

    enrollment = CourseEnrollment(
        course_id=course_id,
        user_id=user_id,
        role=role,
    )
    db.add(enrollment)
    db.commit()
    db.refresh(enrollment)
    return enrollment


def is_user_enrolled(db: Session, course_id: UUID, user_id: UUID) -> bool:
    course = get_course_by_id(db, course_id)
    if course and course.created_by == user_id:
        return True
    count = db.query(CourseEnrollment).filter(
        CourseEnrollment.course_id == course_id,
        CourseEnrollment.user_id == user_id
    ).count()
    return count > 0


def delete_or_unenroll_course(db: Session, course_id: UUID, current_user: User) -> dict:
    course = get_course_by_id(db, course_id)
    if not course:
        return {"success": False, "message": "Course not found"}

    try:
        # 1. Remove enrollment for current user if enrolled
        db.query(CourseEnrollment).filter(
            CourseEnrollment.course_id == course_id,
            CourseEnrollment.user_id == current_user.id
        ).delete(synchronize_session=False)

        # 2. If current user created the course or is admin, remove the course completely
        if course.created_by == current_user.id or current_user.role == UserRole.admin:
            # Delete all document chunks for course
            db.query(DocumentChunk).filter(DocumentChunk.course_id == course_id).delete(synchronize_session=False)

            # Delete all chat messages and chat sessions for course
            session_ids = [s.id for s in db.query(ChatSession.id).filter(ChatSession.course_id == course_id).all()]
            if session_ids:
                db.query(ChatMessage).filter(ChatMessage.session_id.in_(session_ids)).delete(synchronize_session=False)
                db.query(ChatSession).filter(ChatSession.course_id == course_id).delete(synchronize_session=False)

            # Delete all documents for course
            db.query(Document).filter(Document.course_id == course_id).delete(synchronize_session=False)

            # Delete all remaining course enrollments
            db.query(CourseEnrollment).filter(CourseEnrollment.course_id == course_id).delete(synchronize_session=False)

            # Delete course record
            db.delete(course)

        db.commit()
        return {"success": True, "message": "Course removed successfully"}
    except Exception as err:
        db.rollback()
        print(f"[Delete Course Error] {err}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not remove course: {str(err)}"
        )


