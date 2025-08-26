from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import Optional
import os
import shutil
from datetime import datetime
import uuid

from app.config.database import get_db
from app.config.settings import settings

router = APIRouter()

# Create uploads directory if it doesn't exist
UPLOAD_DIR = "uploads/resumes"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/applications")
async def create_application(
    job_id: str = Form(...),
    student_id: str = Form(...),
    cover_letter: Optional[str] = Form(None),
    resume: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Create a new job application with resume upload"""

    try:
        # Validate file type
        if not resume.filename.lower().endswith(('.pdf', '.doc', '.docx')):
            raise HTTPException(
                status_code=400,
                detail="Only PDF, DOC, and DOCX files are allowed"
            )

        # Validate file size (10MB limit)
        file_size = 0
        content = await resume.read()
        file_size = len(content)

        if file_size > 10 * 1024 * 1024:  # 10MB
            raise HTTPException(
                status_code=400,
                detail="File size must be less than 10MB"
            )

        # Generate unique filename
        file_extension = os.path.splitext(resume.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)

        # Save file
        with open(file_path, "wb") as buffer:
            buffer.write(content)

        # TODO: Save application to database
        # For now, just return success with file info
        application_data = {
            "id": str(uuid.uuid4()),
            "job_id": job_id,
            "student_id": student_id,
            "cover_letter": cover_letter,
            "resume_url": f"/uploads/resumes/{unique_filename}",
            "resume_filename": resume.filename,
            "file_size": file_size,
            "status": "applied",
            "applied_at": datetime.utcnow().isoformat()
        }

        return JSONResponse(
            status_code=201,
            content={
                "success": True,
                "message": "Application submitted successfully",
                "data": application_data
            }
        )

    except Exception as e:
        # Clean up uploaded file if something goes wrong
        if 'file_path' in locals() and os.path.exists(file_path):
            os.remove(file_path)

        raise HTTPException(status_code=500, detail=str(e))

@router.get("/applications/{student_id}")
async def get_student_applications(student_id: str, db: Session = Depends(get_db)):
    """Get all applications for a student"""
    try:
        # TODO: Implement database query
        # For now, return mock data
        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "data": []
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/jobs/{job_id}/applications")
async def get_job_applications(job_id: str, db: Session = Depends(get_db)):
    """Get all applications for a job"""
    try:
        # TODO: Implement database query
        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "data": []
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/applications/{application_id}/status")
async def update_application_status(
    application_id: str,
    status: str = Form(...),
    db: Session = Depends(get_db)
):
    """Update application status"""
    try:
        # TODO: Implement database update
        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "message": f"Application status updated to {status}"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/jobs/eligible/{student_id}")
async def get_eligible_jobs(student_id: str, db: Session = Depends(get_db)):
    """Get eligible jobs for a student"""
    try:
        # TODO: Implement eligibility logic
        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "data": []
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))