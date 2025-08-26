from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Query
from fastapi.responses import StreamingResponse
import csv
import io
from datetime import datetime
from fastapi.responses import JSONResponse
from typing import Optional
import os
import shutil
from datetime import datetime
import uuid
import pandas as pd
from io import BytesIO

from app.config.database import get_supabase_client
from app.config.settings import settings

supabase = get_supabase_client()

router = APIRouter()

# Create uploads directory if it doesn't exist
UPLOAD_DIR = "uploads/resumes"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.get("/all")
async def get_all_applications():
    """Get all applications with job and student details"""
    try:
        print("🔍 Getting all applications")

        # Get applications from Supabase with job details
        response = supabase.table('applications').select('''
            *,
            jobs (
                id,
                company_name,
                role,
                location,
                ctc,
                deadline
            )
        ''').order('applied_at.desc').execute()

        if not response.data or len(response.data) == 0:
            return JSONResponse(
                status_code=200,
                content={
                    "success": True,
                    "data": [],
                    "message": "No applications found"
                }
            )

        # Get student IDs from applications
        student_ids = [app['student_id'] for app in response.data]

        # Fetch student profiles
        profiles_query = supabase.table('profiles').select('id, full_name, usn, branch, cgpa, email')
        profiles_response = profiles_query.in_('id', student_ids).execute()
        profiles_data = profiles_response.data or []

        # Create a dictionary for quick profile lookup
        profiles_dict = {profile['id']: profile for profile in profiles_data}

        # Merge applications with profiles
        applications_data = []
        for app in response.data:
            app_copy = app.copy()
            app_copy['profiles'] = profiles_dict.get(app['student_id'], {})
            applications_data.append(app_copy)

        print(f"✅ Retrieved {len(applications_data)} applications")

        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "data": applications_data,
                "count": len(applications_data)
            }
        )

    except Exception as e:
        print(f"❌ Error in get_all_applications: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/applications")
