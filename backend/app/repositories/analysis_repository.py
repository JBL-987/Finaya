"""
Analysis repository for analysis-related database operations using MongoDB
"""
from typing import List, Dict, Any, Optional
from datetime import datetime
from .base_repository import BaseRepository
from ..core.exceptions import DatabaseError, NotFoundError


class AnalysisRepository(BaseRepository):
    """Repository for analysis operations using MongoDB"""
    
    def __init__(self):
        super().__init__('analysis')
    
    async def create_analysis(self, user_id: str, name: str, location: str, analysis_type: str, 
                        data: Dict[str, Any], gemini_analysis: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new analysis"""
        try:
            analysis_data = {
                'user_id': user_id,
                'name': name,
                'location': location,
                'analysis_type': analysis_type,
                'data': data,
                'gemini_analysis': gemini_analysis,
                'created_at': datetime.utcnow().isoformat(),
                'updated_at': datetime.utcnow().isoformat()
            }
            
            result = await self.create(analysis_data)
            if not result:
                raise DatabaseError("Failed to create analysis")
            
            return result
        except Exception as e:
            raise DatabaseError(f"Analysis creation failed: {str(e)}")
    
    async def get_by_user_id(self, user_id: str, limit: int = 10, offset: int = 0) -> List[Dict[str, Any]]:
        """Get analyses by user ID"""
        try:
            return await self.get_all(
                filters={'user_id': user_id}, 
                limit=limit, 
                offset=offset, 
                order_by='created_at', 
                descending=True
            )
        except Exception as e:
            raise DatabaseError(f"Failed to get analyses by user: {str(e)}")
    
    async def get_analysis_by_id_and_user(self, analysis_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        """Get analysis by ID and user ID (for security)"""
        try:
            analysis = await self.get_by_id(analysis_id)
            if analysis and analysis.get('user_id') == user_id:
                return analysis
            return None
        except Exception as e:
            raise DatabaseError(f"Failed to get analysis: {str(e)}")
    
    async def update_analysis(self, analysis_id: str, user_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update analysis (with user verification)"""
        try:
            # First verify the analysis belongs to the user
            analysis = await self.get_analysis_by_id_and_user(analysis_id, user_id)
            if not analysis:
                raise NotFoundError("Analysis not found or access denied")
            
            # Update the analysis
            update_data = {**data, 'updated_at': datetime.utcnow().isoformat()}
            return await self.update(analysis_id, update_data)
        except Exception as e:
            raise DatabaseError(f"Failed to update analysis: {str(e)}")
    
    async def delete_analysis(self, analysis_id: str, user_id: str) -> bool:
        """Delete analysis (with user verification)"""
        try:
            # First verify the analysis belongs to the user
            analysis = await self.get_analysis_by_id_and_user(analysis_id, user_id)
            if not analysis:
                raise NotFoundError("Analysis not found or access denied")
            
            # Delete the analysis
            return await self.delete(analysis_id)
        except Exception as e:
            raise DatabaseError(f"Failed to delete analysis: {str(e)}")