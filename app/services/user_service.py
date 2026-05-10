from typing import List, Optional
from bson import ObjectId
from app.database import get_database
from app.schemas.user import UserModel, UserCreate, UserUpdate, UserResponse
from datetime import datetime
import logging
logger = logging.getLogger("fastapi-server")

class UserService:
    def __init__(self):
        self.collection_name = "users"

    async def get_all_users(self) -> List[UserResponse]:
        db = get_database()
        users_raw = await db[self.collection_name].find().to_list(1000)
        logger.critical(f"Found all users")
        return [UserResponse(**user) for user in users_raw]

    async def create_user(self, user_data: UserCreate) -> UserResponse:
        db = get_database()
        
        # Check if user already exists
        existing_user = await db[self.collection_name].find_one({"email": user_data.email})
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
            
        user_dict = user_data.model_dump()
        user_dict["created_at"] = datetime.utcnow()
        user_dict["updated_at"] = datetime.utcnow()
        result = await db[self.collection_name].insert_one(user_dict)
        created_raw = await db[self.collection_name].find_one({"_id": result.inserted_id})
        return UserResponse(**created_raw)

    async def get_user_by_id(self, user_id: str) -> Optional[UserResponse]:
        if not ObjectId.is_valid(user_id):
            return None
        db = get_database()
        user_raw = await db[self.collection_name].find_one({"_id": ObjectId(user_id)})
        return UserResponse(**user_raw) if user_raw else None

    async def update_user(self, user_id: str, user_data: UserUpdate) -> Optional[UserResponse]:
        if not ObjectId.is_valid(user_id):
            return None
        db = get_database()
        update_dict = {k: v for k, v in user_data.model_dump().items() if v is not None}
        if update_dict:
            update_dict["updated_at"] = datetime.utcnow()
            await db[self.collection_name].update_one(
                {"_id": ObjectId(user_id)},
                {"$set": update_dict}
            )
        return await self.get_user_by_id(user_id)

    async def delete_user(self, user_id: str) -> bool:
        if not ObjectId.is_valid(user_id):
            return False
        db = get_database()
        result = await db[self.collection_name].delete_one({"_id": ObjectId(user_id)})
        return result.deleted_count > 0

    async def get_user_by_name(self, username: str) -> Optional[UserResponse]:
        db = get_database()
        # DANGEROUS: Using raw strings/dict with unvalidated input
        # In MongoDB, a user could pass {"$ne": null} as the username via JSON
        print(username) #try to print what user inputs
        user_raw = await db[self.collection_name].find_one({"username": username})
        return UserResponse(**user_raw) if user_raw else None

user_service = UserService()