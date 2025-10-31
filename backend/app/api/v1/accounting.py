from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any
from ...schemas.schemas import TransactionCreate, Transaction, AccountingReport, User
from ...services.accounting_service import AccountingService
from .auth import get_current_user

router = APIRouter()
accounting_service = AccountingService()

@router.post("/transactions", response_model=Dict[str, Any])
async def create_transaction(
    transaction: TransactionCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new transaction"""
    try:
        result = accounting_service.create_transaction(transaction, current_user.id)
        if result:
            return {"success": True, "transaction": result.dict()}
        raise HTTPException(status_code=400, detail="Failed to create transaction")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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
    current_user: User = Depends(get_current_user)
):
    """Update transaction"""
    try:
        transaction = accounting_service.get_transaction_by_id(transaction_id)
        if not transaction or transaction.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Transaction not found")

        updated = accounting_service.update_transaction(transaction_id, update_data)
        if updated:
            return {"success": True, "transaction": updated.dict()}
        raise HTTPException(status_code=400, detail="Failed to update transaction")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/transactions/{transaction_id}")
async def delete_transaction(
    transaction_id: int,
    current_user: User = Depends(get_current_user)
):
    """Delete transaction"""
    try:
        transaction = accounting_service.get_transaction_by_id(transaction_id)
        if not transaction or transaction.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Transaction not found")

        success = accounting_service.delete_transaction(transaction_id)
        if success:
            return {"success": True, "message": "Transaction deleted"}
        raise HTTPException(status_code=400, detail="Failed to delete transaction")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/report", response_model=Dict[str, Any])
async def get_accounting_report(
    current_user: User = Depends(get_current_user)
):
    """Get accounting report for current user"""
    try:
        report = accounting_service.get_accounting_report(current_user.id)
        return {
            "success": True,
            "total_income": report.total_income,
            "total_expense": report.total_expense,
            "net_profit": report.net_profit,
            "transactions": [t.model_dump() for t in report.transactions]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/transactions/category/{category}", response_model=List[Dict[str, Any]])
async def get_transactions_by_category(
    category: str,
    current_user: User = Depends(get_current_user)
):
    """Get transactions by category"""
    try:
        transactions = accounting_service.get_transactions_by_category(current_user.id, category)
        return [t.model_dump() for t in transactions]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# AI-powered endpoints
@router.post("/ai/categorize-transaction", response_model=Dict[str, Any])
async def categorize_transaction_ai_endpoint(
    request_data: Dict[str, Any],
    current_user: User = Depends(get_current_user)
):
    """AI-powered transaction categorization"""
    try:
        from ...services.openrouter_service_management import categorize_transaction_ai

        description = request_data.get("description", "")
        amount = request_data.get("amount", 0)
        transaction_type = request_data.get("transactionType")

        if not description or not amount:
            raise HTTPException(status_code=400, detail="Description and amount are required")

        result = await categorize_transaction_ai(description, amount, transaction_type)
        return {"success": True, "categorization": result}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/ai/analyze-patterns", response_model=Dict[str, Any])
async def analyze_financial_patterns(
    current_user: User = Depends(get_current_user)
):
    """AI analysis of financial patterns"""
    try:
        from ...services.openrouter_service_management import analyze_financial_patterns

        transactions = accounting_service.get_user_transactions(current_user.id)
        transactions_list = [
            {
                "date": str(t.date),
                "description": t.description,
                "amount": t.amount,
                "category": t.category,
                "transactionType": t.type
            }
            for t in transactions
        ]

        if not transactions_list:
            raise HTTPException(status_code=400, detail="No transactions found for analysis")

        result = await analyze_financial_patterns(transactions_list)
        return {"success": True, "analysis": result}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/ai/extract-transactions", response_model=Dict[str, Any])
async def extract_transactions_from_document(
    request_data: Dict[str, Any],
    current_user: User = Depends(get_current_user)
):
    """AI-powered transaction extraction from documents"""
    try:
        from ...services.openrouter_service_management import extract_transactions_from_document

        text_content = request_data.get("textContent", "")
        document_type = request_data.get("documentType", "unknown")

        if not text_content:
            raise HTTPException(status_code=400, detail="Text content is required")

        extracted_transactions = await extract_transactions_from_document(text_content, document_type)
        return {"success": True, "transactions": extracted_transactions}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/ai/financial-recommendations", response_model=Dict[str, Any])
async def get_financial_recommendations(
    request_data: Dict[str, Any] = None,
    current_user: User = Depends(get_current_user)
):
    """AI-generated financial recommendations"""
    try:
        from ...services.openrouter_service_management import generate_financial_recommendations

        transactions = accounting_service.get_user_transactions(current_user.id)
        transactions_list = [
            {
                "date": str(t.date),
                "description": t.description,
                "amount": t.amount,
                "category": t.category,
                "transactionType": t.type
            }
            for t in transactions
        ]

        if not transactions_list:
            raise HTTPException(status_code=400, detail="No transactions found for recommendations")

        goals = request_data.get("goals", []) if request_data else []

        result = await generate_financial_recommendations(transactions_list, goals)
        return {"success": True, "recommendations": result}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate financial recommendations: {str(e)}"
        )