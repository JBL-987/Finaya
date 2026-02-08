from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from ...services.agent_service import get_finaya_agent
from ...schemas.schemas import User
from .auth import get_current_user
import json

router = APIRouter()

class ChatMessage(BaseModel):
    role: str
    text: str

class AdvisorRequest(BaseModel):
    query: str
    context_data: Dict[str, Any]
    history: List[ChatMessage] = []
    user_id: Optional[str] = None

class ExplorationRequest(BaseModel):
    lat: float
    lng: float
    business_params: Dict[str, Any]

class ExecutiveSummaryRequest(BaseModel):
    context_data: Dict[str, Any]

class CompetitorImpactRequest(BaseModel):
    current_data: Dict[str, Any]
    new_competitor: Dict[str, Any]

class CompetitorSentimentRequest(BaseModel):
    reviews_text: str

@router.post("/advise", response_model=Dict[str, str])
async def get_agent_advice(
    request: AdvisorRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Get strategic business advice from the Finaya AI Agent based on analysis context.
    """
    try:
        advice = await get_finaya_agent().run_advisor_task(
            request.query, 
            request.context_data, 
            request.history, 
            request.user_id
        )
        return {"advice": advice}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/explore", response_model=List[Dict[str, Any]])
async def explore_nearby(
    request: ExplorationRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Autonomous exploration suggestion for nearby potential high-yield spots.
    """
    try:
        suggestions = await get_finaya_agent().autonomous_search_suggestion(
            request.lat, request.lng, request.business_params
        )
        return suggestions
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/executive_summary", response_model=Dict[str, str])
async def get_executive_summary(
    request: ExecutiveSummaryRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Generates a formal investor-ready Executive Summary.
    """
    try:
        summary = await get_finaya_agent().generate_executive_summary(request.context_data)
        return {"summary": summary}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/simulate_competitor_impact", response_model=Dict[str, Any])
async def simulate_competitor_impact_endpoint(
    request: CompetitorImpactRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Simulates the impact of a new hypothetical competitor.
    """
    try:
        impact = await get_finaya_agent().simulate_competitor_impact(
            request.current_data, 
            request.new_competitor
        )
        return impact
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/analyze_competitor_sentiment", response_model=Dict[str, Any])
async def analyze_competitor_sentiment_endpoint(
    request: CompetitorSentimentRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Analyzes sentiment from competitor reviews to find market gaps.
    """
    try:
        sentiment_analysis = await get_finaya_agent().analyze_competitor_sentiment(
            request.reviews_text
        )
        return sentiment_analysis
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
