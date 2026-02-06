from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any
from pydantic import BaseModel
from ...schemas.schemas import AnalysisCreate, User
from ...services.analysis_service import AnalysisService
from ...services.gemini_service_analysis import analyze_location_image, calculate_business_metrics, reverse_geocode
from .auth import get_current_user, get_current_user_optional

router = APIRouter()
analysis_service = AnalysisService()

class AIAnalyzeRequest(BaseModel):
    image_base64: str
    image_metadata: Dict[str, Any]

class CalculateRequest(BaseModel):
    location: str
    business_params: Dict[str, Any]
    screenshot_base64: str
    screenshot_metadata: Dict[str, Any]

@router.post("/", response_model=dict)
async def create_analysis(
    analysis: AnalysisCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new analysis"""
    try:
        result = await analysis_service.create_analysis(analysis, current_user.id)
        return result.model_dump()  
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/{analysis_id}", response_model=dict)
async def get_analysis(
    analysis_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get analysis by ID"""
    try:
        result = await analysis_service.get_analysis(analysis_id, current_user.id)
        
        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Analysis not found"
            )
        
        return result.model_dump()  # ✅ Convert to dict
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR in get_analysis: {e}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis not found"
        )

@router.get("/", response_model=List[dict])
async def get_user_analyses(
    current_user: User = Depends(get_current_user)
):
    """Get all analyses for current user"""
    try:
        result = await analysis_service.get_user_analyses(current_user.id)
        return [analysis.model_dump() for analysis in result] 
    except Exception as e:
        print(f"ERROR in get_user_analyses: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

# GEMINI ENDPOINT LAMA — TIDAK DIPAKAI LAGI
# @router.post("/ai-analyze", response_model=Dict[str, Any])
# async def ai_analyze(
#     request: AIAnalyzeRequest
# ):
#     """Analyze map screenshot using Gemini AI"""
#     try:
#         area_distribution, raw_response = await analyze_location_image(
#             request.image_base64, request.image_metadata
#         )
#         return {
#             "success": True,
#             "area_distribution": area_distribution.dict(),
#             "raw_response": raw_response,
#             "image_metadata": request.image_metadata
#         }
#     except Exception as e:
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail=str(e)
#         )

@router.post("/calculate", response_model=Dict[str, Any])
async def calculate_analysis(
    request: CalculateRequest,
    current_user = None
    # current_user: User = Depends(get_current_user_optional)
):
    """Perform full business analysis calculation and save to DB"""
    try:
        area_distribution = await analyze_location_image(
            request.screenshot_base64,
            request.screenshot_metadata
        )

        metrics = await calculate_business_metrics(
            area_distribution,
            request.business_params,
            request.screenshot_metadata
        )

        user_id = current_user.id if current_user else None

        # Parse coordinates and get location name
        try:
            lat, lon = map(float, request.location.split(","))
            location_name = await reverse_geocode(lat, lon)
        except:
            location_name = request.location  # Fallback to original if parsing fails

        analysis_data = {
            "name": f"Business Analysis - {location_name}",
            "location": request.location,
            "analysis_type": "business_profitability",
            "data": {
                "business_params": request.business_params,
                "screenshot_metadata": request.screenshot_metadata,
                "metrics": metrics
            },
            "gemini_analysis": {
                "area_distribution": area_distribution.dict()
            }
        }

        print("DEBUG_ANALYSIS_DATA:", analysis_data)
        print(f"DEBUG_USER_ID: {user_id}")

        try:
            create_model = AnalysisCreate(**analysis_data)
            print("DEBUG_CREATE_MODEL:", create_model)
        except Exception as e:
            print("MODEL_BUILD_ERROR:", e)
            raise HTTPException(status_code=400, detail=f"Failed to build AnalysisCreate: {str(e)}")

        if user_id:
            result = await analysis_service.create_analysis(
                create_model, user_id
            )
            analysis_id = result.id
        else:
            analysis_id = None

        return {
            "success": True,
            "analysis_id": analysis_id,
            "metrics": metrics,
            "area_distribution": area_distribution.dict()
        }
    except Exception as e:
        print("HANDLER_ERROR:", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/analyze", response_model=Dict[str, Any])
async def analyze_only(
    request: CalculateRequest,
    current_user = None
    # current_user: User = Depends(get_current_user_optional)
):
    """Perform business analysis calculation without saving to DB"""
    try:
        area_distribution = await analyze_location_image(
            request.screenshot_base64,
            request.screenshot_metadata
        )

        metrics = await calculate_business_metrics(
            area_distribution,
            request.business_params,
            request.screenshot_metadata
        )

        # Parse coordinates and get location name
        try:
            lat, lon = map(float, request.location.split(","))
            location_name = await reverse_geocode(lat, lon)
        except:
            location_name = request.location  # Fallback to original if parsing fails

        return {
            "success": True,
            "location_name": location_name,
            "metrics": metrics,
            "area_distribution": area_distribution.dict()
        }
    except Exception as e:
        print("ANALYZE_ERROR:", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )