from typing import List, Optional
from bson import ObjectId
from app.database import get_database
from app.schemas.user import UserCreate, UserUpdate
from app.models.user import UserModel
from datetime import datetime

class UserService:
    def __init__(self):
        self.collection_name = "users"

    async def get_all_users(self) -> List[dict]:
        db = get_database()
        users = await db[self.collection_name].find().to_list(1000)
        # Convert ObjectId to str for JSON serialization in the service layer if needed, 
        # or handle it in the schema.
        for user in users:
            user["_id"] = str(user["_id"])
        return users

    async def create_user(self, user_data: UserCreate) -> dict:
        db = get_database()
        user_dict = user_data.model_dump()
        user_dict["created_at"] = datetime.utcnow()
        user_dict["updated_at"] = datetime.utcnow()
        
        new_user = await db[self.collection_name].insert_one(user_dict)
        created_user = await db[self.collection_name].find_one({"_id": new_user.inserted_id})
        created_user["_id"] = str(created_user["_id"])
        return created_user

    async def get_user_by_id(self, user_id: str) -> Optional[dict]:
        db = get_database()
        if not ObjectId.is_valid(user_id):
            return None
        user = await db[self.collection_name].find_one({"_id": ObjectId(user_id)})
        if user:
            user["_id"] = str(user["_id"])
        return user

    async def update_user(self, user_id: str, user_data: UserUpdate) -> Optional[dict]:
        db = get_database()
        if not ObjectId.is_valid(user_id):
            return None
        
        update_data = {k: v for k, v in user_data.model_dump().items() if v is not None}
        if not update_data:
            return await self.get_user_by_id(user_id)
            
        update_data["updated_at"] = datetime.utcnow()
        
        await db[self.collection_name].update_one(
            {"_id": ObjectId(user_id)},
            {"$set": update_data}
        )
        return await self.get_user_by_id(user_id)

    async def delete_user(self, user_id: str) -> bool:
        db = get_database()
        if not ObjectId.is_valid(user_id):
            return False
        delete_result = await db[self.collection_name].delete_one({"_id": ObjectId(user_id)})
        return delete_result.deleted_count > 0

user_service = UserService()
