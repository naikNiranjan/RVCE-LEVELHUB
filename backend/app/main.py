from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config.settings import settings
from app.routes import users, applications, jobs
from fastapi.staticfiles import StaticFiles

app = FastAPI(
    title="Placement Management API",
    description="Backend API for placement management system",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(users.router, prefix="/api")
app.include_router(applications.router, prefix="/api")
app.include_router(jobs.router, prefix="/api/jobs")

# Mount static files for uploaded resumes
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.get("/")
async def root():
    return {"message": "Welcome to Auixa Hackathon API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
