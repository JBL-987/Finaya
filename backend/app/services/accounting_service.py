from typing import List, Dict, Any, Optional
from datetime import datetime
import httpx
import base64
from fastapi import HTTPException, UploadFile
from ..repositories.accounting_repository import AccountingRepository
from ..schemas.schemas import TransactionCreate, Transaction, AccountingReport
from ..core.config import settings

class AccountingService:
    """Service for accounting operations"""

    def __init__(self):
        self.repository = AccountingRepository()

    async def create_transaction(
        self, transaction_data: TransactionCreate, user_id: int, file: Optional[UploadFile] = None
    ) -> Optional[Transaction]:
        """Create a new transaction from data or OCR document"""
        if file:
            # If a file is provided, use OCR
            try:
                ocr_data = await self.process_document_with_ocr(file)
                # Create transaction from OCR data
                transaction_data = TransactionCreate(
                    date=datetime.strptime(ocr_data["date"], "%Y-%m-%d").date(),
                    description=ocr_data["description"],
                    category=ocr_data["category"],
                    amount=ocr_data["amount"],
                    type=ocr_data["type"],
                )
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Error processing OCR data: {e}")

        # Set user_id and create transaction
        transaction_data.user_id = user_id
        created_transaction = self.repository.create_transaction(transaction_data)

        if created_transaction:
            return Transaction(**created_transaction)
        return None

    def get_user_transactions(self, user_id: int) -> List[Transaction]:
        """Get all transactions for a user"""
        data = self.repository.get_by_user_id(user_id)
        return [Transaction(**item) for item in data]

    def get_transaction_by_id(self, transaction_id: int) -> Optional[Transaction]:
        """Get transaction by ID"""
        data = self.repository.get_transaction_by_id(transaction_id)
        if data:
            return Transaction(**data)
        return None

    async def update_transaction(
        self, transaction_id: int, data: Dict[str, Any]
    ) -> Optional[Transaction]:
        """Update transaction"""
        updated_data = self.repository.update_transaction(transaction_id, data)
        if updated_data:
            return Transaction(**updated_data)
        return None

    def delete_transaction(self, transaction_id: int) -> bool:
        """Delete transaction"""
        return self.repository.delete_transaction(transaction_id)

    def get_accounting_report(self, user_id: int) -> AccountingReport:
        """Get accounting report for a user"""
        transactions = self.get_user_transactions(user_id)
        summary = self.repository.get_income_expense_summary(user_id)

        return AccountingReport(
            total_income=summary["total_income"],
            total_expense=summary["total_expense"],
            net_profit=summary["net_profit"],
            transactions=transactions
        )

    def get_transactions_by_category(self, user_id: int, category: str) -> List[Transaction]:
        """Get transactions by category"""
        data = self.repository.get_transactions_by_category(user_id, category)
        return [Transaction(**item) for item in data]

    async def process_document_with_ocr(self, file: UploadFile) -> Dict[str, Any]:
        """Process a document with OCR to extract transaction details"""
        try:
            image_bytes = await file.read()
            image_base64 = base64.b64encode(image_bytes).decode("utf-8")
            image_data_url = f"data:{file.content_type};base64,{image_base64}"

            prompt = """
            Analyze the provided financial document (receipt, invoice, etc.)
            and extract the key information as a JSON object.
            The JSON object should include:
            - "date": Transaction date (YYYY-MM-DD)
            - "description": Brief description of the transaction
            - "category": e.g., "food", "transportation", "utilities"
            - "amount": Total amount as a float
            - "type": "income" or "expense"
            """

            request_body = {
                "model": settings.OPENROUTER_MODEL,
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {"type": "image_url", "image_url": {"url": image_data_url}},
                        ],
                    }
                ],
                "max_tokens": 500,
                "temperature": 0.2,
            }

            headers = {
                "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
            }

            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    json=request_body,
                    headers=headers,
                )

            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"OpenRouter API Error: {response.text}",
                )

            data = response.json()
            content = data["choices"][0]["message"]["content"]

            import json
            extracted_data = json.loads(content)
            return extracted_data

        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Failed to process document with OCR: {str(e)}"
            )