async def create_application(
    job_id: str = Form(...),
    student_id: str = Form(...),
    cover_letter: Optional[str] = Form(None),
    resume: Optional[UploadFile] = File(None)
):
    """Create a new job application with optional resume upload"""

    try:
        application_data = {
            "id": str(uuid.uuid4()),
            "job_id": job_id,
            "student_id": student_id,
            "cover_letter": cover_letter,
            "status": "applied",
            "applied_at": datetime.utcnow().isoformat()
        }

        # Handle optional resume upload
        if resume and resume.filename:
            # Validate file type
            if not resume.filename.lower().endswith(('.pdf', '.doc', '.docx')):
                raise HTTPException(
                    status_code=400,
                    detail="Only PDF, DOC, and DOCX files are allowed"
                )

            # Validate file size (10MB limit)
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

            # Add resume URL to application data
            application_data["resume_url"] = f"/uploads/resumes/{unique_filename}"
        else:
            # No resume uploaded
            application_data["resume_url"] = None

        # Insert into Supabase
        print(f"🔄 Inserting application data: {application_data}")
        response = supabase.table('applications').insert([application_data]).execute()

        print(f"🔍 Supabase response: {response}")
        print(f"🔍 Response data: {response.data}")
        print(f"🔍 Response error: {getattr(response, 'error', 'No error attribute')}")

        if hasattr(response, 'error') and response.error:
            # Clean up uploaded file if database insert fails
            if 'file_path' in locals() and os.path.exists(file_path):
                os.remove(file_path)
            print(f"❌ Supabase error: {response.error}")
            raise HTTPException(status_code=500, detail=f"Database error: {response.error.message}")

        if not response.data or len(response.data) == 0:
            raise HTTPException(status_code=500, detail="No data returned from database")

        print(f"✅ Application created successfully: {response.data[0]['id']}")

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
        # Get applications from Supabase with job details
        response = supabase.table('applications').select('''
            *,
            jobs (
                id,
                company_name,
                role,
                location,
                ctc,
                deadline
            )
        ''').eq('student_id', student_id).order('applied_at.desc').execute()

        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "data": response.data or []
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/applications/export")
async def export_applications(
    status_filter: str = Query("all", description="Filter by status: all, applied, shortlisted, selected, rejected"),
    job_id: str = Query(None, description="Filter by specific job ID")
):
    """Export applications data as CSV"""
    try:
        # Build query based on filters - get applications with jobs first
        query = supabase.table('applications').select('''
            *,
            jobs (
                company_name,
                role,
                location,
                ctc,
                deadline
            )
        ''')

        # Apply status filter
        if status_filter != "all":
            query = query.eq('status', status_filter)

        # Apply job filter
        if job_id:
            query = query.eq('job_id', job_id)

        # Execute query
        response = query.order('applied_at.desc').execute()

        if not response.data:
            return JSONResponse(
                status_code=200,
                content={"message": "No applications found for export"}
            )

        # Get student IDs and fetch profiles separately
        student_ids = [app['student_id'] for app in response.data]

        # Fetch student profiles
        profiles_query = supabase.table('profiles').select('id, full_name, usn, branch, cgpa, email')
        profiles_response = profiles_query.in_('id', student_ids).execute()
        profiles_data = profiles_response.data or []

        # Create a dictionary for quick profile lookup
        profiles_dict = {profile['id']: profile for profile in profiles_data}

        # Merge applications with profiles
        applications_data = []
        for app in response.data:
            app_copy = app.copy()
            app_copy['profiles'] = profiles_dict.get(app['student_id'], {})
            applications_data.append(app_copy)

        # Create CSV content
        output = io.StringIO()
        writer = csv.writer(output)

        # Write header
        writer.writerow([
            'Application ID', 'Applied Date', 'Status',
            'Student Name', 'USN', 'Branch', 'CGPA', 'Email',
            'Company', 'Role', 'Location', 'CTC', 'Deadline',
            'Cover Letter'
        ])

        # Write data
        for app in applications_data:
            writer.writerow([
                app.get('id', ''),
                app.get('applied_at', ''),
                app.get('status', ''),
                app.get('profiles', {}).get('full_name', ''),
                app.get('profiles', {}).get('usn', ''),
                app.get('profiles', {}).get('branch', ''),
                app.get('profiles', {}).get('cgpa', ''),
                app.get('profiles', {}).get('email', ''),
                app.get('jobs', {}).get('company_name', ''),
                app.get('jobs', {}).get('role', ''),
                app.get('jobs', {}).get('location', ''),
                app.get('jobs', {}).get('ctc', ''),
                app.get('jobs', {}).get('deadline', ''),
                app.get('cover_letter', '')[:100] + ('...' if app.get('cover_letter', '') and len(app.get('cover_letter', '')) > 100 else '')
            ])

        output.seek(0)
        csv_content = output.getvalue()
        output.close()

        # Create streaming response
        def generate():
            yield csv_content

        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        filename = f"applications_{status_filter}_{timestamp}.csv"

        return StreamingResponse(
            io.StringIO(csv_content),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")

@router.get("/jobs/{job_id}/applications")
async def get_job_applications(job_id: str):
    """Get all applications for a job"""
    try:
        # Get applications from Supabase
        response = supabase.table('applications').select('*').eq('job_id', job_id).order('applied_at.desc').execute()

        if not response.data or len(response.data) == 0:
            return JSONResponse(
                status_code=200,
                content={
                    "success": True,
                    "data": []
                }
            )

        # Get student IDs from applications
        student_ids = [app['student_id'] for app in response.data]

        # Fetch student profiles
        profiles_query = supabase.table('profiles').select('id, full_name, usn, branch, cgpa, email')
        profiles_response = profiles_query.in_('id', student_ids).execute()
        profiles_data = profiles_response.data or []

        # Create a dictionary for quick profile lookup
        profiles_dict = {profile['id']: profile for profile in profiles_data}

        # Merge applications with profiles
        applications_data = []
        for app in response.data:
            app_copy = app.copy()
            app_copy['profiles'] = profiles_dict.get(app['student_id'], {})
            applications_data.append(app_copy)

        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "data": applications_data
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
        # Validate status
        valid_statuses = ['applied', 'shortlisted', 'selected', 'rejected']
        if status not in valid_statuses:
            raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}")

        # Update application status in Supabase
        print(f"🔄 Updating application {application_id} to status: {status}")
        update_result = supabase.table('applications').update({
            'status': status,
            'updated_at': datetime.utcnow().isoformat()
        }).eq('id', application_id).execute()

        print(f"🔍 Update result: {update_result}")
        print(f"🔍 Update data: {getattr(update_result, 'data', 'No data attribute')}")
        print(f"🔍 Update error: {getattr(update_result, 'error', 'No error attribute')}")

        # Check if the update was successful
        if hasattr(update_result, 'error') and update_result.error:
            print(f"❌ Update error: {update_result.error}")
            raise HTTPException(status_code=500, detail=f"Failed to update application status: {update_result.error.message}")

        if not hasattr(update_result, 'data') or not update_result.data:
            raise HTTPException(status_code=404, detail="Application not found")

        print(f"✅ Application {application_id} updated to status: {status}")

        print(f"✅ Successfully updated application {application_id} to status: {status}")

        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "message": f"Application status updated to {status}"
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/jobs/eligible/{student_id}")
async def get_eligible_jobs(student_id: str):
    """Get eligible jobs for a student based on their profile"""
    try:
        print(f"🔍 Getting eligible jobs for student: {student_id}")

        # Add CORS headers explicitly for this endpoint
        from fastapi.responses import JSONResponse

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

