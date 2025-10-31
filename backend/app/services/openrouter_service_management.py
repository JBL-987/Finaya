import httpx
import json
from typing import Dict, Any, List
from fastapi import HTTPException

from app.core.config import settings

OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"

async def call_openrouter_qwen(messages: List[Dict[str, Any]]) -> str:
    """
    Call OpenRouter Qwen model with given messages

    Args:
        messages: List of message dictionaries

    Returns:
        AI response text
    """
    request_body = {
        "model": settings.OPENROUTER_MODEL,
        "messages": messages,
        "max_tokens": 1024,
        "temperature": 0.1
    }

    headers = {
        "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
        "HTTP-Referer": "http://localhost:5174",
        "X-Title": "Finaya",
        "Content-Type": "application/json"
    }

    try:
        async with httpx.AsyncClient(timeout=45.0) as client:
            response = await client.post(
                OPENROUTER_API_URL,
                json=request_body,
                headers=headers
            )

            if response.status_code != 200:
                error_data = response.json()
                raise HTTPException(
                    status_code=500,
                    detail=f"OpenRouter API Error: {error_data.get('error', {}).get('message', response.text)}"
                )

            data = response.json()

            if not data.get("choices") or not data["choices"][0].get("message"):
                raise HTTPException(
                    status_code=500,
                    detail="Invalid response format from OpenRouter AI"
                )

            return data["choices"][0]["message"]["content"]

    except httpx.TimeoutException:
        raise HTTPException(
            status_code=504,
            detail="OpenRouter AI request timed out"
        )
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to connect to OpenRouter AI: {str(e)}"
        )

async def categorize_transaction_ai(description: str, amount: float, transaction_type: str = None) -> Dict[str, Any]:
    """
    Use AI to automatically categorize a financial transaction

    Args:
        description: Transaction description
        amount: Transaction amount
        transaction_type: Known transaction type (optional)

    Returns:
        Dict with category, confidence, and explanation
    """

    prompt = f"""As a financial expert, categorize this transaction:

Transaction Details:
- Description: "{description}"
- Amount: {amount}
- Type: {transaction_type if transaction_type else "Unknown"}

Please classify this transaction with:
1. Primary category (e.g., "Food & Dining", "Travel", "Office Supplies", "Marketing", "Utilities")
2. Secondary category (more specific if applicable)
3. Confidence percentage (0-100%)
4. Brief explanation (1-2 sentences)

Format your response as valid JSON:
{{
    "primary": "Category Name",
    "secondary": "Secondary Category (optional)",
    "confidence": 85,
    "explanation": "Short explanation"
}}

Common categories include:
- Revenue/Income
- Cost of Goods Sold
- Operating Expenses (Office, Marketing, Utilities, Rent)
- Financial Expenses (Interest, Depreciation)
- Taxes
- Other Income/Loss
"""

    messages = [
        {
            "role": "user",
            "content": prompt
        }
    ]

    try:
        ai_response = await call_openrouter_qwen(messages)

        # Parse JSON response
        try:
            result = json.loads(ai_response.strip())
            return result
        except json.JSONDecodeError:
            # Try to extract JSON from response
            import re
            json_match = re.search(r'\{.*\}', ai_response, re.DOTALL)
            if json_match:
                result = json.loads(json_match.group(0))
                return result

        # Fallback response
        return {
            "primary": "Uncategorized",
            "secondary": None,
            "confidence": 0,
            "explanation": "AI could not categorize this transaction"
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to categorize transaction with AI: {str(e)}"
        )

