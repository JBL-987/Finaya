from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any
from ...schemas.schemas import FinancialGoal, InvestmentRecommendation, TaxStrategy, User
from ...services.advisor_service import AdvisorService
from .auth import get_current_user

router = APIRouter()
advisor_service = AdvisorService()

@router.post("/goals", response_model=Dict[str, Any])
async def create_goal(
    goal: FinancialGoal,
    current_user: User = Depends(get_current_user)
):
    """Create a new financial goal"""
    try:
        result = advisor_service.create_goal(goal, current_user.id)
        if result:
            return {"success": True, "goal": result.dict()}
        raise HTTPException(status_code=400, detail="Failed to create goal")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/goals", response_model=List[Dict[str, Any]])
async def get_user_goals(
    current_user: User = Depends(get_current_user)
):
    """Get all goals for current user"""
    try:
        goals = advisor_service.get_user_goals(current_user.id)
        return [g.dict() for g in goals]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/goals/{goal_id}", response_model=Dict[str, Any])
async def get_goal(
    goal_id: int,
    current_user: User = Depends(get_current_user)
):
    """Get goal by ID"""
    try:
        goal = advisor_service.get_goal_by_id(goal_id)
        if not goal or goal.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Goal not found")
        return goal.dict()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/goals/{goal_id}", response_model=Dict[str, Any])
async def update_goal(
    goal_id: int,
    update_data: Dict[str, Any],
    current_user: User = Depends(get_current_user)
):
    """Update goal"""
    try:
        goal = advisor_service.get_goal_by_id(goal_id)
        if not goal or goal.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Goal not found")

        updated = advisor_service.update_goal(goal_id, update_data)
        if updated:
            return {"success": True, "goal": updated.dict()}
        raise HTTPException(status_code=400, detail="Failed to update goal")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/goals/{goal_id}")
async def delete_goal(
    goal_id: int,
    current_user: User = Depends(get_current_user)
):
    """Delete goal"""
    try:
        goal = advisor_service.get_goal_by_id(goal_id)
        if not goal or goal.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Goal not found")

        success = advisor_service.delete_goal(goal_id)
        if success:
            return {"success": True, "message": "Goal deleted"}
        raise HTTPException(status_code=400, detail="Failed to delete goal")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/investments/recommendations", response_model=Dict[str, Any])
async def get_investment_recommendations(
    request_data: Dict[str, Any],  # Changed from user_profile to request_data for AI
    current_user: User = Depends(get_current_user)
):
    """Get AI-powered investment recommendations"""
    try:
        from ...services.openrouter_service_management import generate_investment_recommendations

        risk_level = request_data.get("risk_level", "moderate")
        investment_horizon = request_data.get("investment_horizon", 10)
        investment_amount = request_data.get("investment_amount", 500)

        recommendations = await generate_investment_recommendations(risk_level, investment_horizon, investment_amount)
        return {
            "success": True,
            "recommendations": recommendations
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/investments/recommendations", response_model=Dict[str, Any])
async def get_stored_investment_recommendations(
    current_user: User = Depends(get_current_user)
):
    """Get stored investment recommendations for the current user"""
    try:
        # For now, return a message that recommendations need to be generated
        # In a full implementation, this would retrieve from database/cache
        return {
            "success": True,
            "message": "Use POST /advisor/investments/recommendations to generate new recommendations",
            "recommendations": []
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/tax/strategy", response_model=Dict[str, Any])
async def get_tax_strategy(
    request_data: Dict[str, Any],  # Changed from separate params to request_data for AI
    current_user: User = Depends(get_current_user)
):
    """Get AI-powered tax strategy recommendations"""
    try:
        from ...services.openrouter_service_management import generate_tax_strategy

        income_amount = request_data.get("income_amount", 0)
        expense_breakdown = request_data.get("expense_breakdown", {})
        filing_status = request_data.get("filing_status", "single")

        strategy = await generate_tax_strategy(income_amount, expense_breakdown, filing_status)
        return {
            "success": True,
            "strategy": strategy
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# AI-powered financial planning endpoint
@router.post("/financial-plan", response_model=Dict[str, Any])
async def generate_financial_plan(
    request_data: Dict[str, Any],
    current_user: User = Depends(get_current_user)
):
    """Generate AI-powered comprehensive financial plan"""
    try:
        from ...services.openrouter_service_management import generate_financial_plan

        yearly_income = request_data.get("yearly_income", 0)
        monthly_goals = request_data.get("monthly_goals", {})
        risk_tolerance = request_data.get("risk_tolerance", "moderate")

        plan = await generate_financial_plan(yearly_income, monthly_goals, risk_tolerance)
        return {
            "success": True,
            "plan": plan
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/monte-carlo", response_model=Dict[str, Any])
async def run_monte_carlo_simulation(
    request_data: Dict[str, Any],
    current_user: User = Depends(get_current_user)
):
    """Run Monte Carlo simulation for investment portfolio"""
    try:
        initial_investment = request_data.get("initial_investment", 0)
        risk_level = request_data.get("risk_level", "moderate")
        years = request_data.get("years", 10)
        simulations = request_data.get("simulations", 1000)

        if initial_investment <= 0:
            raise HTTPException(status_code=400, detail="Initial investment must be greater than 0")

        if years <= 0 or years > 50:
            raise HTTPException(status_code=400, detail="Years must be between 1 and 50")

        if simulations < 100 or simulations > 10000:
            raise HTTPException(status_code=400, detail="Simulations must be between 100 and 10,000")

        results = advisor_service.run_monte_carlo_simulation(
            initial_investment=float(initial_investment),
            risk_level=risk_level,
            years=int(years),
            simulations=int(simulations)
        )

        return {
            "success": True,
            "results": results
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
