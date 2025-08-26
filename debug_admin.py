#!/usr/bin/env python3
"""
Debug script to test admin functionality
"""
import requests
import json
from datetime import datetime

def test_backend_health():
    """Test if backend is running"""
    print("🔍 Testing backend health...")

    try:
        response = requests.get('http://localhost:8001/health', timeout=5)
        if response.status_code == 200:
            print("✅ Backend is running on port 8001")
            print(f"Response: {response.json()}")
            return True
        else:
            print(f"❌ Backend returned status {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend on port 8001")
        print("Please start the backend server:")
        print("  cd RVCE-LEVELHUB/backend")
        print("  python run.py")
        return False
    except Exception as e:
        print(f"❌ Error testing backend: {e}")
        return False

def test_applications_endpoint():
    """Test applications endpoint"""
    print("\n🔍 Testing applications endpoint...")

    try:
        response = requests.get('http://localhost:8001/api/applications/test', timeout=5)
        print(f"Applications endpoint status: {response.status_code}")
        return response.status_code < 400
    except Exception as e:
        print(f"❌ Error testing applications endpoint: {e}")
        return False

def test_supabase_connection():
    """Test Supabase connection"""
    print("\n🔍 Testing Supabase connection...")

    try:
        # Import supabase
        import os
        from supabase import create_client

        # Load environment variables
        supabase_url = os.getenv('SUPABASE_URL', 'https://nuhyjfggcoueebijauvo.supabase.co')
        supabase_key = os.getenv('SUPABASE_KEY', 'your-key-here')

        supabase = create_client(supabase_url, supabase_key)

        # Test connection by trying to get jobs
        response = supabase.table('jobs').select('*').limit(1).execute()

        if response.data is not None:
            print("✅ Supabase connection successful")
            print(f"Found {len(response.data)} jobs in database")
            if response.data:
                job = response.data[0]
                print(f"Sample job: {job.get('company_name')} - {job.get('role')}")
            return True
        else:
            print("❌ Supabase query failed")
            return False

    except Exception as e:
        print(f"❌ Error testing Supabase: {e}")
        return False

def main():
    print("🚀 DEBUG: Admin Functionality Test")
    print("=" * 50)

    # Test backend
    backend_ok = test_backend_health()

    if backend_ok:
        # Test endpoints
        apps_ok = test_applications_endpoint()

        # Test Supabase
        supabase_ok = test_supabase_connection()

        print("\n" + "=" * 50)
        print("📊 SUMMARY:")
        print(f"Backend: {'✅' if backend_ok else '❌'}")
        print(f"Applications API: {'✅' if apps_ok else '❌'}")
        print(f"Supabase: {'✅' if supabase_ok else '❌'}")

        if backend_ok and apps_ok and supabase_ok:
            print("\n🎉 All systems operational!")
            print("\nTo test admin functionality:")
            print("1. Open browser and go to the admin dashboard")
            print("2. Try creating a job posting")
            print("3. Check if jobs appear in the list")
            print("4. Try the view/edit/delete buttons")
        else:
            print("\n⚠️  Some systems are not working. Check the errors above.")
    else:
        print("\n❌ Backend is not running. Please start it first.")

if __name__ == "__main__":
    main()