#!/usr/bin/env python3
"""
Simple script to start the FastAPI backend server
"""
import os
import sys
import subprocess

def main():
    print("🚀 Starting RVCE LevelHub Backend Server...")

    # Change to backend directory
    backend_dir = os.path.join(os.path.dirname(__file__), "backend")
    os.chdir(backend_dir)

    # Install dependencies if needed
    print("📦 Installing dependencies...")
    subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"], check=True)

    # Start the server
    print("🌐 Starting FastAPI server on http://localhost:8001")
    print("📊 API docs available at: http://localhost:8001/docs")
    print("🔄 Press Ctrl+C to stop the server")

    try:
        subprocess.run([sys.executable, "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001", "--reload"], check=True)
    except KeyboardInterrupt:
        print("\n👋 Server stopped by user")
    except subprocess.CalledProcessError as e:
        print(f"❌ Error starting server: {e}")
        return 1

    return 0

if __name__ == "__main__":
    sys.exit(main())