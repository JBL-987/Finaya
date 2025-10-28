from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any
from ...schemas.schemas import DocumentPosition, DocumentPositionCreate
from ...services.document_service import DocumentService
from .auth import get_current_user

router = APIRouter()
document_service = DocumentService()

@router.post("/positions", response_model=Dict[str, Any])
async def create_position(
    position: DocumentPositionCreate,
    current_user = Depends(get_current_user)
):
    """Create a new document position"""
    position.user_id = current_user.id
    result = document_service.create_position(position)
    if result:
        return {"success": True, "position": result.dict()}
    raise HTTPException(status_code=400, detail="Failed to create document position")

@router.get("/positions", response_model=List[Dict[str, Any]])
async def get_user_positions(
    current_user = Depends(get_current_user)
):
    """Get all document positions for current user"""
    try:
        positions = document_service.get_positions_by_user(current_user.id)
        return [p.dict() for p in positions]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/positions/transaction/{transaction_id}", response_model=Dict[str, Any])
async def get_position_by_transaction(
    transaction_id: int,
    current_user = Depends(get_current_user)
):
    """Get document position by transaction ID"""
    position = document_service.get_position_by_transaction(current_user.id, transaction_id)
    if position:
        return position.dict()
    raise HTTPException(status_code=404, detail="Document position not found")

@router.get("/positions/document/{document_name}", response_model=List[Dict[str, Any]])
async def get_positions_by_document(
    document_name: str,
    current_user = Depends(get_current_user)
):
    """Get all positions for a specific document"""
    positions = document_service.get_positions_by_document(current_user.id, document_name)
    return [p.dict() for p in positions]

@router.put("/positions/{position_id}", response_model=Dict[str, Any])
async def update_position(
    position_id: int,
    update_data: Dict[str, Any],
    current_user = Depends(get_current_user)
):
    """Update a document position"""
    success = document_service.update_position(position_id, current_user.id, update_data)
    if success:
        return {"success": True, "message": "Document position updated"}
    raise HTTPException(status_code=400, detail="Failed to update document position")

@router.delete("/positions/{position_id}")
async def delete_position(
    position_id: int,
    current_user = Depends(get_current_user)
):
    """Delete a document position"""
    success = document_service.delete_position(position_id, current_user.id)
    if success:
        return {"success": True, "message": "Document position deleted"}
    raise HTTPException(status_code=400, detail="Failed to delete document position")
