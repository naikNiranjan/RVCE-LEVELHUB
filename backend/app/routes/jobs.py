from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from typing import List, Optional
from datetime import datetime

from app.config.database import get_supabase_client

supabase = get_supabase_client()

router = APIRouter()

@router.post("/")
async def create_job(job_data: dict):
    """Create a new job posting"""
    try:
        print(f"📝 Creating job: {job_data}")

        # Insert job into Supabase
        response = supabase.table('jobs').insert(job_data).execute()

        if not response.data:
            raise HTTPException(status_code=400, detail="Failed to create job")

        job = response.data[0]
        print(f"✅ Job created successfully: {job['company_name']} - {job['role']}")

        return JSONResponse(
            status_code=201,
            content={
                "success": True,
                "data": job,
                "message": "Job created successfully"
            }
        )

    except Exception as e:
        print(f"❌ Error creating job: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/")
async def get_all_jobs():
    """Get all active jobs"""
    try:
        response = supabase.table('jobs').select('*').eq('status', 'active').execute()

        jobs = response.data or []
        print(f"📋 Retrieved {len(jobs)} active jobs")

        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "data": jobs,
                "count": len(jobs)
            }
        )

    except Exception as e:
        print(f"❌ Error getting jobs: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/test/{student_id}")
async def test_eligibility(student_id: str):
    """Test endpoint to check eligibility logic"""
    try:
        print(f"🧪 Testing eligibility for student: {student_id}")

        # Get student profile
        profile_response = supabase.table('profiles').select('*').eq('id', student_id).execute()

        if not profile_response.data or len(profile_response.data) == 0:
            return JSONResponse(
                status_code=200,
                content={
                    "success": True,
                    "message": "Student profile not found - create one first",
                    "student_id": student_id,
                    "profile": None,
                    "jobs": [],
                    "eligible_jobs": []
                }
            )

        student_profile = profile_response.data[0]
        print(f"👤 Found student profile: {student_profile}")

        # Get all active jobs
        jobs_response = supabase.table('jobs').select('*').eq('status', 'active').execute()
        all_jobs = jobs_response.data or []
        print(f"💼 Found {len(all_jobs)} active jobs")

        eligible_jobs = []

        for job in all_jobs:
            print(f"🔍 Checking job: {job['company_name']} - {job['role']}")

            # Check CGPA
            student_cgpa = float(student_profile.get('cgpa', 0))
            job_min_cgpa = float(job.get('min_cgpa', 0))

            if student_cgpa < job_min_cgpa:
                print(f"❌ CGPA too low: {student_cgpa} < {job_min_cgpa}")
                continue

            # Check branch
            student_branch = student_profile.get('branch', '')
            eligible_branches = job.get('eligible_branches', [])

            if eligible_branches and len(eligible_branches) > 0:
                if student_branch not in eligible_branches:
                    print(f"❌ Branch not eligible: {student_branch} not in {eligible_branches}")
                    continue

            # Check active backlogs
            student_backlogs = student_profile.get('active_backlog', False)
            job_max_backlogs = job.get('max_active_backlogs', 0)

            if student_backlogs and student_backlogs > job_max_backlogs:
                print(f"❌ Too many backlogs: {student_backlogs} > {job_max_backlogs}")
                continue

            print(f"✅ Eligible: {job['company_name']} - {job['role']}")
            eligible_jobs.append(job)

        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "message": f"Found {len(eligible_jobs)} eligible jobs out of {len(all_jobs)} total jobs",
                "student_id": student_id,
                "student_profile": {
                    "name": student_profile.get('full_name', ''),
                    "usn": student_profile.get('usn', ''),
                    "branch": student_profile.get('branch', ''),
                    "cgpa": student_profile.get('cgpa', ''),
                    "active_backlog": student_profile.get('active_backlog', False)
                },
                "total_jobs": len(all_jobs),
                "eligible_jobs_count": len(eligible_jobs),
                "eligible_jobs": eligible_jobs
            }
        )

    except Exception as e:
        print(f"❌ Error in test endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{job_id}")
async def get_job(job_id: str):
    """Get a specific job by ID"""
    try:
        response = supabase.table('jobs').select('*').eq('id', job_id).execute()

        if not response.data or len(response.data) == 0:
            raise HTTPException(status_code=404, detail="Job not found")

        job = response.data[0]
        print(f"📋 Retrieved job: {job['company_name']} - {job['role']}")

        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "data": job
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error getting job {job_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/admin/all")
async def get_all_jobs_admin():
    """Get all jobs for admin (including inactive)"""
    try:
        response = supabase.table('jobs').select('*').order('created_at', desc=True).execute()

        jobs = response.data or []
        print(f"📋 Admin retrieved {len(jobs)} total jobs")

        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "data": jobs,
                "count": len(jobs)
            }
        )

    except Exception as e:
        print(f"❌ Error getting admin jobs: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))