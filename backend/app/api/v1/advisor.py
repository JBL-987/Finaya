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
    user_profile: Dict[str, Any],
    current_user: User = Depends(get_current_user)
):
    """Get investment recommendations"""
    try:
        recommendations = await advisor_service.get_investment_recommendations(user_profile)
        return {
            "success": True,
            "recommendations": [rec.dict() for rec in recommendations]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/tax/strategy", response_model=Dict[str, Any])
async def get_tax_strategy(
    user_income: float,
    user_expenses: Dict[str, float],
    current_user: User = Depends(get_current_user)
):
    """Get tax strategy recommendations"""
    try:
        strategy = await advisor_service.get_tax_strategy(user_income, user_expenses)
        return {
            "success": True,
            "strategy": strategy.dict()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
