from typing import List, Dict, Any, Optional
from .base_repository import BaseRepository
from ..schemas.schemas import TransactionCreate, Transaction

class AccountingRepository(BaseRepository):
    """Repository for accounting operations"""

    def __init__(self):
        super().__init__("transactions")

    def get_by_user_id(self, user_id: int) -> List[Dict[str, Any]]:
        """Get all transactions for a user"""
        try:
            return self.get_all({"user_id": user_id})
        except Exception as e:
            print(f"Error getting transactions for user {user_id}: {e}")
            return []  # Return empty list instead of crashing

    def create_transaction(self, transaction: TransactionCreate) -> Optional[Dict[str, Any]]:
        """Create a new transaction"""
        try:
            data = transaction.dict()
            return self.create(data)
        except Exception as e:
            print(f"Error creating transaction: {e}")
            return None

    def get_transaction_by_id(self, transaction_id: int) -> Optional[Dict[str, Any]]:
        """Get transaction by ID"""
        return self.get_by_id(transaction_id)

    def update_transaction(self, transaction_id: int, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update transaction"""
        return self.update(transaction_id, data)

    def delete_transaction(self, transaction_id: int) -> bool:
        """Delete transaction"""
        return self.delete(transaction_id)

    def get_transactions_by_category(self, user_id: int, category: str) -> List[Dict[str, Any]]:
        """Get transactions by category for a user"""
        return self.get_all({"user_id": user_id, "category": category})

    def get_income_expense_summary(self, user_id: int) -> Dict[str, float]:
        """Get income and expense summary for a user"""
        transactions = self.get_by_user_id(user_id)
        total_income = sum(t["amount"] for t in transactions if t["type"] == "income")
        total_expense = sum(t["amount"] for t in transactions if t["type"] == "expense")
        net_profit = total_income - total_expense

        return {
            "total_income": total_income,
            "total_expense": total_expense,
            "net_profit": net_profit
        }
