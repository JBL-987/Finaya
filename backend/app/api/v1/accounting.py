from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from typing import List, Dict, Any, Optional
from ...schemas.schemas import TransactionCreate, Transaction, AccountingReport, User
from ...services.accounting_service import AccountingService
from ...core.exceptions import BusinessLogicError, NotFoundError, DatabaseError, ValidationError
from .auth import get_current_user

router = APIRouter()
accounting_service = AccountingService()

@router.post("/transactions", response_model=Dict[str, Any])
async def create_transaction(
    transaction: TransactionCreate,
    current_user: User = Depends(get_current_user),
):
    """Create a new transaction"""
    result = await accounting_service.create_transaction(
        transaction_data=transaction, user_id=current_user.id, file=None
    )
    if result:
        return {"success": True, "transaction": result.model_dump()}

    raise DatabaseError(
        message="Failed to create transaction",
        operation="create_transaction",
        context="Transaction creation"
    )

@router.post("/transactions/upload", response_model=Dict[str, Any])
async def create_transaction_from_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """Create a transaction by uploading a file (receipt, invoice, etc.) for OCR processing"""
    result = await accounting_service.create_transaction(
        transaction_data=None, user_id=current_user.id, file=file
    )
    if result:
        return {"success": True, "transaction": result.model_dump()}

    raise DatabaseError(
        message="Failed to create transaction from file",
        operation="create_transaction_from_file",
        context="File-based transaction creation"
    )

@router.get("/transactions", response_model=List[Dict[str, Any]])
async def get_user_transactions(
    current_user: User = Depends(get_current_user)
):
    """Get all transactions for current user"""
    try:
        transactions = accounting_service.get_user_transactions(current_user.id)
        return [t.model_dump() for t in transactions]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/transactions/{transaction_id}", response_model=Dict[str, Any])
async def get_transaction(
    transaction_id: int,
    current_user: User = Depends(get_current_user)
):
    """Get transaction by ID"""
    try:
        transaction = accounting_service.get_transaction_by_id(transaction_id)
        if not transaction or transaction.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Transaction not found")
        return transaction.model_dump()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/transactions/{transaction_id}", response_model=Dict[str, Any])
async def update_transaction(
    transaction_id: int,
    update_data: Dict[str, Any],
    current_user: User = Depends(get_current_user),
):
    """Update transaction"""
    try:
        # First, verify the transaction belongs to the user
        transaction = accounting_service.get_transaction_by_id(transaction_id)
        if not transaction or transaction.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Transaction not found")

        # Then, update the transaction
        updated = await accounting_service.update_transaction(
            transaction_id, update_data
        )
        if updated:
            return {"success": True, "transaction": updated.model_dump()}
        raise HTTPException(status_code=400, detail="Failed to update transaction")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/transactions/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_transaction(
    transaction_id: int, current_user: User = Depends(get_current_user)
):
    """Delete transaction"""
    try:
        # Verify transaction ownership
        transaction = accounting_service.get_transaction_by_id(transaction_id)
        if not transaction or transaction.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Transaction not found")

        # Delete the transaction
        if not accounting_service.delete_transaction(transaction_id):
            raise HTTPException(status_code=400, detail="Failed to delete transaction")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/report", response_model=AccountingReport)
async def get_accounting_report(current_user: User = Depends(get_current_user)):
    """Get accounting report for current user"""
    try:
        return accounting_service.get_accounting_report(current_user.id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/transactions/category/{category}", response_model=List[Transaction])
async def get_transactions_by_category(
    category: str, current_user: User = Depends(get_current_user)
):
    """Get transactions by category"""
    try:
        return accounting_service.get_transactions_by_category(
            current_user.id, category
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
