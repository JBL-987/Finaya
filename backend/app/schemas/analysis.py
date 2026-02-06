from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

# Analysis schemas
class AnalysisBase(BaseModel):
    name: str
    location: str
    analysis_type: str

class AnalysisCreate(AnalysisBase):
    data: Dict[str, Any]
    gemini_analysis: Optional[Dict[str, Any]] = None  
class Analysis(AnalysisBase):
    id: str
    user_id: str
    data: Dict[str, Any] 
    created_at: datetime
    updated_at: datetime
    gemini_analysis: Optional[Dict[str, Any]] = None  
    class Config:
        from_attributes = True
