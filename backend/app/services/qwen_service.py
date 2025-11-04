import httpx
import json
import asyncio
from typing import Dict, Any, List, Optional
from datetime import datetime
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

class QwenService:
    """
    All Qwen API interactions for AI automation workflow
    """

    def __init__(self):
        self.base_url = "https://openrouter.ai/api/v1/chat/completions"
        self.model = settings.OPENROUTER_MODEL or "microsoft/wizardlm-2-8x22b"
        self.max_retries = 3
        self.timeout = 30.0

    async def _make_api_call(self, messages: List[Dict], max_tokens: int = 1000) -> Dict[str, Any]:
        """
        Make API call to Qwen with retry logic

        Args:
            messages: List of message dicts for the conversation
            max_tokens: Maximum tokens to generate

        Returns:
            API response dict
        """
        headers = {
            "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:5174",
            "X-Title": "Finaya"
        }

        payload = {
            "model": self.model,
            "messages": messages,
            "max_tokens": max_tokens,
            "temperature": 0.1
        }

        for attempt in range(self.max_retries):
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    response = await client.post(
                        self.base_url,
                        json=payload,
                        headers=headers
                    )

                    if response.status_code == 200:
                        return response.json()
                    elif response.status_code == 429:  # Rate limit
                        wait_time = 2 ** attempt  # Exponential backoff
                        logger.warning(f"Rate limited, waiting {wait_time}s before retry")
                        await asyncio.sleep(wait_time)
                        continue
                    else:
                        error_data = response.json()
                        raise Exception(f"API Error {response.status_code}: {error_data.get('error', {}).get('message', response.text)}")

            except httpx.TimeoutException:
                logger.warning(f"Timeout on attempt {attempt + 1}")
                if attempt == self.max_retries - 1:
                    raise Exception("Qwen API timeout after all retries")
                await asyncio.sleep(1)

            except Exception as e:
                logger.error(f"API call failed on attempt {attempt + 1}: {str(e)}")
                if attempt == self.max_retries - 1:
                    raise e
                await asyncio.sleep(1)

        raise Exception("Failed to get response from Qwen API after all retries")

    def _validate_json_response(self, response_text: str) -> Dict[str, Any]:
        """
        Validate and parse JSON response from Qwen

        Args:
            response_text: Raw response text

        Returns:
            Parsed JSON dict
        """
        try:
            # Try to extract JSON from response
            start_idx = response_text.find('{')
            end_idx = response_text.rfind('}') + 1

            if start_idx == -1 or end_idx == 0:
                raise ValueError("No JSON found in response")

            json_str = response_text[start_idx:end_idx]
            return json.loads(json_str)

        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in response: {response_text[:200]}...")
            raise ValueError(f"Invalid JSON response: {str(e)}")

    async def extract_invoice_data(self, content: str, content_type: str = "text") -> Dict[str, Any]:
        """
        Extract invoice data using Qwen OCR + parsing

        Args:
            content: File content (text or base64 image)
            content_type: Type of content ('text' or 'image')

        Returns:
            Structured invoice data
        """
        if content_type == "image":
            # For images, use vision capabilities
            messages = [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": """Analyze this invoice/receipt image and extract structured data.

Return JSON with:
{
  "vendor": "company name",
  "invoice_number": "INV-123",
  "date": "YYYY-MM-DD",
  "items": [
    {"description": "item name", "quantity": 1, "unit_price": 100, "total": 100}
  ],
  "subtotal": 100,
  "tax": 10,
  "total": 110,
  "currency": "USD",
  "payment_method": "Credit Card",
  "suggested_category": "Office Supplies"
}

Be precise with numbers. If unsure, mark field as null."""
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/png;base64,{content}"
                            }
                        }
                    ]
                }
            ]
        else:
            # For text content
            messages = [
                {
                    "role": "user",
                    "content": f"""Analyze this invoice/receipt text and extract structured data.

Text content:
{content}

Return JSON with:
{{
  "vendor": "company name",
  "invoice_number": "INV-123",
  "date": "YYYY-MM-DD",
  "items": [
    {{"description": "item name", "quantity": 1, "unit_price": 100, "total": 100}}
  ],
  "subtotal": 100,
  "tax": 10,
  "total": 110,
  "currency": "USD",
  "payment_method": "Credit Card",
  "suggested_category": "Office Supplies"
}}

Be precise with numbers. If unsure, mark field as null."""
                }
            ]

        try:
            response = await self._make_api_call(messages, max_tokens=1500)
            response_text = response["choices"][0]["message"]["content"]
            logger.info(f"Qwen invoice extraction response: {response_text[:200]}...")

            result = self._validate_json_response(response_text)

            # Validate required fields
            required_fields = ["vendor", "total"]
            for field in required_fields:
                if field not in result or result[field] is None:
                    logger.warning(f"Missing required field: {field}")

            return result

        except Exception as e:
            logger.error(f"Invoice extraction failed: {str(e)}")
            raise Exception(f"Failed to extract invoice data: {str(e)}")

    async def categorize_transaction(self, description: str, amount: float) -> Dict[str, Any]:
        """
        Auto-categorize transaction using Qwen

        Args:
            description: Transaction description
            amount: Transaction amount

        Returns:
            Dict with category and confidence
        """
        messages = [
            {
                "role": "user",
                "content": f"""Categorize this transaction:
Description: "{description}"
Amount: ${amount}

Available categories:
- Office Supplies
- Meals & Entertainment
- Transportation
- Utilities
- Salaries & Wages
- Marketing & Advertising
- Rent & Facilities
- Software & Subscriptions
- Professional Services
- Other

Return JSON:
{{
  "category": "category name",
  "confidence": 0.95,
  "reasoning": "brief explanation"
}}"""
            }
        ]

        try:
            response = await self._make_api_call(messages, max_tokens=300)
            response_text = response["choices"][0]["message"]["content"]
            logger.info(f"Qwen categorization response: {response_text}")

            result = self._validate_json_response(response_text)

            # Validate response
            if "category" not in result:
                raise ValueError("Missing category in response")

            return result

        except Exception as e:
            logger.error(f"Transaction categorization failed: {str(e)}")
            # Return fallback category
            return {
                "category": "Other",
                "confidence": 0.0,
                "reasoning": f"AI categorization failed: {str(e)}"
            }

    async def analyze_spending_patterns(self, transactions: List[Dict]) -> Dict[str, Any]:
        """
        Analyze spending patterns using Qwen

        Args:
            transactions: List of transaction dicts

        Returns:
            Pattern analysis results
        """
        # Prepare transaction summary for AI
        transactions_summary = "\n".join([
            f"- {t.get('date', 'Unknown')}: {t.get('description', 'Unknown')} - ${t.get('amount', 0)} ({t.get('category', 'Uncategorized')})"
            for t in transactions[-20:]  # Last 20 transactions for context
        ])

        messages = [
            {
                "role": "user",
                "content": f"""Analyze these transactions and find patterns, anomalies, and insights:

{transactions_summary}

Return JSON:
{{
  "spending_trends": [
    {{"category": "Meals", "trend": "increasing", "percentage": "+25%", "concern_level": "medium"}}
  ],
  "anomalies": [
    {{"transaction_id": 123, "issue": "Duplicate payment detected", "severity": "high"}}
  ],
  "insights": [
    {{"type": "cost_saving", "description": "You could save $500/month by...", "impact": "high"}}
  ],
  "seasonal_patterns": {{}}
}}"""
            }
        ]

        try:
            response = await self._make_api_call(messages, max_tokens=1000)
            response_text = response["choices"][0]["message"]["content"]
            logger.info(f"Qwen pattern analysis response: {response_text[:200]}...")

            result = self._validate_json_response(response_text)
            return result

        except Exception as e:
            logger.error(f"Pattern analysis failed: {str(e)}")
            return {
                "spending_trends": [],
                "anomalies": [],
                "insights": [],
                "seasonal_patterns": {},
                "error": str(e)
            }

    async def generate_recommendations(self, transactions: List[Dict], patterns: Dict) -> List[Dict]:
        """
        Generate AI recommendations using Qwen

        Args:
            transactions: List of transaction dicts
            patterns: Pattern analysis results

        Returns:
            List of recommendation dicts
        """
        # Prepare summary data
        total_spent = sum(t.get('amount', 0) for t in transactions)
        categories = {}
        for t in transactions:
            cat = t.get('category', 'Other')
            categories[cat] = categories.get(cat, 0) + t.get('amount', 0)

        top_categories = sorted(categories.items(), key=lambda x: x[1], reverse=True)[:5]

        messages = [
            {
                "role": "user",
                "content": f"""Based on this financial data, generate actionable recommendations:

Total transactions: {len(transactions)}
Total spent: ${total_spent:.2f}
Top categories: {', '.join([f'{cat}: ${amt:.2f}' for cat, amt in top_categories])}
Patterns found: {len(patterns.get('anomalies', []))} anomalies, {len(patterns.get('insights', []))} insights

Generate 5-7 recommendations with:
{{
  "recommendations": [
    {{
      "title": "Optimize software subscriptions",
      "description": "Detailed explanation...",
      "category": "Cost Reduction",
      "impact": "High",
      "estimated_savings": "$200/month",
      "implementation_steps": ["step 1", "step 2"],
      "priority": 1
    }}
  ]
}}"""
            }
        ]

        try:
            response = await self._make_api_call(messages, max_tokens=1500)
            response_text = response["choices"][0]["message"]["content"]
            logger.info(f"Qwen recommendations response: {response_text[:200]}...")

            result = self._validate_json_response(response_text)
            return result.get("recommendations", [])

        except Exception as e:
            logger.error(f"Recommendations generation failed: {str(e)}")
            return [
                {
                    "title": "AI Analysis Failed",
                    "description": f"Unable to generate recommendations: {str(e)}",
                    "category": "System",
                    "impact": "Unknown",
                    "estimated_savings": "$0",
                    "implementation_steps": ["Contact support"],
                    "priority": 1
                }
            ]

    async def generate_financial_analysis(self, prompt: str, context: str = "") -> Dict[str, Any]:
        """
        Generate financial analysis using Qwen AI

        Args:
            prompt: The analysis prompt
            context: Additional context for the analysis

        Returns:
            Dict with analysis results
        """
        messages = [
            {
                "role": "user",
                "content": f"""You are a financial analysis expert. {context}

{prompt}

Please provide a comprehensive analysis and respond in JSON format where appropriate, or provide detailed structured analysis."""
            }
        ]

        try:
            response = await self._make_api_call(messages, max_tokens=2000)
            response_text = response["choices"][0]["message"]["content"]
            logger.info(f"Qwen financial analysis response: {response_text[:200]}...")

            # Try to parse as JSON first
            try:
                result = self._validate_json_response(response_text)
                return {"analysis": result, "raw_response": response_text}
            except:
                # If not JSON, return as structured text analysis
                return {
                    "analysis": {
                        "summary": response_text,
                        "context": context,
                        "generated_at": datetime.now().isoformat()
                    },
                    "raw_response": response_text
                }

        except Exception as e:
            logger.error(f"Financial analysis failed: {str(e)}")
            return {
                "analysis": {
                    "error": f"Analysis failed: {str(e)}",
                    "context": context
                },
                "raw_response": f"Error: {str(e)}"
            }
