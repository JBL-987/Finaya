from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Dict, Any, Optional
from app.services.places_service import places_service
from app.schemas.schemas import User
from .auth import get_current_user

router = APIRouter()

@router.get("/competitors", response_model=List[Dict[str, Any]])
async def get_competitors(
    lat: float,
    lng: float,
    radius: int = 1000,
    keyword: Optional[str] = "food",
    type: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """
    Get nearby competitors using Google Places API.
    """
    try:
        competitors = await places_service.search_nearby(lat, lng, radius, keyword, type)
        return competitors
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
