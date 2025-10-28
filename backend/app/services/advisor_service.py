from typing import List, Dict, Any, Optional
from datetime import datetime
import httpx
from ..repositories.advisor import AdvisorRepository
from ..schemas.schemas import FinancialGoal, InvestmentRecommendation, TaxStrategy
from ..core.config import settings

class AdvisorService:
    """Service for financial advisor operations"""

    def __init__(self):
        self.repository = AdvisorRepository()
        self.openrouter_url = "https://openrouter.ai/api/v1/chat/completions"

    def create_goal(self, goal: FinancialGoal, user_id: int) -> Optional[FinancialGoal]:
        """Create a new financial goal"""
        data = self.repository.create_goal(goal, user_id)
        if data:
            return FinancialGoal(**data)
        return None

    def get_user_goals(self, user_id: int) -> List[FinancialGoal]:
        """Get all goals for a user"""
        data = self.repository.get_by_user_id(user_id)
        return [FinancialGoal(**item) for item in data]

    def get_goal_by_id(self, goal_id: int) -> Optional[FinancialGoal]:
        """Get goal by ID"""
        data = self.repository.get_goal_by_id(goal_id)
        if data:
            return FinancialGoal(**data)
        return None

    def update_goal(self, goal_id: int, data: Dict[str, Any]) -> Optional[FinancialGoal]:
        """Update goal"""
        updated_data = self.repository.update_goal(goal_id, data)
        if updated_data:
            return FinancialGoal(**updated_data)
        return None

    def delete_goal(self, goal_id: int) -> bool:
        """Delete goal"""
        return self.repository.delete_goal(goal_id)

    async def get_investment_recommendations(self, user_profile: Dict[str, Any]) -> List[InvestmentRecommendation]:
        """Get investment recommendations using Qwen AI"""
        prompt = f"""
        Based on the user's financial profile, provide 3 investment recommendations.
        User profile: {user_profile}

        Respond with JSON array of recommendations, each with:
        - type: stock, bond, mutual_fund, etc.
        - name: specific name
        - risk_level: low, medium, high
        - expected_return: percentage
        - description: brief explanation
        """

        request_body = {
            "model": settings.OPENROUTER_MODEL,
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 500,
            "temperature": 0.7
        }

        headers = {
            "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
            "HTTP-Referer": "http://localhost:5174",
            "X-Title": "Finaya",
            "Content-Type": "application/json"
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(self.openrouter_url, json=request_body, headers=headers)
                if response.status_code == 200:
                    data = response.json()
                    content = data["choices"][0]["message"]["content"]
                    # Parse JSON response
                    import json
                    recommendations = json.loads(content)
                    return [InvestmentRecommendation(**rec) for rec in recommendations]
        except Exception as e:
            print(f"Error getting investment recommendations: {e}")

        # Fallback recommendations
        return [
            InvestmentRecommendation(
                type="mutual_fund",
                name="Conservative Growth Fund",
                risk_level="low",
                expected_return=5.0,
                description="A safe investment for beginners"
            ),
            InvestmentRecommendation(
                type="stock",
                name="Tech Growth ETF",
                risk_level="medium",
                expected_return=8.0,
                description="Balanced growth with moderate risk"
            ),
            InvestmentRecommendation(
                type="bond",
                name="Government Bonds",
                risk_level="low",
                expected_return=3.0,
                description="Very safe investment option"
            )
        ]

    async def get_tax_strategy(self, user_income: float, user_expenses: Dict[str, float]) -> TaxStrategy:
        """Get tax strategy recommendations using Qwen AI"""
        prompt = f"""
        Provide tax strategy advice for a user with annual income ${user_income} and expenses: {user_expenses}.

        Respond with JSON containing:
        - deductions: list of possible deductions
        - credits: list of possible credits
        - recommendations: list of tax saving tips
        """

        request_body = {
            "model": settings.OPENROUTER_MODEL,
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 500,
            "temperature": 0.7
        }

        headers = {
            "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
            "HTTP-Referer": "http://localhost:5174",
            "X-Title": "Finaya",
            "Content-Type": "application/json"
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(self.openrouter_url, json=request_body, headers=headers)
                if response.status_code == 200:
                    data = response.json()
                    content = data["choices"][0]["message"]["content"]
                    import json
                    strategy_data = json.loads(content)
                    return TaxStrategy(**strategy_data)
        except Exception as e:
            print(f"Error getting tax strategy: {e}")

        # Fallback strategy
        return TaxStrategy(
            deductions=["Home office expenses", "Business mileage", "Retirement contributions"],
            credits=["Education credits", "Energy credits"],
            recommendations=["Maximize retirement contributions", "Consider tax-loss harvesting", "Keep detailed records"]
        )
