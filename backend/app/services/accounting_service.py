from typing import List, Dict, Any, Optional
from datetime import datetime
from ..repositories.accounting_repository import AccountingRepository
from ..schemas.schemas import TransactionCreate, Transaction, AccountingReport

class AccountingService:
    """Service for accounting operations"""

    def __init__(self):
        self.repository = AccountingRepository()

    def create_transaction(self, transaction: TransactionCreate, user_id: int) -> Optional[Transaction]:
        """Create a new transaction"""
        transaction.user_id = user_id
        data = self.repository.create_transaction(transaction)
        if data:
            return Transaction(**data)
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

    def update_transaction(self, transaction_id: int, data: Dict[str, Any]) -> Optional[Transaction]:
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
