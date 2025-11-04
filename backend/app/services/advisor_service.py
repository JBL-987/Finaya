from typing import List, Dict, Any, Optional
from datetime import datetime
import httpx
import random
import math
import numpy as np
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
        try:
            data = self.repository.get_by_user_id(user_id)
            if not data:
                return []
            return [FinancialGoal(**item) for item in data]
        except Exception as e:
            print(f"Error getting user goals: {e}")
            return []  # Return empty list instead of crashing

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

    def run_monte_carlo_simulation(self, initial_investment: float, risk_level: str, years: int, simulations: int = 1000) -> Dict[str, Any]:
        """
        Run Monte Carlo simulation for investment portfolio using NumPy for advanced mathematical calculations

        Args:
            initial_investment: Starting investment amount
            risk_level: 'conservative', 'moderate', or 'aggressive'
            years: Investment time horizon
            simulations: Number of simulation runs

        Returns:
            Dictionary with simulation results and statistics
        """
        # Risk-adjusted returns based on risk level
        if risk_level == 'conservative':
            avg_return = 0.04  # 4%
            volatility = 0.08  # 8%
        elif risk_level == 'moderate':
            avg_return = 0.07  # 7%
            volatility = 0.12  # 12%
        elif risk_level == 'aggressive':
            avg_return = 0.10  # 10%
            volatility = 0.20  # 20%
        else:
            avg_return = 0.07
            volatility = 0.12

        # Use NumPy for vectorized Monte Carlo simulation
        # Generate random returns for all simulations and years at once
        # Shape: (simulations, years)
        random_returns = np.random.normal(avg_return, volatility, (simulations, years))

        # Calculate cumulative returns for each simulation
        # Each row represents one simulation path over time
        cumulative_returns = np.cumprod(1 + random_returns, axis=1)

        # Calculate final portfolio values
        final_values = initial_investment * cumulative_returns[:, -1]

        # Calculate statistics using NumPy
        median = np.median(final_values)
        percentile10 = np.percentile(final_values, 10)
        percentile90 = np.percentile(final_values, 90)
        best_case = np.max(final_values)
        worst_case = np.min(final_values)

        # Calculate probability of positive returns
        positive_returns = np.sum(final_values > initial_investment)
        probability_positive = (positive_returns / simulations) * 100

        # Create distribution buckets for visualization using NumPy
        min_value = np.min(final_values)
        max_value = np.max(final_values)
        bucket_size = (max_value - min_value) / 20

        # Use NumPy histogram for efficient bucketing
        hist, bin_edges = np.histogram(final_values, bins=20, range=(min_value, max_value))

        # Convert to dictionary format for frontend
        distribution = {}
        for i, count in enumerate(hist):
            bucket_key = round(bin_edges[i], 2)
            distribution[bucket_key] = int(count)

        # Calculate Sharpe ratio (risk-adjusted return)
        sharpe_ratio = (avg_return * 100) / (volatility * 100)

        # Calculate maximum drawdown (worst case loss percentage)
        max_drawdown = ((initial_investment - percentile10) / initial_investment) * 100

        # Calculate additional statistical measures using NumPy
        mean_final_value = np.mean(final_values)
        std_final_value = np.std(final_values)
        skewness = np.mean(((final_values - mean_final_value) / std_final_value) ** 3)
        kurtosis = np.mean(((final_values - mean_final_value) / std_final_value) ** 4) - 3

        # Calculate Value at Risk (VaR) at 95% confidence
        var_95 = np.percentile(final_values, 5)  # 5th percentile
        var_95_percentage = ((initial_investment - var_95) / initial_investment) * 100

        # Calculate Conditional Value at Risk (CVaR) at 95% confidence
        losses = initial_investment - final_values[final_values < var_95]
        cvar_95 = np.mean(losses) if len(losses) > 0 else 0
        cvar_95_percentage = (cvar_95 / initial_investment) * 100

        return {
            "initial_investment": initial_investment,
            "median": median,
            "percentile10": percentile10,
            "percentile90": percentile90,
            "best_case": best_case,
            "worst_case": worst_case,
            "probability_positive": probability_positive,
            "distribution": distribution,
            "simulations": simulations,
            "years": years,
            "avg_return": avg_return * 100,
            "volatility": volatility * 100,
            "sharpe_ratio": sharpe_ratio,
            "max_drawdown": max_drawdown,
            "risk_level": risk_level,
            # Additional NumPy-powered statistics
            "mean_final_value": mean_final_value,
            "std_final_value": std_final_value,
            "skewness": skewness,
            "kurtosis": kurtosis,
            "var_95": var_95,
            "var_95_percentage": var_95_percentage,
            "cvar_95": cvar_95,
            "cvar_95_percentage": cvar_95_percentage,
            # Simulation metadata
            "computation_method": "numpy_vectorized",
            "random_seed": None,  # Could be set for reproducibility
            "computation_time": None  # Could track timing
        }
