from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

# Area Distribution schema
class AreaDistribution(BaseModel):
    residential: float
    road: float
    openSpace: float

    estimated_population_density: float
    competitor_density_estimate: str
    reasoning: str

# User schemas
class UserBase(BaseModel):
    email: str
    full_name: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: str  # Check string for Firestore UID
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
    data: Dict[str, Any]
    gemini_analysis: Optional[Dict[str, Any]] = None  

class Analysis(AnalysisBase):
    id: str  # Check string for Firestore Doc ID
    user_id: str  # Check string for Firestore UID
    data: Dict[str, Any]  
    created_at: datetime
    updated_at: datetime
    gemini_analysis: Optional[Dict[str, Any]] = None  
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

class FirebaseLogin(BaseModel):
    email: str
    firebase_token: str

