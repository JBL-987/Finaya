from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from ...core.database import get_db
from ...services.storage_service import StorageService

router = APIRouter()
storage_service = StorageService()

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: dict = Depends(lambda: {"id": 1})  # Mock current user
):
    """Upload a file"""
    try:
        # Read file content
        file_content = await file.read()

        # Upload to storage
        result = await storage_service.upload_file(
            file_data=file_content,
            filename=file.filename,
            user_id=current_user["id"]
        )

        return result

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to upload file: {str(e)}"
        )

@router.get("/download/{file_id}")
async def download_file(
    file_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(lambda: {"id": 1})  # Mock current user
):
    """Download a file"""
    try:
        file_content = await storage_service.download_file(file_id, current_user["id"])
        return {"file_content": file_content.decode("utf-8")}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )

@router.delete("/{file_id}")
async def delete_file(
    file_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(lambda: {"id": 1})  # Mock current user
):
    """Delete a file"""
    try:
        success = await storage_service.delete_file(file_id, current_user["id"])
        if success:
            return {"message": "File deleted successfully"}
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to delete file"
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/", response_model=List[dict])
async def list_files(
    db: Session = Depends(get_db),
    current_user: dict = Depends(lambda: {"id": 1})  # Mock current user
):
    """List files for current user"""
    try:
        files = await storage_service.list_files(current_user["id"])
        return files
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
