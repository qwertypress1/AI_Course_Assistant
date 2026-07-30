from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from db import get_db
from models import User, UserRole, Course
from schemas.course import CreateCourseRequest, CourseResponse, EnrollRequest
from middleware.auth import get_current_user, require_role
from services.course_service import (
    get_course_by_id,
    list_courses as get_all_courses,
    list_available_courses,
    create_course as create_new_course,
    enroll_user,
    is_user_enrolled,
    delete_or_unenroll_course,
)

router = APIRouter(prefix="/courses", tags=["Courses"])



async def require_enrolled(course_id: UUID, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role == UserRole.admin:
        return current_user

    course = get_course_by_id(db, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    if course.created_by == current_user.id:
        return current_user

    if not is_user_enrolled(db, course_id, current_user.id):
        raise HTTPException(status_code=403, detail="Not enrolled in this course")

    return current_user


@router.post("", response_model=CourseResponse, status_code=status.HTTP_201_CREATED)
async def create_course(
    body: CreateCourseRequest,
    current_user: User = Depends(require_role(UserRole.student, UserRole.lecturer, UserRole.admin)),
    db: Session = Depends(get_db)
):
    existing = db.query(Course).filter(Course.code == body.code.upper()).first()
    if existing:
        raise HTTPException(status_code=409, detail="Course code already exists")

    return create_new_course(db, body, current_user.id)


@router.get("", response_model=List[CourseResponse])
async def list_courses(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return get_all_courses(db, current_user)


@router.get("/available", response_model=List[CourseResponse])
async def get_available_courses(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return list_available_courses(db, current_user)


@router.get("/{course_id}", response_model=CourseResponse)
async def get_course(
    course_id: UUID,
    current_user: User = Depends(require_enrolled),
    db: Session = Depends(get_db)
):
    course = get_course_by_id(db, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course


@router.post("/{course_id}/enroll", status_code=status.HTTP_200_OK)
async def enroll_student(
    course_id: UUID,
    body: EnrollRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    course = get_course_by_id(db, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    enrollment = enroll_user(db, course_id, current_user.id, body.role)
    return {"message": "Successfully enrolled", "enrollment_id": str(enrollment.id)}


@router.delete("/{course_id}", status_code=status.HTTP_200_OK)
async def delete_course(
    course_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    res = delete_or_unenroll_course(db, course_id, current_user)
    if not res.get("success"):
        raise HTTPException(status_code=404, detail=res.get("message"))
    return res

