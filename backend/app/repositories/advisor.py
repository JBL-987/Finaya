from typing import List, Dict, Any, Optional
from .base_repository import BaseRepository
from ..schemas.schemas import FinancialGoal

class AdvisorRepository(BaseRepository):
    """Repository for advisor operations"""

    def __init__(self):
        super().__init__("financial_goals")

    def get_by_user_id(self, user_id: int) -> List[Dict[str, Any]]:
        """Get all financial goals for a user"""
        return self.get_all({"user_id": user_id})

    def create_goal(self, goal: FinancialGoal, user_id: int) -> Optional[Dict[str, Any]]:
        """Create a new financial goal"""
        data = goal.dict()
        data["user_id"] = user_id
        return self.create(data)

    def get_goal_by_id(self, goal_id: int) -> Optional[Dict[str, Any]]:
        """Get goal by ID"""
        return self.get_by_id(goal_id)

    def update_goal(self, goal_id: int, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update goal"""
        return self.update(goal_id, data)

    def delete_goal(self, goal_id: int) -> bool:
        """Delete goal"""
        return self.delete(goal_id)
