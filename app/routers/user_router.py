from typing import List
from fastapi import APIRouter, HTTPException, Depends, status
from app.schemas.user import UserCreate, UserUpdate, UserResponse
from app.services.user_service import user_service

router = APIRouter(prefix="/api/users")

@router.get("/", response_model=List[UserResponse])
async def read_users():
    return await user_service.get_all_users()

@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(user: UserCreate):
    return await user_service.create_user(user)

@router.get("/{user_id}", response_model=UserResponse)
async def read_user(user_id: str):
    user = await user_service.get_user_by_id(user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.put("/{user_id}", response_model=UserResponse)
async def update_user(user_id: str, user: UserUpdate):
    updated_user = await user_service.update_user(user_id, user)
    if updated_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return updated_user

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(user_id: str):
    success = await user_service.delete_user(user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return None
