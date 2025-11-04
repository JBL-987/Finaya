from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

# Area Distribution schema
class AreaDistribution(BaseModel):
    residential: float
    road: float
    openSpace: float

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

# Auth schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

# Accounting schemas
class TransactionBase(BaseModel):
    date: datetime
    description: str
    amount: float
    category: str
    type: str  # income, expense, transfer, asset purchase, liability, or equity
    payment_method: Optional[str] = None
    reference: Optional[str] = None
    tax_deductible: Optional[bool] = False
    source_file: Optional[str] = None

class TransactionCreate(TransactionBase):
    user_id: Optional[int] = None  # Set automatically from JWT token

class Transaction(TransactionBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class AccountingReport(BaseModel):
    total_income: float
    total_expense: float
    net_profit: float
    transactions: List[Transaction]

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
