import requests
import json

# Test the eligibility endpoint
def test_eligibility_endpoint():
    # First, let's try to get all jobs from Supabase to see if any exist
    import os
    from supabase import create_client

    # Load environment variables
    supabase_url = "https://nuhyjfggcoueebijauvo.supabase.co"
    supabase_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51aHlqZmdnY291ZWViaWphdXZvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjE4MDYzMSwiZXhwIjoyMDcxNzU2NjMxfQ.T31CwmvbAtNBP3l6ILFv6ZWOr7p07lds3o7zj_HgB2o"

    supabase = create_client(supabase_url, supabase_key)

    print("=== Testing Eligibility Matching ===")

    # Check if any jobs exist
    print("\n1. Checking existing jobs...")
    try:
        jobs_response = supabase.table('jobs').select('*').execute()
        print(f"Found {len(jobs_response.data)} jobs:")
        for job in jobs_response.data[:3]:  # Show first 3 jobs
            print(f"  - {job.get('company_name')} ({job.get('role')}) - CGPA: {job.get('min_cgpa')}, Branches: {job.get('eligible_branches')}")
    except Exception as e:
        print(f"Error fetching jobs: {e}")

    # Check if any profiles exist
    print("\n2. Checking existing student profiles...")
    try:
        profiles_response = supabase.table('profiles').select('*').execute()
        print(f"Found {len(profiles_response.data)} profiles:")
        for profile in profiles_response.data[:3]:  # Show first 3 profiles
            print(f"  - {profile.get('full_name')} ({profile.get('usn')}) - CGPA: {profile.get('cgpa')}, Branch: {profile.get('branch')}, Backlogs: {profile.get('active_backlog')}")
    except Exception as e:
        print(f"Error fetching profiles: {e}")

    # Test the eligibility endpoint
    print("\n3. Testing eligibility endpoint...")
    if profiles_response.data:
        student_id = profiles_response.data[0]['id']
        print(f"Testing with student ID: {student_id}")

        try:
            response = requests.get(f"http://localhost:8001/api/jobs/eligible/{student_id}")
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Endpoint working! Found {result.get('total', 0)} eligible jobs")
                print(f"Response data: {result}")
            else:
                print(f"❌ Endpoint error: {response.status_code} - {response.text}")
        except requests.exceptions.ConnectionError:
            print("❌ Cannot connect to backend server. Is it running on port 8001?")
        except Exception as e:
            print(f"❌ Error testing endpoint: {e}")

if __name__ == "__main__":
    test_eligibility_endpoint()