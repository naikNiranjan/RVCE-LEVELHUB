from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config.settings import settings
from app.routes import users

app = FastAPI(
    title="Auixa Hackathon API",
    description="Backend API for Auixa Hackathon project",
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

@app.get("/")
async def root():
    return {"message": "Welcome to Auixa Hackathon API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
