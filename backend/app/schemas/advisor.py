from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

# Advisor schemas
class FinancialGoal(BaseModel):
    name: str
    target_amount: float
    current_amount: float
    deadline: datetime

class InvestmentRecommendation(BaseModel):
    type: str
    name: str
    risk_level: str
    expected_return: float
    description: str

class TaxStrategy(BaseModel):
    deductions: List[str]
    credits: List[str]
    recommendations: List[str]
