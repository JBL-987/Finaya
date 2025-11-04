from fastapi import APIRouter, Depends, HTTPException, status, Request
from typing import List, Dict, Any
from ...schemas.schemas import TransactionCreate, Transaction, AccountingReport, User
from ...services.accounting_service import AccountingService
from .auth import get_current_user
from datetime import datetime
import logging

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

router = APIRouter()
accounting_service = AccountingService()

@router.post("/transactions", response_model=Dict[str, Any])
async def create_transaction(
    request: Request,
    transaction: TransactionCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new transaction"""
    print("=== TRANSACTION CREATION STARTED ===")
    print(f"User ID: {current_user.id}")
    print(f"User Email: {current_user.email}")

    # Log raw request body
    try:
        body = await request.body()
        print(f"Raw request body: {body.decode('utf-8')}")
    except:
        print("Could not read request body")

    print(f"Pydantic parsed transaction: {transaction.dict()}")

    try:
        # Validate required fields
        if not transaction.description:
            raise HTTPException(status_code=400, detail="Description is required")
        if transaction.amount <= 0:
            raise HTTPException(status_code=400, detail="Amount must be greater than 0")
        if transaction.type not in ["income", "expense", "transfer", "asset purchase", "liability", "equity"]:
            raise HTTPException(status_code=400, detail=f"Invalid transaction type: {transaction.type}")

        print("Validation passed, calling service...")

        # Automatically set user_id from JWT token (more secure)
        transaction.user_id = current_user.id

        result = accounting_service.create_transaction(transaction, current_user.id)

        if result:
            transaction_dict = result.model_dump()
            print(f"Transaction created successfully: {transaction_dict}")

            # Automatically trigger financial analysis after transaction creation
            try:
                print("=== STARTING AUTOMATIC FINANCIAL ANALYSIS ===")

                # Import advisor service
                from ...services.advisor_service import AdvisorService
                advisor_service = AdvisorService()

                # Get user's transactions for analysis
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

                # Calculate financial metrics
                total_income = sum(t["amount"] for t in transactions_list if t["transactionType"] == "income")
                total_expenses = sum(t["amount"] for t in transactions_list if t["transactionType"] == "expense")
                available_investment = max(0, total_income - total_expenses)

                # Determine risk level based on financial data
                savings_rate = (total_income - total_expenses) / total_income if total_income > 0 else 0
                risk_level = "moderate"
                if savings_rate > 0.3:
                    risk_level = "aggressive"
                elif savings_rate < 0.1:
                    risk_level = "conservative"

                print(f"Financial metrics - Income: ${total_income}, Expenses: ${total_expenses}, Available: ${available_investment}, Risk: {risk_level}")

                # 1. Generate Financial Planning
                print("Generating financial planning...")
                financial_planning = {
                    "monthly_income": total_income / 12 if total_income > 0 else 0,
                    "monthly_expenses": total_expenses / 12 if total_expenses > 0 else 0,
                    "available_investment": available_investment,
                    "savings_rate": savings_rate * 100,
                    "risk_level": risk_level,
                    "recommendations": [
                        "Maintain emergency fund of 3-6 months expenses",
                        "Diversify investments across asset classes",
                        "Regularly review and rebalance portfolio",
                        "Consider tax-advantaged accounts"
                    ]
                }

                # 2. Generate Tax Strategy
                print("Generating tax strategy...")
                tax_strategy = await advisor_service.get_tax_strategy(total_income, {
                    "total_expenses": total_expenses,
                    "monthly_expenses": total_expenses / 12,
                    "available_investment": available_investment
                })

                # 3. Generate Investment Recommendations
                print("Generating investment recommendations...")
                investment_profile = {
                    "total_income": total_income,
                    "total_expenses": total_expenses,
                    "available_investment": available_investment,
                    "risk_tolerance": risk_level,
                    "investment_horizon": 10,  # Default 10 years
                    "monthly_investment": min(available_investment * 0.2, 10000)  # 20% of available or max $10k
                }
                investment_recommendations = await advisor_service.get_investment_recommendations(investment_profile)

                # 4. Run Monte Carlo Simulation
                print("Running Monte Carlo simulation...")
                monte_carlo_results = advisor_service.run_monte_carlo_simulation(
                    initial_investment=max(available_investment, 1000),  # Minimum $1000
                    risk_level=risk_level,
                    years=10,  # 10-year horizon
                    simulations=1000
                )

                print("=== FINANCIAL ANALYSIS COMPLETED ===")
                print(f"Planning: {len(financial_planning['recommendations'])} recommendations")
                print(f"Tax Strategy: {len(tax_strategy.deductions)} deductions, {len(tax_strategy.credits)} credits")
                print(f"Investments: {len(investment_recommendations)} recommendations")
                print(f"Monte Carlo: {monte_carlo_results['probability_positive']:.1f}% success rate")

                # Return transaction with automatic analysis results
                return {
                    "success": True,
                    "transaction": transaction_dict,
                    "automatic_analysis": {
                        "financial_planning": financial_planning,
                        "tax_strategy": tax_strategy.dict() if hasattr(tax_strategy, 'dict') else tax_strategy,
                        "investment_recommendations": [rec.dict() if hasattr(rec, 'dict') else rec for rec in investment_recommendations],
                        "monte_carlo_simulation": monte_carlo_results,
                        "analysis_timestamp": datetime.now().isoformat(),
                        "computation_method": "automatic_post_transaction"
                    }
                }

            except Exception as analysis_error:
                print(f"Automatic analysis failed: {str(analysis_error)}")
                import traceback
                print("Analysis error traceback:")
                print(traceback.format_exc())

                # Return transaction without analysis if analysis fails
                return {"success": True, "transaction": transaction_dict, "analysis_error": str(analysis_error)}

        else:
            print("Service returned None - database insertion failed")
            raise HTTPException(status_code=500, detail="Database insertion failed")

    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        print("=== TRANSACTION CREATION ERROR ===")
        print(f"Exception type: {type(e).__name__}")
        print(f"Exception message: {str(e)}")
        import traceback
        print("Full traceback:")
        print(traceback.format_exc())
        print("=== END ERROR ===")
        raise HTTPException(status_code=500, detail=f"Transaction creation failed: {str(e)}")

# Test endpoint to check if logging works
@router.get("/test-logging")
async def test_logging():
    """Test endpoint to verify logging is working"""
    print("=== TEST LOGGING ENDPOINT CALLED ===")
    logger.info("Logger info test")
    logger.debug("Logger debug test")
    logger.error("Logger error test")
    return {"message": "Logging test completed", "check_backend_console": True}

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

@router.post("/ai/process-complete-workflow", response_model=Dict[str, Any])
async def process_complete_workflow(
    request_data: Dict[str, Any],
    current_user: User = Depends(get_current_user)
):
    """
    MAIN AUTOMATION ENDPOINT
    Triggers entire AI workflow for a document
    File Upload → Extract → Save → Categorize → Validate → Analyze → Recommend
    """
    try:
        from ...services.ai_workflow_orchestrator import AIWorkflowOrchestrator
        import os
        from pathlib import Path

        file_path = request_data.get("filePath", "")
        if not file_path:
            raise HTTPException(status_code=400, detail="File path is required")

        # Validate file exists and is accessible
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="File not found")

        # Check file size (10MB limit)
        file_size = os.path.getsize(file_path)
        if file_size > 10 * 1024 * 1024:  # 10MB
            raise HTTPException(status_code=400, detail="File too large (max 10MB)")

        # Initialize workflow orchestrator
        orchestrator = AIWorkflowOrchestrator()

        # Run complete workflow
        result = await orchestrator.process_document_complete(file_path, current_user.id)

        return {
            "success": result["success"],
            "message": "AI workflow completed" if result["success"] else "AI workflow failed",
            "data": {
                "extracted_count": result["extracted_count"],
                "transactions": result["transactions"],
                "validation": result["validation"],
                "patterns": result["patterns"],
                "recommendations": result["recommendations"],
                "processing_time": result["processing_time"]
            },
            "errors": result["errors"]
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"AI workflow failed: {str(e)}"
        )
