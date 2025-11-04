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
        Dict with detailed recommendations and insights
    """

    # Calculate basic financial overview
    total_income = sum(t['amount'] for t in transactions if t['transactionType'] == 'income')
    total_expenses = sum(t['amount'] for t in transactions if t['transactionType'] == 'expense')
    net_profit = total_income - total_expenses

    # Calculate expense categories
    expense_categories = {}
    for t in transactions:
        if t['transactionType'] == 'expense':
            cat = t.get('category', 'Uncategorized')
            expense_categories[cat] = expense_categories.get(cat, 0) + t['amount']

    top_expenses = sorted(expense_categories.items(), key=lambda x: x[1], reverse=True)[:5]

    goals_text = "\n".join([f"- {goal}" for goal in goals]) if goals else "No specific financial goals mentioned"

    prompt = f"""
As a professional financial advisor, analyze this financial data and provide detailed, actionable recommendations:

FINANCIAL OVERVIEW:
- Total Income: ${total_income:.2f}
- Total Expenses: ${total_expenses:.2f}
- Net Profit/Loss: ${net_profit:.2f}
- Transaction Count: {len(transactions)}
- Profit Margin: {((net_profit/total_income)*100):.1f}% (if positive)

TOP EXPENSE CATEGORIES:
{chr(10).join([f"- {cat}: ${amt:.2f}" for cat, amt in top_expenses])}

FINANCIAL GOALS:
{goals_text}

As a certified financial advisor, provide 5 detailed, professional recommendations - one for each category below. Each recommendation should include:

1. **budget_optimization**: Focus on cash flow management and spending allocation
2. **expense_reduction**: Identify specific cost-saving opportunities based on their spending patterns
3. **revenue_enhancement**: Strategies to increase income or business revenue
4. **financial_planning**: Long-term financial planning and wealth building
5. **tax_optimization**: Tax-efficient strategies and deductions

For EACH recommendation, provide:
- **title**: A clear, professional headline (max 8 words)
- **description**: Detailed explanation (3-5 sentences) with specific advice
- **impact**: "High", "Medium", or "Low" based on potential benefit
- **category**: The category name
- **savings**: Specific potential savings or benefits (e.g., "$500-800 monthly", "15-20% cost reduction")

Format as JSON array of recommendation objects:

[
    {{
        "title": "Optimize Monthly Budget Allocation",
        "description": "Based on your spending patterns, consider reallocating 20% of discretionary expenses toward savings. Your current expense ratio suggests room for improvement in cash flow management. Implement the 50/30/20 rule: 50% needs, 30% wants, 20% savings/investing.",
        "impact": "High",
        "category": "budget_optimization",
        "savings": "$300-500 monthly savings potential"
    }},
    {{
        "title": "Reduce Subscription Services",
        "description": "Analysis shows ${sum(t['amount'] for t in transactions if 'subscription' in t.get('description', '').lower()):.2f} in recurring subscriptions. Cancel unused services and negotiate better rates for essential ones. Consider annual payments for 15-20% discounts on software licenses.",
        "impact": "Medium",
        "category": "expense_reduction",
        "savings": "$50-150 monthly recurring savings"
    }}
]

Make recommendations specific to their actual spending data and financially sound. Be professional, actionable, and realistic.
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
            # Validate that we got the expected format
            if isinstance(result, list) and len(result) > 0:
                # Ensure each recommendation has required fields
                validated_result = []
                for rec in result:
                    if all(key in rec for key in ['title', 'description', 'impact', 'category', 'savings']):
                        validated_result.append(rec)
                if validated_result:
                    return validated_result

            # If AI response is not in expected format, create fallback recommendations
            return create_fallback_recommendations(total_income, total_expenses, net_profit, top_expenses)

        except json.JSONDecodeError:
            # Try to extract JSON array from response
            import re
            array_match = re.search(r'\[.*\]', ai_response, re.DOTALL)
            if array_match:
                try:
                    result = json.loads(array_match.group(0))
                    if isinstance(result, list) and len(result) > 0:
                        return result
                except:
                    pass

            # Fallback to manually created recommendations
            return create_fallback_recommendations(total_income, total_expenses, net_profit, top_expenses)

    except Exception as e:
        # Return fallback recommendations on any error
        return create_fallback_recommendations(total_income, total_expenses, net_profit, top_expenses)


