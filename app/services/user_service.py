from typing import List, Optional
from bson import ObjectId
from app.database import get_database
from app.schemas.user import UserModel, UserCreate, UserUpdate
from datetime import datetime

class UserService:
    def __init__(self):
        self.collection_name = "users"

    async def get_all_users(self) -> List[UserModel]:
        db = get_database()
        users_raw = await db[self.collection_name].find().to_list(1000)
        return [UserModel(**user) for user in users_raw]

    async def create_user(self, user_data: UserCreate) -> UserModel:
        db = get_database()
        user_dict = user_data.model_dump()
        user_dict["created_at"] = datetime.utcnow()
        user_dict["updated_at"] = datetime.utcnow()
        result = await db[self.collection_name].insert_one(user_dict)
        created_raw = await db[self.collection_name].find_one({"_id": result.inserted_id})
        return UserModel(**created_raw)

    async def get_user_by_id(self, user_id: str) -> Optional[UserModel]:
        if not ObjectId.is_valid(user_id):
            return None
        db = get_database()
        user_raw = await db[self.collection_name].find_one({"_id": ObjectId(user_id)})
        return UserModel(**user_raw) if user_raw else None

    async def update_user(self, user_id: str, user_data: UserUpdate) -> Optional[UserModel]:
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

user_service = UserService()