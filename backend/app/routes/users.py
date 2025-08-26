from fastapi import APIRouter, HTTPException, Depends
from typing import List
from app.models.user import UserCreate, UserResponse, UserUpdate
from app.config.database import get_supabase_client

router = APIRouter(prefix="/users", tags=["users"])

@router.post("/", response_model=UserResponse)
async def create_user(user: UserCreate, supabase=Depends(get_supabase_client)):
    try:
        # Insert user into Supabase
        result = supabase.table("users").insert({
            "email": user.email,
            "name": user.name,
            "password": user.password  # In production, hash this password
        }).execute()
        
        if result.data:
            return result.data[0]
        else:
            raise HTTPException(status_code=400, detail="Failed to create user")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/", response_model=List[UserResponse])
async def get_users(supabase=Depends(get_supabase_client)):
    try:
        result = supabase.table("users").select("*").execute()
        return result.data
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: int, supabase=Depends(get_supabase_client)):
    try:
        result = supabase.table("users").select("*").eq("id", user_id).execute()
        if result.data:
            return result.data[0]
        else:
            raise HTTPException(status_code=404, detail="User not found")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{user_id}", response_model=UserResponse)
async def update_user(user_id: int, user: UserUpdate, supabase=Depends(get_supabase_client)):
    try:
        update_data = {k: v for k, v in user.dict().items() if v is not None}
        result = supabase.table("users").update(update_data).eq("id", user_id).execute()
        
        if result.data:
            return result.data[0]
        else:
            raise HTTPException(status_code=404, detail="User not found")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{user_id}")
async def delete_user(user_id: int, supabase=Depends(get_supabase_client)):
    try:
        result = supabase.table("users").delete().eq("id", user_id).execute()
        if result.data:
            return {"message": "User deleted successfully"}
        else:
            raise HTTPException(status_code=404, detail="User not found")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