def create_fallback_recommendations(total_income: float, total_expenses: float, net_profit: float, top_expenses: List[tuple]) -> List[Dict[str, Any]]:
    """
    Create professional fallback recommendations when AI fails
    """
    recommendations = []

    # Budget optimization recommendation
    savings_rate = (net_profit / total_income) * 100 if total_income > 0 else 0
    if savings_rate < 20:
        recommendations.append({
            "title": "Implement 50/30/20 Budget Rule",
            "description": f"Your current savings rate is {savings_rate:.1f}%. Implement the 50/30/20 rule: allocate 50% of income to needs, 30% to wants, and 20% to savings/investing. This proven framework helps optimize cash flow and build financial security. Start by tracking expenses for one month to identify areas for reallocation.",
            "impact": "High",
            "category": "budget_optimization",
            "savings": f"${total_income * 0.10:.0f}-${total_income * 0.15:.0f} monthly savings potential"
        })
    else:
        recommendations.append({
            "title": "Maintain Strong Budget Discipline",
            "description": f"Your savings rate of {savings_rate:.1f}% is excellent. Continue monitoring expenses and look for opportunities to optimize within your needs category. Consider automating savings transfers and regularly reviewing your budget allocation to ensure it aligns with your changing financial goals.",
            "impact": "Medium",
            "category": "budget_optimization",
            "savings": "Maintaining current positive cash flow"
        })

    # Expense reduction based on top categories
    if top_expenses:
        top_category, top_amount = top_expenses[0]
        monthly_equivalent = top_amount / max(1, len(set(t['date'][:7] for t in [])))  # Rough monthly estimate

        recommendations.append({
            "title": f"Optimize {top_category} Expenses",
            "description": f"Your largest expense category is {top_category} at ${top_amount:.2f}. Review these expenses for potential savings: negotiate better rates with vendors, look for bulk purchasing discounts, or consider alternative suppliers. Implement a monthly spending limit for this category and track progress toward your target. Small reductions here can significantly impact your bottom line.",
            "impact": "High" if top_amount > total_expenses * 0.3 else "Medium",
            "category": "expense_reduction",
            "savings": f"${monthly_equivalent * 0.15:.0f}-${monthly_equivalent * 0.25:.0f} monthly potential"
        })

    # Revenue enhancement
    if total_income > 0:
        recommendations.append({
            "title": "Diversify Income Streams",
            "description": f"With current income of ${total_income:.2f}, consider diversifying revenue sources to reduce dependency on primary income. Explore side businesses, freelance opportunities, or investment income. Even small additional income streams can significantly boost your financial position. Start by identifying skills or assets you can monetize effectively.",
            "impact": "Medium",
            "category": "revenue_enhancement",
            "savings": f"${total_income * 0.10:.0f}-${total_income * 0.20:.0f} additional monthly income potential"
        })

    # Financial planning
    emergency_fund_target = total_expenses * 6  # 6 months of expenses
    recommendations.append({
        "title": "Build Emergency Fund",
        "description": f"An emergency fund covering 6 months of expenses (${emergency_fund_target:.0f}) is essential for financial security. Currently, most people face unexpected expenses without adequate reserves. Start small with $1,000 as an initial target, then build to 3-6 months of expenses. Keep funds in a high-yield savings account earning 4-5% interest while remaining liquid for emergencies.",
        "impact": "High",
        "category": "financial_planning",
        "savings": f"Financial security and peace of mind worth ${emergency_fund_target:.0f}"
    })

    # Tax optimization
    estimated_tax_savings = total_expenses * 0.15  # Rough estimate of deductible expenses
    recommendations.append({
        "title": "Maximize Tax Deductions",
        "description": f"With expenses of ${total_expenses:.2f}, you may be eligible for significant tax deductions. Keep detailed records of business-related expenses, home office costs, and charitable contributions. Consider bunching deductions into specific tax years and consult a tax professional for comprehensive advice. Proper tax planning can legally reduce your tax liability and improve cash flow.",
        "impact": "Medium",
        "category": "tax_optimization",
        "savings": f"${estimated_tax_savings:.0f} potential annual tax savings"
    })

    return recommendations

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
