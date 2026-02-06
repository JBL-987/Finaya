from typing import List, Dict, Any, Optional
from ..repositories.analysis_repository import AnalysisRepository
from ..core.exceptions import NotFoundError, DatabaseError, ValidationError
from ..schemas.schemas import AnalysisCreate, Analysis


class AnalysisService:
    """Service for analysis business logic"""
    
    def __init__(self):
        self.analysis_repo = AnalysisRepository()
    
    async def create_analysis(self, analysis_data: AnalysisCreate, user_id: str) -> Analysis:
        """Create a new analysis"""
        try:
            # Validate required fields
            if not analysis_data.name or not analysis_data.location:
                raise ValidationError("Name and location are required")
            
            # Create analysis record
            db_analysis = await self.analysis_repo.create_analysis(
                user_id=user_id,
                name=analysis_data.name,
                location=analysis_data.location,
                analysis_type=analysis_data.analysis_type,
                data={
                    **analysis_data.data,
                    "locationScore": analysis_data.data.get("locationScore"),
                    "riskScore": analysis_data.data.get("riskScore"),
                    "monthlyRevenue": analysis_data.data.get("monthlyRevenue"),
                    "yearlyRevenue": analysis_data.data.get("yearlyRevenue"),
                },
                gemini_analysis=analysis_data.gemini_analysis or {}
            )

            
            if not db_analysis:
                raise DatabaseError("Failed to create analysis")
            
            return Analysis(
                id=db_analysis['id'],
                user_id=db_analysis['user_id'],
                name=db_analysis['name'],
                location=db_analysis['location'],
                analysis_type=db_analysis['analysis_type'],
                data=db_analysis['data'],
                gemini_analysis=db_analysis['gemini_analysis'],
                created_at=db_analysis['created_at'],
                updated_at=db_analysis['updated_at']
            )
        except ValidationError:
            raise
        except Exception as e:
            raise DatabaseError(f"Analysis creation failed: {str(e)}")
    
    async def get_analysis(self, analysis_id: str, user_id: str) -> Optional[Analysis]:
        """Get analysis by ID and user ID"""
        try:
            analysis = await self.analysis_repo.get_analysis_by_id_and_user(analysis_id, user_id)
            if not analysis:
                return None
            
            return Analysis(
                id=analysis['id'],
                user_id=analysis['user_id'],
                name=analysis['name'],
                location=analysis['location'],
                analysis_type=analysis['analysis_type'],
                data=analysis['data'],
                gemini_analysis=analysis['gemini_analysis'],
                created_at=analysis['created_at'],
                updated_at=analysis['updated_at']
            )
        except Exception as e:
            raise DatabaseError(f"Failed to get analysis: {str(e)}")
    
    async def get_user_analyses(self, user_id: str, limit: int = 10, offset: int = 0) -> List[Analysis]:
        """Get all analyses for a user"""
        try:
            analyses = await self.analysis_repo.get_by_user_id(user_id, limit, offset)
            
            return [
                Analysis(
                    id=analysis['id'],
                    user_id=analysis['user_id'],
                    name=analysis['name'],
                    location=analysis['location'],
                    analysis_type=analysis['analysis_type'],
                    data=analysis['data'],
                    gemini_analysis=analysis['gemini_analysis'],
                    created_at=analysis['created_at'],
                    updated_at=analysis['updated_at']
                )
                for analysis in analyses
            ]
        except Exception as e:
            raise DatabaseError(f"Failed to get user analyses: {str(e)}")
    
    async def update_analysis(self, analysis_id: str, user_id: str, update_data: Dict[str, Any]) -> Optional[Analysis]:
        """Update analysis"""
        try:
            updated_analysis = await self.analysis_repo.update_analysis(analysis_id, user_id, update_data)
            if not updated_analysis:
                return None
            
            return Analysis(
                id=updated_analysis['id'],
                user_id=updated_analysis['user_id'],
                name=updated_analysis['name'],
                location=updated_analysis['location'],
                analysis_type=updated_analysis['analysis_type'],
                data=updated_analysis['data'],
                gemini_analysis=updated_analysis['gemini_analysis'],
                created_at=updated_analysis['created_at'],
                updated_at=updated_analysis['updated_at']
            )
        except Exception as e:
            raise DatabaseError(f"Failed to update analysis: {str(e)}")
    
    async def delete_analysis(self, analysis_id: str, user_id: str) -> bool:
        """Delete analysis"""
        try:
            return await self.analysis_repo.delete_analysis(analysis_id, user_id)
        except Exception as e:
            raise DatabaseError(f"Failed to delete analysis: {str(e)}")
