from fastapi import APIRouter, Depends, HTTPException, status, Request
from typing import List, Dict, Any
from ...services.reports_service import ReportsService
from ...schemas.financial_reports import (
    DocumentCategorizationRequest, DocumentCategorizationResponse
)
from ...core.dependencies import get_current_user
import logging

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/categorize-document", response_model=DocumentCategorizationResponse)
async def categorize_document(
    request: Request,
    request_data: DocumentCategorizationRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Categorize a document using AI"""
    print("=== DOCUMENT CATEGORIZATION STARTED ===")
    print(f"User ID: {current_user.get('id')}")
    print(f"User Email: {current_user.get('email')}")

    # Log raw request body
    try:
        body = await request.body()
        print(f"Raw request body: {body.decode('utf-8')}")
    except:
        print("Could not read request body")

    print(f"Pydantic parsed request: {request_data.dict()}")

    try:
        service = ReportsService()
        result = await service.categorize_document(request_data, current_user["id"])
        print(f"Document categorization successful: {result}")
        return result
    except Exception as e:
        print("=== DOCUMENT CATEGORIZATION ERROR ===")
        print(f"Exception type: {type(e).__name__}")
        print(f"Exception message: {str(e)}")
        import traceback
        print("Full traceback:")
        print(traceback.format_exc())
        print("=== END ERROR ===")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Document categorization failed: {str(e)}"
        )

@router.get("/user-reports")
async def get_user_reports(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get all reports for the current user"""
    try:
        service = ReportsService()
        result = await service.get_user_reports(current_user["id"])
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get user reports: {str(e)}"
        )

@router.post("/generate-financial-report")
async def generate_financial_report(
    report_type: str,
    transactions: List[Dict[str, Any]],
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Generate a financial report using AI"""
    try:
        service = ReportsService()
        result = await service.generate_financial_report(report_type, transactions, current_user["id"])
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate financial report: {str(e)}"
        )

@router.post("/generate-tax-report")
async def generate_tax_report(
    report_type: str,
    tax_period: str,
    transactions: List[Dict[str, Any]],
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Generate a tax report using AI"""
    try:
        service = ReportsService()
        result = await service.generate_tax_report(report_type, tax_period, transactions, current_user["id"])
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate tax report: {str(e)}"
        )

@router.post("/create-financial-report")
async def create_financial_report(
    request: Request,
    report_data: Dict[str, Any],
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Create a new financial report"""
    print("=== CREATE FINANCIAL REPORT STARTED ===")
    print(f"User ID: {current_user.get('id')}")
    print(f"User Email: {current_user.get('email')}")

    # Log raw request body
    try:
        body = await request.body()
        print(f"Raw request body length: {len(body)} bytes")
        print(f"Report data keys: {list(report_data.keys()) if isinstance(report_data, dict) else 'Not a dict'}")
    except:
        print("Could not read request body")

    try:
        service = ReportsService()
        result = await service.create_financial_report(report_data, current_user["id"])
        print(f"Financial report created successfully")
        return result
    except Exception as e:
        print("=== CREATE FINANCIAL REPORT ERROR ===")
        print(f"Exception type: {type(e).__name__}")
        print(f"Exception message: {str(e)}")
        import traceback
        print("Full traceback:")
        print(traceback.format_exc())
        print("=== END ERROR ===")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create financial report: {str(e)}"
        )

@router.post("/create-tax-report")
async def create_tax_report(
    request: Request,
    report_data: Dict[str, Any],
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Create a new tax report"""
    print("=== CREATE TAX REPORT STARTED ===")
    print(f"User ID: {current_user.get('id')}")
    print(f"User Email: {current_user.get('email')}")

    # Log raw request body
    try:
        body = await request.body()
        print(f"Raw request body length: {len(body)} bytes")
        print(f"Report data keys: {list(report_data.keys()) if isinstance(report_data, dict) else 'Not a dict'}")
    except:
        print("Could not read request body")

    try:
        service = ReportsService()
        result = await service.create_tax_report(report_data, current_user["id"])
        print(f"Tax report created successfully")
        return result
    except Exception as e:
        print("=== CREATE TAX REPORT ERROR ===")
        print(f"Exception type: {type(e).__name__}")
        print(f"Exception message: {str(e)}")
        import traceback
        print("Full traceback:")
        print(traceback.format_exc())
        print("=== END ERROR ===")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create tax report: {str(e)}"
        )
