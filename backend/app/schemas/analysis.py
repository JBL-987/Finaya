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
    qwen_analysis: Optional[Dict[str, Any]] = None  
class Analysis(AnalysisBase):
    id: int
    user_id: int
    data: Dict[str, Any]  # ✅ Tambahkan field data yang hilang
    created_at: datetime
    updated_at: datetime
    openrouter_analysis: Optional[Dict[str, Any]] = None  
    class Config:
        from_attributes = True
