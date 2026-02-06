from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

# User schemas
class UserBase(BaseModel):
    email: str
    full_name: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    currency_preferences: Optional[Dict[str, float]] = None

    class Config:
        from_attributes = True

class UserPreferences(BaseModel):
    currency_preferences: Dict[str, float]