@router.post("/shortlist/upload")
async def upload_shortlist(
    job_id: str = Form(...),
    shortlist_file: UploadFile = File(...),
    status: str = Form("shortlisted")  # Default to shortlisted, can also be "rejected"
):
    """Upload a shortlist CSV/Excel file and update application statuses"""
    try:
        # Validate status
        valid_statuses = ['shortlisted', 'rejected']
        if status not in valid_statuses:
            raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}")

        # Validate file type
        allowed_extensions = ['.csv', '.xlsx', '.xls']
        file_extension = os.path.splitext(shortlist_file.filename)[1].lower()

        if file_extension not in allowed_extensions:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type. Only {', '.join(allowed_extensions)} files are allowed"
            )

        # Read file content
        content = await shortlist_file.read()

        # Process file based on type
        if file_extension == '.csv':
            # Process CSV
            content_str = content.decode('utf-8')
            df = pd.read_csv(io.StringIO(content_str))
        else:
            # Process Excel
            df = pd.read_excel(BytesIO(content))

        if df.empty:
            raise HTTPException(status_code=400, detail="The uploaded file is empty")

        # Check for required columns (email or usn)
        has_email = any(col.lower() in ['email', 'e-mail', 'mail'] for col in df.columns)
        has_usn = any(col.lower() in ['usn', 'roll_no', 'roll_number', 'roll no', 'student_id'] for col in df.columns)

        if not has_email and not has_usn:
            raise HTTPException(
                status_code=400,
                detail="File must contain either 'email' or 'usn' column for student identification"
            )

        # Extract identifiers
        identifiers = []
        for _, row in df.iterrows():
            identifier = {}

            # Find email column
            email_col = next((col for col in df.columns if col.lower() in ['email', 'e-mail', 'mail']), None)
            if email_col and pd.notna(row[email_col]):
                identifier['email'] = str(row[email_col]).strip().lower()

            # Find USN column
            usn_col = next((col for col in df.columns if col.lower() in ['usn', 'roll_no', 'roll_number', 'roll no', 'student_id']), None)
            if usn_col and pd.notna(row[usn_col]):
                identifier['usn'] = str(row[usn_col]).strip()

            if identifier:
                identifiers.append(identifier)

        if not identifiers:
            raise HTTPException(status_code=400, detail="No valid identifiers found in the file")

        # Get all profiles that match the identifiers
        matched_students = []

        for identifier in identifiers:
            query = supabase.table('profiles').select('id, email, usn, full_name')

            if 'email' in identifier:
                query = query.eq('email', identifier['email'])
            elif 'usn' in identifier:
                query = query.eq('usn', identifier['usn'])

            profile_result = query.execute()

            if profile_result.data and len(profile_result.data) > 0:
                matched_students.extend(profile_result.data)
            else:
                print(f"⚠️ No match found for identifier: {identifier}")

        if not matched_students:
            return JSONResponse(
                status_code=200,
                content={
                    "success": False,
                    "message": "No students matched from the uploaded file",
                    "data": {
                        "total_processed": len(identifiers),
                        "matched_students": 0,
                        "updated_applications": 0
                    }
                }
            )

        # Remove duplicates based on student ID
        unique_students = list({student['id']: student for student in matched_students}.values())

        # Get existing applications for this job and matched students
        student_ids = [student['id'] for student in unique_students]

        existing_applications = supabase.table('applications').select('*').eq('job_id', job_id).in_('student_id', student_ids).execute()

        # Update application statuses
        updated_count = 0

        if existing_applications.data:
            for application in existing_applications.data:
                update_result = supabase.table('applications').update({
                    'status': status,
                    'updated_at': datetime.utcnow().isoformat()
                }).eq('id', application['id']).execute()

                if update_result.error:
                    print(f"❌ Error updating application {application['id']}: {update_result.error.message}")
                else:
                    updated_count += 1

        # Create applications for students who don't have one yet
        existing_student_ids = {app['student_id'] for app in existing_applications.data or []}
        new_applications_count = 0

        for student in unique_students:
            if student['id'] not in existing_student_ids:
                # Create new application
                application_data = {
                    "id": str(uuid.uuid4()),
                    "job_id": job_id,
                    "student_id": student['id'],
                    "status": status,
                    "applied_at": datetime.utcnow().isoformat(),
                    "updated_at": datetime.utcnow().isoformat()
                }

                create_result = supabase.table('applications').insert([application_data]).execute()

                if create_result.error:
                    print(f"❌ Error creating application for student {student['id']}: {create_result.error.message}")
                else:
                    new_applications_count += 1

        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "message": f"Shortlist processed successfully. Updated {updated_count} existing applications and created {new_applications_count} new applications.",
                "data": {
                    "total_processed": len(identifiers),
                    "matched_students": len(unique_students),
                    "updated_applications": updated_count,
                    "created_applications": new_applications_count,
                    "job_id": job_id,
                    "status_applied": status
                }
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in upload_shortlist: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Upload processing failed: {str(e)}")