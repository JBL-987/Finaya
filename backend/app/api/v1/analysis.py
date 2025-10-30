from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any
from pydantic import BaseModel
from ...schemas.schemas import AnalysisCreate, Analysis, User, AreaDistribution
from ...services.analysis_service import AnalysisService
from ...services.openrouter_service import analyze_location_image, calculate_business_metrics, reverse_geocode
from ...core.exceptions import NotFoundError, ExternalServiceError, ValidationError, BusinessLogicError
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
    result = await analysis_service.create_analysis(analysis, current_user.id)
    return result.model_dump()

@router.get("/{analysis_id}", response_model=dict)
async def get_analysis(
    analysis_id: int,
    current_user: User = Depends(get_current_user)
):
    """Get analysis by ID"""
    result = await analysis_service.get_analysis(analysis_id, current_user.id)

    if not result:
        raise NotFoundError(
            resource_type="Analysis",
            resource_id=str(analysis_id),
            context="Get analysis by ID",
            details={"user_id": current_user.id}
        )

    return result.model_dump()

@router.get("/", response_model=List[dict])
async def get_user_analyses(
    current_user: User = Depends(get_current_user)
):
    """Get all analyses for current user"""
    result = await analysis_service.get_user_analyses(current_user.id)
    return [analysis.model_dump() for analysis in result]

@router.post("/ai-analyze", response_model=Dict[str, Any])
async def ai_analyze(
    request: AIAnalyzeRequest,
    current_user: User = Depends(get_current_user)
):
    """Analyze map screenshot using Finaya AI"""
    try:
        area_distribution, raw_response = await analyze_location_image(
            request.image_base64, request.image_metadata
        )
        return {
            "success": True,
            "area_distribution": area_distribution.dict(),
            "raw_response": raw_response,
            "image_metadata": request.image_metadata
        }
    except Exception as e:
        raise ExternalServiceError(
            service_name="OpenRouter AI",
            operation="analyze_location_image",
            message=f"AI analysis failed: {str(e)}",
            context="AI-powered location analysis",
            details={"request_data": {"image_size": len(request.image_base64), "metadata": request.image_metadata}}
        )

@router.post("/calculate", response_model=Dict[str, Any])
async def calculate_analysis(
    request: CalculateRequest,
    current_user: User = Depends(get_current_user_optional)
):
    """Perform full business analysis calculation and save to DB"""
    try:
        area_distribution, raw_response = await analyze_location_image(
            request.screenshot_base64, request.screenshot_metadata
        )

        metrics = await calculate_business_metrics(
            area_distribution, request.business_params, request.screenshot_metadata
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
            "qwen_analysis": {
                "area_distribution": area_distribution.dict(),
                "raw_response": raw_response
            }
        }

        # Tambah debug log
        print("DEBUG_ANALYSIS_DATA:", analysis_data)
        print(f"DEBUG_USER_ID: {user_id}")

        try:
            create_model = AnalysisCreate(**analysis_data)
            print("DEBUG_CREATE_MODEL:", create_model)
        except Exception as e:
            print("MODEL_BUILD_ERROR:", e)
            raise HTTPException(status_code=400, detail=f"Failed to build AnalysisCreate: {str(e)}")

        # Only save if user is authenticated
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
            "area_distribution": area_distribution.dict(),
            "raw_response": raw_response
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
    current_user: User = Depends(get_current_user_optional)
):
    """Perform business analysis calculation without saving to DB"""
    try:
        area_distribution, raw_response = await analyze_location_image(
            request.screenshot_base64, request.screenshot_metadata
        )

        metrics = await calculate_business_metrics(
            area_distribution, request.business_params, request.screenshot_metadata
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
            "area_distribution": area_distribution.dict(),
            "raw_response": raw_response
        }
    except Exception as e:
        print("ANALYZE_ERROR:", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
