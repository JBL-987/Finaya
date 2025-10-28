from typing import List, Dict, Any, Optional
from datetime import datetime
from .base_repository import BaseRepository
from ..schemas.schemas import DocumentPosition, DocumentPositionCreate

class DocumentRepository(BaseRepository):
    """Repository for document position operations"""

    def __init__(self):
        super().__init__("document_positions")

    def create_position(self, position: DocumentPositionCreate) -> Optional[DocumentPosition]:
        """Create a new document position"""
        data = {
            "user_id": position.user_id,
            "document_name": position.document_name,
            "extraction_data": position.extraction_data,
            "transaction_id": position.transaction_id,
        }
        result = self.create(data)
        if result:
            return DocumentPosition(**result)
        return None

    def get_positions_by_user(self, user_id: int) -> List[DocumentPosition]:
        """Get all document positions for a user"""
        results = self.get_all({"user_id": user_id})
        return [DocumentPosition(**result) for result in results]

    def get_position_by_transaction(self, user_id: int, transaction_id: int) -> Optional[DocumentPosition]:
        """Get document position by transaction ID"""
        try:
            response = self.supabase.table(self.table_name).select('*').eq('user_id', user_id).eq('transaction_id', transaction_id).execute()
            result = response.data[0] if response.data else None
            if result:
                return DocumentPosition(**result)
        except Exception as e:
            print(f"Error getting document position by transaction: {e}")
        return None

    def get_positions_by_document(self, user_id: int, document_name: str) -> List[DocumentPosition]:
        """Get all positions for a specific document"""
        try:
            response = self.supabase.table(self.table_name).select('*').eq('user_id', user_id).eq('document_name', document_name).order('timestamp', desc=True).execute()
            return [DocumentPosition(**result) for result in response.data or []]
        except Exception as e:
            print(f"Error getting document positions by document: {e}")
        return []

    def update_position(self, position_id: int, user_id: int, data: Dict[str, Any]) -> bool:
        """Update a document position"""
        try:
            # Add timestamp update
            update_data = {**data, 'timestamp': datetime.now().isoformat()}

            response = self.supabase.table(self.table_name).update(update_data).eq('id', position_id).eq('user_id', user_id).execute()
            return response.data is not None and len(response.data) > 0
        except Exception as e:
            print(f"Error updating document position: {e}")
        return False

    def delete_position(self, position_id: int, user_id: int) -> bool:
        """Delete a document position"""
        try:
            # Note: We would use both position_id and user_id for security, but Supabase doesn't support multiple EQ conditions directly
            response = self.supabase.table(self.table_name).delete().eq('id', position_id).execute()
            return response.data is not None
        except Exception as e:
            print(f"Error deleting document position: {e}")
        return False

    def get_by_user_id(self, user_id: int) -> List[Dict[str, Any]]:
        """Get records by user ID - required by BaseRepository"""
        return self.get_all({"user_id": user_id})
