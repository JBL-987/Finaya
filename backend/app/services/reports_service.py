from typing import List, Dict, Any, Optional
from datetime import datetime
from ..repositories.financial_reports_repository import FinancialReportsRepository
from ..schemas.financial_reports import (
    FinancialReportCreate, TaxReportCreate,
    DocumentCategorizationRequest, DocumentCategorizationResponse
)
from ..services.qwen_service import QwenService

class ReportsService:
    def __init__(self):
        self.repository = FinancialReportsRepository()
        self.ai_service = QwenService()

    async def create_financial_report(self, report_data: Dict[str, Any], user_id: int) -> Dict[str, Any]:
        """Create a new financial report"""
        report = FinancialReportCreate(
            user_id=user_id,
            title=report_data.get("title", ""),
            report_type=report_data.get("report_type", ""),
            content=report_data.get("content", {}),
            file_path=report_data.get("file_path"),
            file_size=report_data.get("file_size"),
            generated_by_ai=report_data.get("generated_by_ai", True),
            metadata=report_data.get("metadata", {})
        )

        created_report = await self.repository.create_financial_report(report)
        return {
            "success": True,
            "report": created_report,
            "message": "Financial report created successfully"
        }

    async def create_tax_report(self, report_data: Dict[str, Any], user_id: int) -> Dict[str, Any]:
        """Create a new tax report"""
        report = TaxReportCreate(
            user_id=user_id,
            title=report_data.get("title", ""),
            report_type=report_data.get("report_type", ""),
            tax_period=report_data.get("tax_period", ""),
            content=report_data.get("content", {}),
            file_path=report_data.get("file_path"),
            file_size=report_data.get("file_size"),
            generated_by_ai=report_data.get("generated_by_ai", True),
            metadata=report_data.get("metadata", {})
        )

        created_report = await self.repository.create_tax_report(report)
        return {
            "success": True,
            "report": created_report,
            "message": "Tax report created successfully"
        }

    async def get_user_reports(self, user_id: int) -> Dict[str, Any]:
        """Get all reports for a user"""
        financial_reports = await self.repository.get_financial_reports_by_user(user_id)
        tax_reports = await self.repository.get_tax_reports_by_user(user_id)

        return {
            "success": True,
            "financial_reports": financial_reports,
            "tax_reports": tax_reports,
            "total_financial": len(financial_reports),
            "total_tax": len(tax_reports)
        }

    async def categorize_document(self, request: DocumentCategorizationRequest, user_id: int) -> DocumentCategorizationResponse:
        """Use AI to categorize a document"""
        try:
            # Prepare AI prompt for document categorization
            prompt = f"""
            Analyze this document and categorize it into the appropriate financial/tax document type.

            Document Name: {request.document_name}
            Document Type: {request.document_type}

            Document Content (first 2000 characters):
            {request.document_content[:2000]}

            Based on the document name, type, and content, categorize this document into one of these categories:

            FINANCIAL REPORTS:
            - balance_sheet: Balance sheets, statements of financial position
            - income_statement: Income statements, profit & loss statements, P&L
            - cash_flow_statement: Cash flow statements, cash flow reports
            - financial_ratios: Financial ratio analysis reports
            - budget_reports: Budget vs actual reports

            TAX REPORTS:
            - quarterly_tax: Quarterly tax reports, Q1/Q2/Q3/Q4 tax filings
            - annual_tax: Annual tax returns, yearly tax reports
            - sales_tax: Sales tax reports, VAT reports
            - payroll_tax: Payroll tax reports, employee tax documents
            - tax_audit: Tax audit reports, tax examination documents

            OTHER DOCUMENTS:
            - transaction_document: Bank statements, receipts, invoices
            - legal_document: Contracts, agreements, legal documents
            - miscellaneous: Other documents that don't fit above categories

            Respond with a JSON object containing:
            {{
                "category": "financial_report|tax_report|other",
                "subcategory": "specific_type_from_above",
                "confidence": 0.0-1.0,
                "reasoning": "brief explanation",
                "suggested_actions": ["action1", "action2"]
            }}
            """

            # Get AI response
            ai_response = await self.ai_service.generate_financial_analysis(
                prompt=prompt,
                context="Document categorization for financial management system"
            )

            # Parse AI response
            try:
                # Try to extract JSON from AI response
                response_text = ai_response.get("analysis", "")
                if isinstance(response_text, dict):
                    categorization = response_text
                else:
                    # Try to parse JSON from text
                    import json
                    import re

                    # Look for JSON in the response
                    json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
                    if json_match:
                        categorization = json.loads(json_match.group())
                    else:
                        # Fallback categorization
                        categorization = {
                            "category": "other",
                            "subcategory": "miscellaneous",
                            "confidence": 0.5,
                            "reasoning": "Unable to determine document type from AI analysis",
                            "suggested_actions": ["Review document manually", "Contact support"]
                        }

                return DocumentCategorizationResponse(**categorization)

            except Exception as parse_error:
                print(f"Error parsing AI categorization response: {parse_error}")
                # Return fallback response
                return DocumentCategorizationResponse(
                    category="other",
                    subcategory="miscellaneous",
                    confidence=0.3,
                    reasoning="Error processing AI categorization",
                    suggested_actions=["Review document manually"]
                )

        except Exception as e:
            print(f"Error in document categorization: {e}")
            return DocumentCategorizationResponse(
                category="other",
                subcategory="miscellaneous",
                confidence=0.0,
                reasoning=f"Error: {str(e)}",
                suggested_actions=["Try again later", "Contact support"]
            )

    async def generate_financial_report(self, report_type: str, transactions: List[Dict[str, Any]], user_id: int) -> Dict[str, Any]:
        """Generate a financial report using AI"""
        try:
            # Prepare data for AI analysis
            financial_data = self._analyze_financial_data(transactions)

            # Generate AI-powered report content
            prompt = f"""
            Generate a comprehensive {report_type.replace('_', ' ')} based on the following financial data:

            Financial Summary:
            - Total Income: ${financial_data['total_income']}
            - Total Expenses: ${financial_data['total_expenses']}
            - Net Income: ${financial_data['net_income']}
            - Transaction Count: {financial_data['transaction_count']}

            Recent Transactions (last 10):
            {financial_data['recent_transactions'][:10]}

            Please generate a professional {report_type.replace('_', ' ')} that includes:
            1. Executive Summary
            2. Key Financial Metrics
            3. Detailed Analysis
            4. Trends and Insights
            5. Recommendations

            Format the response as a structured JSON object with sections.
            """

            ai_response = await self.ai_service.generate_financial_analysis(
                prompt=prompt,
                context=f"Generate {report_type} report"
            )

            # Create report in database
            report_data = {
                "title": f"{report_type.replace('_', ' ').title()} Report - {datetime.now().strftime('%B %Y')}",
                "report_type": report_type,
                "content": ai_response.get("analysis", {}),
                "generated_by_ai": True,
                "metadata": {
                    "generated_at": datetime.utcnow().isoformat(),
                    "data_points": financial_data['transaction_count'],
                    "period": datetime.now().strftime('%Y-%m')
                }
            }

            result = await self.create_financial_report(report_data, user_id)
            return result

        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to generate report: {str(e)}"
            }

    async def generate_tax_report(self, report_type: str, tax_period: str, transactions: List[Dict[str, Any]], user_id: int) -> Dict[str, Any]:
        """Generate a tax report using AI"""
        try:
            # Filter tax-related transactions
            tax_transactions = [
                t for t in transactions
                if t.get('category') and (
                    'tax' in t['category'].lower() or
                    'tax' in t.get('description', '').lower() or
                    'pajak' in t['category'].lower()
                )
            ]

            # Generate AI-powered tax report
            transaction_details = "\n".join([
                f"- {t.get('date', 'N/A')}: {t.get('description', 'N/A')} - ${t.get('amount', 0)}"
                for t in tax_transactions[:10]  # Limit to first 10
            ])

            prompt = f"""
            Generate a comprehensive {report_type.replace('_', ' ')} for tax period {tax_period}.

            Tax-related transactions found: {len(tax_transactions)}

            Transaction details:
            {transaction_details}

            Please generate a professional tax report that includes:
            1. Tax Period Summary
            2. Taxable Income Calculation
            3. Tax Liability Assessment
            4. Deductions and Credits
            5. Compliance Recommendations

            Format as structured JSON.
            """

            ai_response = await self.ai_service.generate_financial_analysis(
                prompt=prompt,
                context=f"Generate {report_type} tax report for {tax_period}"
            )

            # Create tax report in database
            report_data = {
                "title": f"{report_type.replace('_', ' ').title()} - {tax_period}",
                "report_type": report_type,
                "tax_period": tax_period,
                "content": ai_response.get("analysis", {}),
                "generated_by_ai": True,
                "metadata": {
                    "generated_at": datetime.utcnow().isoformat(),
                    "tax_period": tax_period,
                    "transaction_count": len(tax_transactions)
                }
            }

            result = await self.create_tax_report(report_data, user_id)
            return result

        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to generate tax report: {str(e)}"
            }

    def _analyze_financial_data(self, transactions: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze financial data from transactions"""
        total_income = sum(
            float(t.get('amount', 0)) for t in transactions
            if t.get('transactionType') == 'income'
        )

        total_expenses = sum(
            float(t.get('amount', 0)) for t in transactions
            if t.get('transactionType') == 'expense'
        )

        # Sort transactions by date (newest first) and get first 10
        sorted_transactions = sorted(
            transactions,
            key=lambda t: t.get('date', ''),
            reverse=True
        )

        recent_transactions = [
            {
                'date': t.get('date', 'N/A'),
                'description': t.get('description', 'N/A'),
                'amount': t.get('amount', 0),
                'type': t.get('transactionType', 'N/A')
            }
            for t in sorted_transactions[:10]
        ]

        return {
            "total_income": total_income,
            "total_expenses": total_expenses,
            "net_income": total_income - total_expenses,
            "transaction_count": len(transactions),
            "recent_transactions": recent_transactions
        }
