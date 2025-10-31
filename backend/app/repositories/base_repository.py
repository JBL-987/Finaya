"""
Base repository pattern for database operations
"""
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
from ..core.database import get_supabase_client


class BaseRepository(ABC):
    """Abstract base repository for database operations"""
    
    def __init__(self, table_name: str):
        self.table_name = table_name
        self.supabase = get_supabase_client()
    
    def create(self, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Create a new record"""
        try:
            response = self.supabase.table(self.table_name).insert(data).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            raise Exception(f"Failed to create {self.table_name}: {str(e)}")
    
    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        """Get record by ID"""
        try:
            response = self.supabase.table(self.table_name).select('*').eq('id', record_id).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            raise Exception(f"Failed to get {self.table_name} by ID: {str(e)}")
    
    def get_by_field(self, field: str, value: Any) -> Optional[Dict[str, Any]]:
        """Get record by field value"""
        try:
            response = self.supabase.table(self.table_name).select('*').eq(field, value).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            raise Exception(f"Failed to get {self.table_name} by {field}: {str(e)}")
    
    def get_all(self, filters: Optional[Dict[str, Any]] = None, limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
        """Get all records with optional filters"""
        try:
            query = self.supabase.table(self.table_name).select('*')

            if filters:
                for field, value in filters.items():
                    query = query.eq(field, value)

            response = query.range(offset, offset + limit - 1).execute()
            return response.data or []
        except Exception as e:
            raise Exception(f"Failed to get {self.table_name} records: {str(e)}")
    
    def update(self, record_id: int, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update record by ID"""
        try:
            response = self.supabase.table(self.table_name).update(data).eq('id', record_id).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            raise Exception(f"Failed to update {self.table_name}: {str(e)}")
    
    def delete(self, record_id: int) -> bool:
        """Delete record by ID"""
        try:
            response = self.supabase.table(self.table_name).delete().eq('id', record_id).execute()
            return True
        except Exception as e:
            raise Exception(f"Failed to delete {self.table_name}: {str(e)}")
    
    @abstractmethod
    def get_by_user_id(self, user_id: int) -> List[Dict[str, Any]]:
        """Get records by user ID - must be implemented by subclasses"""
        pass
