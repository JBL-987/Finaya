import google.generativeai as genai
import json
import base64
import httpx
from typing import Dict, Any, List, Optional, Tuple
from fastapi import HTTPException
from app.core.config import settings
from .gemini_service_analysis import analyze_location_image, calculate_business_metrics, reverse_geocode

from google import genai
from google.genai import types

class FinayaAgent:
    def __init__(self):
        # Configure Gemini Client (v1 SDK)
        self.api_key = settings.GEMINI_API_KEY
        self.model_name = settings.GEMINI_MODEL
        self.client = genai.Client(api_key=self.api_key)
        
    def _format_competitors(self, competitors: List[Dict[str, Any]]) -> str:
        if not competitors:
            return "No data available."
        
        # Take top 20, sort by rating/reviews if possible, but they usually come sorted by prominence
        formatted = []
        for c in competitors[:20]:
            params = f"{c.get('name')} (Rating: {c.get('rating')}⭐, {c.get('user_ratings_total')} reviews)"
            formatted.append(params)
        return ", ".join(formatted)

    async def _web_search(self, query: str) -> str:
        """
        Performs a Google Search using the Custom Search JSON API.
        """
        if not settings.GOOGLE_SEARCH_API_KEY or not settings.GOOGLE_SEARCH_CX:
            return "Web Search Unavailable (API Key/CX not configured)."

        try:
            url = "https://www.googleapis.com/customsearch/v1"
            params = {
                "key": settings.GOOGLE_SEARCH_API_KEY,
                "cx": settings.GOOGLE_SEARCH_CX,
                "q": query,
                "num": 5  # Fetch top 5 results
            }
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(url, params=params)
                
                if resp.status_code == 200:
                    data = resp.json()
                    items = data.get("items", [])
                    if not items:
                        return "No relevant search results found."
                    
                    results = []
                    for item in items:
                        results.append(f"- **{item.get('title')}**: {item.get('snippet')} ({item.get('link')})")
                    return "\n".join(results)
                else:
                    return f"Search Error: {resp.status_code} - {resp.text}"
        except Exception as e:
            return f"Search Exception: {str(e)}"

    async def generate_executive_summary(self, context_data: Dict[str, Any]) -> str:
        """
        Generates a formal investor-ready Executive Summary.
        """
        metrics = context_data.get("metrics", {})
        risk_score = metrics.get("riskScore", 0.5)
        
        prompt = f"""
        You are a senior business consultant helping investors decide whether to open a business at a specific location.

        CONTEXT:
        - Location name: {context_data.get('location_name')}
        - Estimated population density: {context_data.get('area_distribution', {}).get('estimated_population_density')} people/km²
        - Adjusted passing traffic per day (APT): {metrics.get('apt')}
        - Estimated daily revenue: {metrics.get('dailyRevenue')}
        - Estimated monthly revenue: {metrics.get('monthlyRevenue')}
        - Competitor density: {context_data.get('area_distribution', {}).get('competitor_density_estimate')}
        - Risk score (0–1): {risk_score}

        TASK:
        """
        # (Truncated prompt content for brevity in tool call, normally would be full)
        prompt += """
        Write a concise, professional executive summary suitable for:
        - Bank loan proposal
        - Angel investor pitch
        - Franchise feasibility report

        OUTPUT REQUIREMENTS:
        1. Tone: Professional, confident, neutral (no hype)
        2. Length: 2–3 short paragraphs
        3. Structure:
           - Paragraph 1: Market opportunity overview
           - Paragraph 2: Key strengths and risks
           - Final line: CLEAR decision recommendation

        DECISION RULE:
        - If risk_score < 0.4 -> Recommendation: "GO"
        - If 0.4 <= risk_score <= 0.6 -> Recommendation: "CONSIDER WITH CAUTION"
        - If risk_score > 0.6 -> Recommendation: "NOT RECOMMENDED"

        FINAL LINE FORMAT (MANDATORY):
        Decision Recommendation: GO / CONSIDER WITH CAUTION / NOT RECOMMENDED

        Do NOT include bullet points.
        Do NOT mention AI, models, or assumptions.
        """
        
        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt
            )
            return response.text
        except Exception as e:
            return f"Error generating summary: {str(e)}"

    async def simulate_competitor_impact(self, current_data: Dict[str, Any], new_competitor: Dict[str, Any]) -> Dict[str, Any]:
        """
        Simulates the impact of a new hypothetical competitor.
        """
        prompt = f"""
        You are a strategic market analyst.

        SCENARIO:
        A new hypothetical competitor is planned near the target location.

        CURRENT DATA:
        - Current competitor density: {current_data.get('competitor_density')}
        - Current estimated market share: {current_data.get('market_share', 100)}%
        - Current risk score: {current_data.get('risk_score')}

        NEW COMPETITOR DETAILS:
        - Brand type: {new_competitor.get('brand_type')}
        - Distance from target location: {new_competitor.get('distance')} meters
        - Estimated brand strength: {new_competitor.get('strength')}

        TASK:
        Simulate the impact of this new competitor on the existing business.

        OUTPUT FORMAT (JSON ONLY):
        {{
          "adjusted_competitor_density": "low|medium|high",
          "estimated_market_share_loss_percentage": number,
          "new_risk_score": number,
          "impact_summary": "Short explanation of how and why the new competitor affects the business"
        }}
        """
        
        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=types.GenerateContentConfig(response_mime_type="application/json")
            )
            return json.loads(response.text)
        except Exception as e:
            return {"error": str(e)}

    async def analyze_competitor_sentiment(self, reviews_text: str) -> Dict[str, Any]:
        """
        Analyzes sentiment from competitor reviews to find market gaps.
        """
        prompt = f"""
        You are a market intelligence analyst.

        INPUT:
        {reviews_text}

        TASK:
        Analyze customer sentiment to identify:
        1. Recurring complaints
        2. Frequently praised features
        3. Operational weaknesses

        OUTPUT FORMAT (JSON ONLY):
        {{
          "top_complaints": ["phrase"],
          "top_strengths": ["phrase"],
          "market_gap_opportunities": ["opportunity"],
          "summary_insight": "paragraph"
        }}
        """
        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=types.GenerateContentConfig(response_mime_type="application/json")
            )
            return json.loads(response.text)
        except Exception as e:
            return {"error": str(e)}

    async def run_advisor_task(self, query: str, context_data: Dict[str, Any], history: List[Any] = [], user_id: Optional[str] = None) -> str:
        """
        AI Business Advisor: Answers questions based on the analysis results.
        """
        # 0. Fetch User History Context (if user_id provided)
        user_history_context = ""
        if user_id:
            try:
                # Lazy import to avoid circular dependency
                from app.services.analysis_service import AnalysisService
                service = AnalysisService()
                analyses = await service.get_user_analyses(user_id)
                if analyses:
                    summary_list = []
                    for a in analyses[:3]:
                         summary_list.append(f"- {a.name}: Score {a.data.get('metrics', {}).get('locationScore', 'N/A')}")
                    user_history_context = "\nUSER'S PAST ANALYSES:\n" + "\n".join(summary_list)
            except Exception as e:
                print(f"Failed to fetch user history: {e}")

        # 1. Perform Web Search
        search_query = f"{query} {context_data.get('location_name', '')}"
        search_results = await self._web_search(search_query)

        # Construct system prompt
        system_prompt = f"""
        You are the Finaya AI Business Consultant, an expert in location analytics.
        
        ANALYSIS CONTEXT:
        - Location: {context_data.get('location_name', 'Unknown')}
        - Business: {context_data.get('business_params', {})}
        - Metrics: {context_data.get('metrics', {})}
        - Competitors: {self._format_competitors(context_data.get('competitors', []))}
        
        REAL-TIME SEARCH:
        {search_results}

        {user_history_context}

        OBJECTIVE:
        Answer the user's question strategically. Use the search results to back up your claims.
        """
        
        # Build Chat History for SDK v1
        # SDK v1 expects 'role' and 'parts' (list of strings/content)
        chat_history = []
        
        # Add system context as the first user message (common pattern since system instructions are separate in v1 config, but this works universally)
        chat_history.append(types.Content(role="user", parts=[types.Part.from_text(text=system_prompt)]))
        chat_history.append(types.Content(role="model", parts=[types.Part.from_text(text="I am ready to advise based on the data provided.")]))

        for msg in history:
            role = getattr(msg, 'role', msg.get('role', 'user'))
            text = getattr(msg, 'text', msg.get('text', ''))
            
            # Map 'system' role to 'user' if it leaks into history, though shouldn't happen
            if role == "system": role = "user"
            
            chat_history.append(types.Content(role=role, parts=[types.Part.from_text(text=text)]))

        try:
            # Create a chat session
            chat = self.client.chats.create(
                model=self.model_name,
                history=chat_history,
                config=types.GenerateContentConfig(temperature=0.7)
            )
            
            response = chat.send_message(query)
            return response.text
        except Exception as e:
            print(f"Agent Task Error: {e}")
            return f"I apologize, but I encountered an error: {str(e)}"

    async def autonomous_search_suggestion(self, current_lat: float, current_lng: float, params: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Simulated Autonomous Exploration Suggestion.
        """
        prompt = f"""
        Based on a location at {current_lat}, {current_lng} and these business parameters {params},
        suggest 3 potential nearby 'Pivot' locations (relative directions) that might yield higher ROI.
        
        Respond in JSON format:
        [
          {{"reason": "closer to high foot traffic", "direction": "North-East", "offset_meters": 300}},
          ...
        ]
        """
        
        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=types.GenerateContentConfig(response_mime_type="application/json")
            )
            return json.loads(response.text)
        except:
            return []

# Singleton instance
finaya_agent = FinayaAgent()
