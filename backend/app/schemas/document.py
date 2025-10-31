from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

# Document position schemas
class DocumentPositionBase(BaseModel):
    document_name: str
    extraction_data: Dict[str, Any]
    transaction_id: Optional[int] = None

class DocumentPositionCreate(DocumentPositionBase):
    user_id: int
    transaction_id: Optional[int] = None

class DocumentPosition(DocumentPositionBase):
    id: int
    user_id: int
    timestamp: datetime

    class Config:
        from_attributes = True
