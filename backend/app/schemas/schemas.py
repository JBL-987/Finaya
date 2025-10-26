from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

# Area Distribution schema
class AreaDistribution(BaseModel):
    residential: float
    road: float
    open_space: float

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

    class Config:
        from_attributes = True

# Analysis schemas
class AnalysisBase(BaseModel):
    name: str
    location: str
    analysis_type: str

class AnalysisCreate(AnalysisBase):
    data: Dict[str, Any]  # ✅ Lebih spesifik dengan type hint
    qwen_analysis: Optional[Dict[str, Any]] = None  # ✅ UBAH: gemini_analysis → qwen_analysis

class Analysis(AnalysisBase):
    id: int
    user_id: int
    data: Dict[str, Any]  # ✅ Tambahkan field data yang hilang
    created_at: datetime
    updated_at: datetime
    qwen_analysis: Optional[Dict[str, Any]] = None  # ✅ UBAH: gemini_analysis → qwen_analysis

    class Config:
        from_attributes = True

# Auth schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str