#!/usr/bin/env python3
"""Test script to check backend status and API endpoints"""

import requests
import json
from datetime import datetime

def test_backend_health():
    """Test if backend is running"""
    try:
        response = requests.get('http://localhost:8001/')
        if response.status_code == 200:
            print("✅ Backend health check: PASSED")
            print(f"   Response: {response.json()}")
            return True
        else:
            print(f"❌ Backend health check: FAILED (Status: {response.status_code})")
            return False
    except Exception as e:
        print(f"❌ Backend health check: ERROR - {str(e)}")
        return False

def test_applications_endpoint():
    """Test the applications endpoint"""
    try:
        response = requests.get('http://localhost:8001/api/jobs/all/applications')
        if response.status_code == 200:
            data = response.json()
            print("✅ Applications endpoint: PASSED")
            print(f"   Success: {data.get('success')}")
            print(f"   Applications count: {len(data.get('data', []))}")
            return True
        else:
            print(f"❌ Applications endpoint: FAILED (Status: {response.status_code})")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Applications endpoint: ERROR - {str(e)}")
        return False

def test_status_update_endpoint():
    """Test the status update endpoint with a mock application ID"""
    try:
        # First get an application to test with
        response = requests.get('http://localhost:8001/api/jobs/all/applications')
        if response.status_code == 200:
            data = response.json()
            applications = data.get('data', [])
            if applications:
                app_id = applications[0]['id']
                print(f"   Testing with application ID: {app_id}")

                # Test status update
                update_response = requests.put(
                    f'http://localhost:8001/api/applications/{app_id}/status',
                    data={'status': 'shortlisted'}
                )

                if update_response.status_code == 200:
                    print("✅ Status update endpoint: PASSED")
                    return True
                else:
                    print(f"❌ Status update endpoint: FAILED (Status: {update_response.status_code})")
                    print(f"   Response: {update_response.text}")
                    return False
            else:
                print("⚠️  No applications found to test status update")
                return True
        return False
    except Exception as e:
        print(f"❌ Status update endpoint: ERROR - {str(e)}")
        return False

def test_jobs_endpoint():
    """Test the jobs endpoint"""
    try:
        response = requests.get('http://localhost:8001/api/jobs')
        if response.status_code == 200:
            data = response.json()
            print("✅ Jobs endpoint: PASSED")
            print(f"   Success: {data.get('success')}")
            print(f"   Jobs count: {len(data.get('data', []))}")
            return True
        else:
            print(f"❌ Jobs endpoint: FAILED (Status: {response.status_code})")
            return False
    except Exception as e:
        print(f"❌ Jobs endpoint: ERROR - {str(e)}")
        return False

def main():
    print("🔍 Testing Backend API Endpoints")
    print("=" * 50)
    print(f"Test Time: {datetime.now()}")
    print()

    tests = [
        ("Backend Health", test_backend_health),
        ("Jobs Endpoint", test_jobs_endpoint),
        ("Applications Endpoint", test_applications_endpoint),
        ("Status Update Endpoint", test_status_update_endpoint),
    ]

    results = []
    for test_name, test_func in tests:
        print(f"🧪 Testing {test_name}...")
        result = test_func()
        results.append(result)
        print()

    print("=" * 50)
    print("📊 Test Results Summary:")
    passed = sum(results)
    total = len(results)
    print(f"   Passed: {passed}/{total}")

    if passed == total:
        print("🎉 All tests passed! Backend is working correctly.")
    else:
        print("⚠️  Some tests failed. Check backend server and database connection.")

    print()
    print("💡 Make sure to:")
    print("   1. Start the backend server: cd RVCE-LEVELHUB/backend && python run.py")
    print("   2. Check database connection in backend/.env")
    print("   3. Verify Supabase credentials are correct")

if __name__ == "__main__":
    main()