async def analyze_financial_patterns(transactions: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Use AI to analyze financial patterns and provide insights

    Args:
        transactions: List of transaction dictionaries

    Returns:
        Dict with analysis insights
    """

    # Convert transactions to readable format
    transactions_text = "\n".join([
        f"- {t['date']}: {t['description']} (${t['amount']}) - {t['category'] or 'Uncategorized'} - {t['transactionType']}"
        for t in transactions[-20:]  # Last 20 transactions for manageable analysis
    ])

    prompt = f"""
Analyze these recent financial transactions and provide key insights:

{transactions_text}

Please provide:
1. Spending patterns and trends
2. Key expense categories
3. Potential savings opportunities
4. Financial health indicators
5. Recommendations for improvement

Be specific and actionable in your recommendations.

Format as JSON:
{{
    "patterns": ["Pattern 1", "Pattern 2"],
    "top_categories": ["Category: $amount", "Category: $amount"],
    "savings_opportunities": ["Opportunity 1", "Opportunity 2"],
    "health_indicators": ["Indicator 1", "Indicator 2"],
    "recommendations": ["Recommendation 1", "Recommendation 2"]
}}
"""

    messages = [
        {
            "role": "user",
            "content": prompt
        }
    ]

    try:
        ai_response = await call_openrouter_qwen(messages)

        try:
            result = json.loads(ai_response.strip())
            return result
        except json.JSONDecodeError:
            return {
                "patterns": ["Analysis available with AI"],
                "top_categories": ["Analysis available with AI"],
                "savings_opportunities": ["Connect to AI for insights"],
                "health_indicators": ["Analysis available with AI"],
                "recommendations": ["Enable AI analysis for detailed recommendations"]
            }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to analyze financial patterns with AI: {str(e)}"
        )

async def extract_transactions_from_document(text_content: str, document_type: str = "unknown") -> List[Dict[str, Any]]:
    """
    Use AI to extract transaction data from raw document text

    Args:
        text_content: Raw text content from document
        document_type: Type of document (invoice, receipt, bank_statement, etc.)

    Returns:
        List of extracted transactions
    """

    prompt = f"""
Extract all financial transactions from this {document_type} document text:

{text_content}

Please identify all transactions with:
- Date (if available)
- Description
- Amount
- Category (inferred)
- Transaction type (income, expense)

Format as JSON array:
[
    {{
        "date": "YYYY-MM-DD or best guess",
        "description": "Transaction description",
        "amount": 123.45,
        "category": "Inferred category",
        "transactionType": "income or expense"
    }}
]

Include ALL transactions found in the document, even if some fields are missing (use null).
"""

    messages = [
        {
            "role": "user",
            "content": prompt
        }
    ]

    try:
        ai_response = await call_openrouter_qwen(messages)

        try:
            result = json.loads(ai_response.strip())
            if isinstance(result, list):
                return result
            else:
                return [result]  # If single transaction wrapped in object
        except json.JSONDecodeError:
            # Try to extract array from response
            import re
            array_match = re.search(r'\[.*\]', ai_response, re.DOTALL)
            if array_match:
                result = json.loads(array_match.group(0))
                return result

        # Return empty list on failure
        return []

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to extract transactions from document: {str(e)}"
        )

async def generate_financial_recommendations(transactions: List[Dict[str, Any]], goals: List[str] = None) -> Dict[str, Any]:
    """
    Generate AI-powered financial recommendations based on transaction history

    Args:
        transactions: List of transaction dictionaries
        goals: Optional list of financial goals

    Returns:
        Dict with recommendations and insights
    """

    # Calculate basic financial overview
    total_income = sum(t['amount'] for t in transactions if t['transactionType'] == 'income')
    total_expenses = sum(t['amount'] for t in transactions if t['transactionType'] == 'expense')
    net_profit = total_income - total_expenses

    goals_text = "\n".join([f"- {goal}" for goal in goals]) if goals else "No specific goals provided"

    prompt = f"""
Based on this financial data, provide personalized recommendations:

Financial Overview:
- Total Income: ${total_income:.2f}
- Total Expenses: ${total_expenses:.2f}
- Net Profit: ${net_profit:.2f}
- Transaction Count: {len(transactions)}

Financial Goals:
{goals_text}

Provide actionable recommendations in these areas:
1. Budget optimization
2. Expense reduction
3. Revenue enhancement
4. Financial planning
5. Tax optimization

Format as JSON:
{{
    "budget_optimization": ["Recommendation 1", "Recommendation 2"],
    "expense_reduction": ["Recommendation 1", "Recommendation 2"],
    "revenue_enhancement": ["Recommendation 1", "Recommendation 2"],
    "financial_planning": ["Recommendation 1", "Recommendation 2"],
    "tax_optimization": ["Recommendation 1", "Recommendation 2"]
}}
"""

    messages = [
        {
            "role": "user",
            "content": prompt
        }
    ]

    try:
        ai_response = await call_openrouter_qwen(messages)

        try:
            result = json.loads(ai_response.strip())
            return result
        except json.JSONDecodeError:
            return {
                "budget_optimization": ["AI analysis recommends reviewing spending patterns"],
                "expense_reduction": ["Connect AI for detailed expense analysis"],
                "revenue_enhancement": ["AI recommendations available"],
                "financial_planning": ["Enable AI for financial planning insights"],
                "tax_optimization": ["Consult AI for tax optimization strategies"]
            }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate financial recommendations: {str(e)}"
        )

# ===== ADVISOR AI FUNCTIONS =====

async def generate_financial_plan(yearly_income: float, monthly_goals: Dict[str, Any], risk_tolerance: str = "moderate") -> Dict[str, Any]:
    """
    Generate AI-powered comprehensive financial plan

    Args:
        yearly_income: User's annual income
        monthly_goals: Dict with monthly saving goals and expenses
        risk_tolerance: User's risk tolerance (low, moderate, high)

    Returns:
        Dict with detailed financial plan
    """

    goals_text = "\n".join([f"- {k}: ${v}" for k, v in monthly_goals.items()])

    prompt = f"""
Create a comprehensive financial plan for a person with:

Annual Income: ${yearly_income:.2f}
Monthly Financial Goals: {goals_text}
Risk Tolerance: {risk_tolerance}

Provide a detailed financial plan covering:

1. Emergency Fund Requirements
2. Monthly Budget Allocation
3. Short-term Goals (1-3 years)
4. Medium-term Goals (4-7 years)
5. Long-term Goals (8+ years)
6. Investment Strategy Recommendations
7. Retirement Planning
8. Debt Management (if applicable)
9. Insurance Needs
10. Tax Optimization Strategies

Be specific with numbers and timeframes. Format as JSON with these keys.
Make recommendations appropriate for their risk tolerance.

Format as JSON:
{{
    "emergency_fund": {{
        "target_months": 6,
        "monthly_contribution": 500,
        "timeline": "12 months"
    }},
    "monthly_budget": {{
        "savings_investments": 30,
        "essentials": 50,
        "discretionary": 20
    }},
    "short_term_goals": [
        {{"name": "Vacation Fund", "target_amount": 3000, "monthly_save": 250, "timeline": "12 months"}}
    ],
    "investment_strategy": [
        {{"type": "Index Funds", "allocation": 40, "reason": "Long-term growth"}}
    ],
    "recommendations": [
        "Start tracking all expenses",
        "Build emergency fund before investing"
    ]
}}
"""

    messages = [
        {
            "role": "user",
            "content": prompt
        }
    ]

    try:
        ai_response = await call_openrouter_qwen(messages)

        try:
            result = json.loads(ai_response.strip())
            return result
        except json.JSONDecodeError:
            return {
                "emergency_fund": {
                    "target_months": 6,
                    "monthly_contribution": yearly_income * 0.02,
                    "timeline": "12 months"
                },
                "monthly_budget": {
                    "savings_investments": 25,
                    "essentials": 50,
                    "discretionary": 25
                },
                "short_term_goals": [
                    {"name": "Emergency Fund", "target_amount": yearly_income * 0.15, "monthly_save": yearly_income * 0.02, "timeline": "12 months"}
                ],
                "investment_strategy": [
                    {"type": "Index Funds", "allocation": 70, "reason": "Long-term growth with moderate risk"}
                ],
                "recommendations": [
                    "Track all expenses regularly",
                    "Build emergency fund before aggressive investing",
                    "Consider consulting with a financial advisor"
                ]
            }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate financial plan: {str(e)}"
        )

async def generate_investment_recommendations(risk_level: str, investment_horizon: int, investment_amount: float) -> Dict[str, Any]:
    """
    Generate AI-powered investment recommendations

    Args:
        risk_level: User's risk tolerance (low, moderate, high)
        investment_horizon: Years to investment goal
        investment_amount: Monthly/annual investment amount

    Returns:
        Dict with investment recommendations
    """

    prompt = f"""
Generate personalized investment recommendations for:

Risk Tolerance: {risk_level}
Time Horizon: {investment_horizon} years
Available Investment Amount: ${investment_amount:.2f} per month

Consider:
- Current market conditions
- Age-appropriate risk levels
- Diversification benefits
- Tax implications
- Fees and expenses

Provide recommendations for:
1. Asset allocation percentages
2. Specific investment types suitable
3. Performance expectations
4. Risk considerations
5. Rebalancing frequency
6. Withdrawal strategy if applicable

Format as JSON:
{{
    "asset_allocation": [
        {{"asset": "Stocks/Equities", "percentage": 60, "rationale": "Growth potential"}},
        {{"asset": "Bonds", "percentage": 25, "rationale": "Income and stability"}},
        {{"asset": "Cash/Alternatives", "percentage": 15, "rationale": "Liquidity and diversification"}}
    ],
    "specific_recommendations": [
        {{"type": "Index ETFs", "rationale": "Low cost, diversified"}},
        {{"type": "Target Date Funds", "rationale": "Automatic rebalancing"}}
    ],
    "expected_returns": {{
        "conservative": "4-6%",
        "moderate": "6-8%",
        "aggressive": "8-10%"
    }},
    "risk_warnings": [
        "All investments carry risk",
        "Past performance doesn't predict future results"
    ],
    "action_steps": [
        "Open brokerage account",
        "Set up automatic transfers",
        "Choose low-cost index funds"
    ]
}}
"""

    messages = [
        {
            "role": "user",
            "content": prompt
        }
    ]

    try:
        ai_response = await call_openrouter_qwen(messages)

        try:
            result = json.loads(ai_response.strip())
            return result
        except json.JSONDecodeError:
            # Return conservative default recommendations
            return {
                "asset_allocation": [
                    {"asset": "Bonds & Fixed Income", "percentage": 50, "rationale": "Stability and income"},
                    {"asset": "Stocks/Equities", "percentage": 40, "rationale": "Growth potential"},
                    {"asset": "Cash/Alternatives", "percentage": 10, "rationale": "Liquidity and diversification"}
                ],
                "specific_recommendations": [
                    {"type": "Index Funds/ETFs", "rationale": "Low cost diversification"},
                    {"type": "Government Bonds", "rationale": "Safe, steady income"}
                ],
                "expected_returns": {
                    "conservative": "3-5%",
                    "moderate": "5-7%",
                    "aggressive": "7-9%"
                },
                "risk_warnings": [
                    "Investment values can fluctuate",
                    "Consider your financial situation and goals",
                    "Diversification doesn't eliminate risk"
                ],
                "action_steps": [
                    "Assess your financial goals and time horizon",
                    "Consider consulting with a financial advisor",
                    "Start with low-cost index funds",
                    "Set up regular investment contributions"
                ]
            }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate investment recommendations: {str(e)}"
        )

async def generate_tax_strategy(income_amount: float, expense_breakdown: Dict[str, float], filing_status: str = "single") -> Dict[str, Any]:
    """
    Generate AI-powered tax optimization strategy

    Args:
        income_amount: Annual income amount
        expense_breakdown: Dict of expense categories and amounts
        filing_status: Tax filing status

    Returns:
        Dict with tax optimization recommendations
    """

    expenses_text = "\n".join([f"- {k}: ${v:.2f}" for k, v in expense_breakdown.items()])

    prompt = f"""
Provide tax optimization recommendations for:

Annual Income: ${income_amount:.2f}
Filing Status: {filing_status}
Expense Categories: {expenses_text}

Analyze for tax optimization opportunities in:

1. Business Expense Deductions
2. Home Office Deductions (if applicable)
3. Retirement Contributions
4. Health Savings Accounts
5. Education-Related Savings
6. Charitable Contributions
7. Tax Credits Available
8. State-Specific Opportunities
9. Timing Strategies
10. Overall Tax Efficiency

Be specific about amounts, eligibility, and implementation steps.

Format as JSON:
{{
    "deductions": [
        {{"type": "Business Expenses", "amount": 5000, "eligibility": "Self-employed activities", "monthly_savings": 416}}
    ],
    "retirement_strategies": [
        {{"type": "Traditional IRA", "contribution_limit": 6000, "tax_benefit": "Pre-tax deduction"}}
    ],
    "tax_credits": [
        {{"credit": "Earned Income Tax Credit", "potential_value": 2000, "eligibility_criteria": "Based on income"}}
    ],
    "timing_strategies": [
        "Accelerate charitable giving to offset income",
        "Defer capital gains if possible"
    ],
    "estimated_tax_savings": {{
        "annual": 8000,
        "percentage": 15.2
    }},
    "action_items": [
        "Track all business expenses",
        "Set up retirement accounts",
        "Consult with tax professional"
    ]
}}
"""

    messages = [
        {
            "role": "user",
            "content": prompt
        }
    ]

    try:
        ai_response = await call_openrouter_qwen(messages)

        try:
            result = json.loads(ai_response.strip())
            return result
        except json.JSONDecodeError:
            return {
                "deductions": [
                    {"type": "Standard Deduction", "amount": 12950, "eligibility": "All taxpayers", "monthly_savings": 0}
                ],
                "retirement_strategies": [
                    {"type": "401(k) or IRA", "contribution_limit": 6000, "tax_benefit": "Tax-deferred growth"}
                ],
                "tax_credits": [
                    {"credit": "Professional consultation recommended", "potential_value": 0, "eligibility_criteria": "Based on specific situation"}
                ],
                "timing_strategies": [
                    "Track expense timing for tax efficiency",
                    "Consider annual giving to charitable causes"
                ],
                "estimated_tax_savings": {
                    "annual": income_amount * 0.10,  # Conservative estimate
                    "percentage": 10.0
                },
                "action_items": [
                    "Keep detailed expense records",
                    "Consult with a tax professional",
                    "Use tax planning software",
                    "Consider year-end tax planning"
                ]
            }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate tax strategy: {str(e)}"
        )
