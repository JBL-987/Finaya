from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

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
