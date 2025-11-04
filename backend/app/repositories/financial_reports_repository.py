from typing import List, Optional, Dict, Any
from datetime import datetime
from ..core.database import get_supabase_client
from ..schemas.financial_reports import FinancialReport, FinancialReportCreate, TaxReport, TaxReportCreate

class FinancialReportsRepository:
    def __init__(self):
        self.supabase = get_supabase_client()

    async def create_financial_report(self, report: FinancialReportCreate) -> FinancialReport:
        """Create a new financial report"""
        data = {
            "user_id": report.user_id,
            "title": report.title,
            "report_type": report.report_type,
            "content": report.content,
            "file_path": report.file_path,
            "file_size": report.file_size,
            "generated_by_ai": report.generated_by_ai,
            "metadata": report.metadata,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }

        response = self.supabase.table("financial_reports").insert(data).execute()
        return FinancialReport(**response.data[0])

    async def get_financial_reports_by_user(self, user_id: int) -> List[FinancialReport]:
        """Get all financial reports for a user"""
        response = self.supabase.table("financial_reports").select("*").eq("user_id", user_id).execute()
        return [FinancialReport(**item) for item in response.data]

    async def get_financial_report_by_id(self, report_id: int, user_id: int) -> Optional[FinancialReport]:
        """Get a specific financial report by ID"""
        response = self.supabase.table("financial_reports").select("*").eq("id", report_id).eq("user_id", user_id).execute()
        if response.data:
            return FinancialReport(**response.data[0])
        return None

    async def update_financial_report(self, report_id: int, user_id: int, updates: Dict[str, Any]) -> Optional[FinancialReport]:
        """Update a financial report"""
        updates["updated_at"] = datetime.utcnow().isoformat()
        response = self.supabase.table("financial_reports").update(updates).eq("id", report_id).eq("user_id", user_id).execute()
        if response.data:
            return FinancialReport(**response.data[0])
        return None

    async def delete_financial_report(self, report_id: int, user_id: int) -> bool:
        """Delete a financial report"""
        response = self.supabase.table("financial_reports").delete().eq("id", report_id).eq("user_id", user_id).execute()
        return len(response.data) > 0

    async def create_tax_report(self, report: TaxReportCreate) -> TaxReport:
        """Create a new tax report"""
        data = {
            "user_id": report.user_id,
            "title": report.title,
            "report_type": report.report_type,
            "tax_period": report.tax_period,
            "content": report.content,
            "file_path": report.file_path,
            "file_size": report.file_size,
            "generated_by_ai": report.generated_by_ai,
            "metadata": report.metadata,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }

        response = self.supabase.table("tax_reports").insert(data).execute()
        return TaxReport(**response.data[0])

    async def get_tax_reports_by_user(self, user_id: int) -> List[TaxReport]:
        """Get all tax reports for a user"""
        response = self.supabase.table("tax_reports").select("*").eq("user_id", user_id).execute()
        return [TaxReport(**item) for item in response.data]

    async def get_tax_report_by_id(self, report_id: int, user_id: int) -> Optional[TaxReport]:
        """Get a specific tax report by ID"""
        response = self.supabase.table("tax_reports").select("*").eq("id", report_id).eq("user_id", user_id).execute()
        if response.data:
            return TaxReport(**response.data[0])
        return None

    async def update_tax_report(self, report_id: int, user_id: int, updates: Dict[str, Any]) -> Optional[TaxReport]:
        """Update a tax report"""
        updates["updated_at"] = datetime.utcnow().isoformat()
        response = self.supabase.table("tax_reports").update(updates).eq("id", report_id).eq("user_id", user_id).execute()
        if response.data:
            return TaxReport(**response.data[0])
        return None

    async def delete_tax_report(self, report_id: int, user_id: int) -> bool:
        """Delete a tax report"""
        response = self.supabase.table("tax_reports").delete().eq("id", report_id).eq("user_id", user_id).execute()
        return len(response.data) > 0

    async def get_reports_by_type(self, user_id: int, report_type: str) -> List[FinancialReport]:
        """Get financial reports by type"""
        response = self.supabase.table("financial_reports").select("*").eq("user_id", user_id).eq("report_type", report_type).execute()
        return [FinancialReport(**item) for item in response.data]

    async def get_tax_reports_by_period(self, user_id: int, tax_period: str) -> List[TaxReport]:
        """Get tax reports by period"""
        response = self.supabase.table("tax_reports").select("*").eq("user_id", user_id).eq("tax_period", tax_period).execute()
        return [TaxReport(**item) for item in response.data]
