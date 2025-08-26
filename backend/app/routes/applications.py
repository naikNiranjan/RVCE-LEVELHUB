from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from typing import Optional
import os
import shutil
from datetime import datetime
import uuid

from app.config.database import get_supabase_client
from app.config.settings import settings

supabase = get_supabase_client()

router = APIRouter()

# Create uploads directory if it doesn't exist
UPLOAD_DIR = "uploads/resumes"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/applications")
async def create_application(
    job_id: str = Form(...),
    student_id: str = Form(...),
    cover_letter: Optional[str] = Form(None),
    resume: UploadFile = File(...)
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
async def get_student_applications(student_id: str):
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
async def get_job_applications(job_id: str):
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
    status: str = Form(...)
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
async def get_eligible_jobs(student_id: str):
    """Get eligible jobs for a student based on their profile"""
    try:
        print(f"🔍 Getting eligible jobs for student: {student_id}")

        # Get student profile from Supabase
        response = supabase.table('profiles').select('*').eq('id', student_id).execute()

        if not response.data or len(response.data) == 0:
            print("❌ Student profile not found")
            return JSONResponse(
                status_code=404,
                content={"success": False, "message": "Student profile not found"}
            )

        student_profile = response.data[0]
        print(f"👤 Student profile: {student_profile}")

        # Get all active jobs
        jobs_response = supabase.table('jobs').select('*').eq('status', 'active').execute()
        all_jobs = jobs_response.data or []
        print(f"💼 All active jobs: {len(all_jobs)}")

        eligible_jobs = []

        for job in all_jobs:
            # Check CGPA eligibility
            student_cgpa = float(student_profile.get('cgpa', 0))
            job_min_cgpa = float(job.get('min_cgpa', 0))

            if student_cgpa < job_min_cgpa:
                print(f"❌ CGPA too low for {job['company_name']}: {student_cgpa} < {job_min_cgpa}")
                continue

            # Check branch eligibility
            student_branch = student_profile.get('branch', '')
            eligible_branches = job.get('eligible_branches', [])

            if eligible_branches and len(eligible_branches) > 0:
                if student_branch not in eligible_branches:
                    print(f"❌ Branch not eligible for {job['company_name']}: {student_branch} not in {eligible_branches}")
                    continue

            # Check active backlogs
            student_backlogs = student_profile.get('active_backlog', False)
            job_max_backlogs = job.get('max_active_backlogs', 0)

            if student_backlogs and student_backlogs > job_max_backlogs:
                print(f"❌ Too many backlogs for {job['company_name']}: {student_backlogs} > {job_max_backlogs}")
                continue

            # Check deadline (jobs should not be expired)
            job_deadline = job.get('deadline')
            if job_deadline:
                from datetime import datetime
                deadline_date = datetime.fromisoformat(job_deadline.replace('Z', '+00:00'))
                if deadline_date < datetime.now(deadline_date.tzinfo):
                    print(f"❌ Job expired for {job['company_name']}: {job_deadline}")
                    continue

            # If all checks pass, add to eligible jobs
            eligible_jobs.append(job)
            print(f"✅ Eligible: {job['company_name']} - {job['role']}")

        print(f"✅ Final eligible jobs: {len(eligible_jobs)}")

        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "data": eligible_jobs,
                "message": f"Found {len(eligible_jobs)} eligible jobs"
            }
        )

    except Exception as e:
        print(f"❌ Error in get_eligible_jobs: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))