from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

# Accounting schemas
class TransactionBase(BaseModel):
    date: datetime
    description: str
    amount: float
    category: str
    type: str  # income or expense

class TransactionCreate(TransactionBase):
    user_id: int

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
