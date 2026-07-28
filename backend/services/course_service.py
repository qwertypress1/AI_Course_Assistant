from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from models import Course, CourseEnrollment, User, UserRole
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
