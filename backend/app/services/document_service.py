from typing import List, Dict, Any, Optional
from ..repositories.document_repository import DocumentRepository
from ..schemas.schemas import DocumentPosition, DocumentPositionCreate

class DocumentService:
    """Service for document position operations"""

    def __init__(self):
        self.repository = DocumentRepository()

    def create_position(self, position: DocumentPositionCreate) -> Optional[DocumentPosition]:
        """Create a new document position"""
        return self.repository.create_position(position)

    def get_positions_by_user(self, user_id: int) -> List[DocumentPosition]:
        """Get all document positions for a user"""
        return self.repository.get_positions_by_user(user_id)

    def get_position_by_transaction(self, user_id: int, transaction_id: int) -> Optional[DocumentPosition]:
        """Get document position by transaction ID"""
        return self.repository.get_position_by_transaction(user_id, transaction_id)

    def get_positions_by_document(self, user_id: int, document_name: str) -> List[DocumentPosition]:
        """Get all positions for a specific document"""
        return self.repository.get_positions_by_document(user_id, document_name)

    def update_position(self, position_id: int, user_id: int, data: Dict[str, Any]) -> bool:
        """Update a document position"""
        return self.repository.update_position(position_id, user_id, data)

    def delete_position(self, position_id: int, user_id: int) -> bool:
        """Delete a document position"""
        return self.repository.delete_position(position_id, user_id)
