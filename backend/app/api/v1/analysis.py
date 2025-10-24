from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ...core.database import get_db
from ...schemas.schemas import AnalysisCreate, Analysis
from ...services.analysis_service import AnalysisService

router = APIRouter()
analysis_service = AnalysisService()

@router.post("/", response_model=dict)
async def create_analysis(
    analysis: AnalysisCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(lambda: {"id": 1})  # Mock current user
):
    """Create a new analysis"""
    try:
        result = await analysis_service.create_analysis(db, analysis, current_user["id"])
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/{analysis_id}", response_model=dict)
async def get_analysis(
    analysis_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(lambda: {"id": 1})  # Mock current user
):
    """Get analysis by ID"""
    try:
        result = await analysis_service.get_analysis(db, analysis_id, current_user["id"])
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis not found"
        )

@router.get("/", response_model=List[dict])
async def get_user_analyses(
    db: Session = Depends(get_db),
    current_user: dict = Depends(lambda: {"id": 1})  # Mock current user
):
    """Get all analyses for current user"""
    try:
        result = await analysis_service.get_user_analyses(db, current_user["id"])
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
