from typing import List, Dict, Any, Optional
from datetime import datetime
from .base_repository import BaseRepository
from ..core.exceptions import DatabaseError, NotFoundError


class AnalysisRepository(BaseRepository):
    """Repository for analysis operations"""
    
    def __init__(self):
        super().__init__('analysis')
    
    def create_analysis(self, user_id: int, name: str, location: str, analysis_type: str, 
                       data: Dict[str, Any], qwen_analysis: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new analysis"""
        try:
            analysis_data = {
                'user_id': user_id,
                'name': name,
                'location': location,
                'analysis_type': analysis_type,
                'data': data,
                'qwen_analysis': qwen_analysis,
                'created_at': datetime.utcnow().isoformat(),
                'updated_at': datetime.utcnow().isoformat()
            }
            
            result = self.create(analysis_data)
            if not result:
                raise DatabaseError("Failed to create analysis")
            
            return result
        except Exception as e:
            raise DatabaseError(f"Analysis creation failed: {str(e)}")
    
    def get_by_user_id(self, user_id: int, limit: int = 10, offset: int = 0) -> List[Dict[str, Any]]:
        """Get analyses by user ID"""
        try:
            return self.get_all({'user_id': user_id}, limit, offset)
        except Exception as e:
            raise DatabaseError(f"Failed to get analyses by user: {str(e)}")
    
    def get_analysis_by_id_and_user(self, analysis_id: int, user_id: int) -> Optional[Dict[str, Any]]:
        """Get analysis by ID and user ID (for security)"""
        try:
            response = self.supabase.table(self.table_name).select('*').eq('id', analysis_id).eq('user_id', user_id).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            raise DatabaseError(f"Failed to get analysis: {str(e)}")
    
    def update_analysis(self, analysis_id: int, user_id: int, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update analysis (with user verification)"""
        try:
            # First verify the analysis belongs to the user
            analysis = self.get_analysis_by_id_and_user(analysis_id, user_id)
            if not analysis:
                raise NotFoundError("Analysis not found or access denied")
            
            # Update the analysis
            update_data = {**data, 'updated_at': datetime.utcnow().isoformat()}
            response = self.supabase.table(self.table_name).update(update_data).eq('id', analysis_id).eq('user_id', user_id).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            raise DatabaseError(f"Failed to update analysis: {str(e)}")
    
    def delete_analysis(self, analysis_id: int, user_id: int) -> bool:
        """Delete analysis (with user verification)"""
        try:
            # First verify the analysis belongs to the user
            analysis = self.get_analysis_by_id_and_user(analysis_id, user_id)
            if not analysis:
                raise NotFoundError("Analysis not found or access denied")
            
            # Delete the analysis
            response = self.supabase.table(self.table_name).delete().eq('id', analysis_id).eq('user_id', user_id).execute()
            return True
        except Exception as e:
            raise DatabaseError(f"Failed to delete analysis: {str(e)}")