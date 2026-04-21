from pydantic import BaseModel, Field, ConfigDict, BeforeValidator
from typing import Annotated, Optional
from datetime import datetime
from bson import ObjectId
from app.models.base import MongoBaseModel

class UserModel(MongoBaseModel):
    username: str
    email: str
    full_name: Optional[str] = None

class UserCreate(BaseModel):
    username: str
    email: str
    full_name: Optional[str] = None

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    full_name: Optional[str] = None

class UserResponse(BaseModel):
    username: str
    email: str
    full_name: Optional[str] = None