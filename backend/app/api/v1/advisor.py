from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any
from ...schemas.schemas import FinancialGoal, InvestmentRecommendation, TaxStrategy, User
from ...services.advisor_service import AdvisorService
from .auth import get_current_user

router = APIRouter()
advisor_service = AdvisorService()

@router.post("/goals", response_model=FinancialGoal, status_code=status.HTTP_201_CREATED)
async def create_goal(
    goal: FinancialGoal, current_user: User = Depends(get_current_user)
):
    """Create a new financial goal"""
    try:
        new_goal = advisor_service.create_goal(goal, current_user.id)
        if not new_goal:
            raise HTTPException(status_code=400, detail="Failed to create goal")
        return new_goal
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/goals", response_model=List[FinancialGoal])
async def get_user_goals(current_user: User = Depends(get_current_user)):
    """Get all goals for current user"""
    try:
        return advisor_service.get_user_goals(current_user.id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/goals/{goal_id}", response_model=FinancialGoal)
async def get_goal(goal_id: int, current_user: User = Depends(get_current_user)):
    """Get goal by ID"""
    try:
        goal = advisor_service.get_goal_by_id(goal_id)
        if not goal or goal.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Goal not found")
        return goal
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/goals/{goal_id}", response_model=FinancialGoal)
async def update_goal(
    goal_id: int,
    update_data: Dict[str, Any],
    current_user: User = Depends(get_current_user),
):
    """Update goal"""
    try:
        goal = advisor_service.get_goal_by_id(goal_id)
        if not goal or goal.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Goal not found")

        updated = advisor_service.update_goal(goal_id, update_data)
        if not updated:
            raise HTTPException(status_code=400, detail="Failed to update goal")
        return updated
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/goals/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_goal(goal_id: int, current_user: User = Depends(get_current_user)):
    """Delete goal"""
    try:
        goal = advisor_service.get_goal_by_id(goal_id)
        if not goal or goal.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Goal not found")

        if not advisor_service.delete_goal(goal_id):
            raise HTTPException(status_code=400, detail="Failed to delete goal")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post(
    "/investments/recommendations", response_model=List[InvestmentRecommendation]
)
async def get_investment_recommendations(
    user_profile: Dict[str, Any], current_user: User = Depends(get_current_user)
):
    """Get investment recommendations"""
    try:
        return await advisor_service.get_investment_recommendations(user_profile)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/tax/strategy", response_model=TaxStrategy)
async def get_tax_strategy(
    user_income: float,
    user_expenses: Dict[str, float],
    current_user: User = Depends(get_current_user),
):
    """Get tax strategy recommendations"""
    try:
        return await advisor_service.get_tax_strategy(user_income, user_expenses)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
