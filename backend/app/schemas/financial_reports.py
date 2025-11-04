from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class FinancialReportBase(BaseModel):
    title: str
    report_type: str  # balance_sheet, income_statement, cash_flow, etc.
    content: Dict[str, Any]  # AI-generated content
    file_path: Optional[str] = None
    file_size: Optional[int] = None
    generated_by_ai: bool = True
    metadata: Optional[Dict[str, Any]] = None

class FinancialReportCreate(FinancialReportBase):
    user_id: int

class FinancialReport(FinancialReportBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class TaxReportBase(BaseModel):
    title: str
    report_type: str  # quarterly_tax, annual_tax, sales_tax, etc.
    tax_period: str  # e.g., "Q1-2025", "2024", etc.
    content: Dict[str, Any]  # AI-generated content
    file_path: Optional[str] = None
    file_size: Optional[int] = None
    generated_by_ai: bool = True
    metadata: Optional[Dict[str, Any]] = None

class TaxReportCreate(TaxReportBase):
    user_id: int

class TaxReport(TaxReportBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class DocumentCategorizationRequest(BaseModel):
    document_name: str
    document_content: str
    document_type: str  # pdf, docx, xlsx, etc.

class DocumentCategorizationResponse(BaseModel):
    category: str  # financial_report, tax_report, transaction_document, etc.
    subcategory: Optional[str] = None  # balance_sheet, income_statement, quarterly_tax, etc.
    confidence: float
    reasoning: str
    suggested_actions: List[str]
