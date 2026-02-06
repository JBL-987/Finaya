from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

# Area Distribution schema
class AreaDistribution(BaseModel):
    residential: float
    road: float
    open_space: float
