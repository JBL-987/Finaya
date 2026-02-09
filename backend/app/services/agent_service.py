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
        self.api_key = settings.GEMINI_API_KEY
        self.model_name = settings.GEMINI_MODEL or "gemini-2.0-flash"
        self.client = None
        self.legacy_client = None
        self.use_legacy = False

        if not self.api_key:
            print("⚠️ GEMINI_API_KEY not found. Agent features will be disabled.")
            return

        # Try initializing Google Gen AI SDK v0 (google.generativeai) first as it is more stable in this env
        try:
            import google.generativeai as genai
            genai.configure(api_key=self.api_key)
            self.legacy_client = genai.GenerativeModel(self.model_name)
            self.use_legacy = True
            print("✅ Initialized Gemini using Legacy SDK (google.generativeai)")
        except ImportError:
            print("⚠️ Legacy SDK not found, trying new SDK...")
        except Exception as e:
            print(f"❌ Failed to initialize Legacy SDK: {e}")

        # If legacy failed, try new SDK v1 (google.genai)
        if not self.use_legacy:
            try:
                from google import genai
                self.client = genai.Client(api_key=self.api_key)
                print("✅ Initialized Gemini using New SDK (google.genai)")
            except Exception as e:
                print(f"❌ Failed to initialize New SDK: {e}")
                print("❌ FinayaAgent logic will be disabled.")

    def _format_competitors(self, competitors: List[Dict[str, Any]]) -> str:
        if not competitors:
            return "No data available."
        
        formatted = []
        for c in competitors[:20]:
            params = f"{c.get('name')} (Rating: {c.get('rating')}⭐, {c.get('user_ratings_total')} reviews)"
            formatted.append(params)
        return ", ".join(formatted)

    async def _web_search(self, query: str) -> str:
        if not settings.GOOGLE_SEARCH_API_KEY or not settings.GOOGLE_SEARCH_CX:
            return "Web Search Unavailable (API Key/CX not configured)."

        try:
            url = "https://www.googleapis.com/customsearch/v1"
            params = {
                "key": settings.GOOGLE_SEARCH_API_KEY,
                "cx": settings.GOOGLE_SEARCH_CX,
                "q": query,
                "num": 5
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
                    return f"Search Error: {resp.status_code}"
        except Exception as e:
            return f"Search Exception: {str(e)}"

    async def generate_executive_summary(self, context_data: Dict[str, Any]) -> str:
        if not self.client and not self.legacy_client:
            return "Executive Summary Unavailable (AI Agent disabled)."

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
        Write a concise executive summary for an investor pitch.
        
        OUTPUT REQUIREMENTS:
        1. Tone: Professional, confident, neutral
        2. Length: 2–3 short paragraphs
        3. Structure: 
           - Market opportunity
           - Key strengths/risks
           - CLEAR RECOMMENDATION (GO / CONSIDER WITH CAUTION / NOT RECOMMENDED)
        
        DECISION RULE:
        - Risk < 0.4: GO
        - 0.4 <= Risk <= 0.6: CONSIDER WITH CAUTION
        - Risk > 0.6: NOT RECOMMENDED
        """
        
        try:
            if self.use_legacy:
                response = self.legacy_client.generate_content(prompt)
                return response.text
            else:
                response = self.client.models.generate_content(
                    model=self.model_name,
                    contents=prompt
                )
                return response.text
        except Exception as e:
            return f"Error generating summary: {str(e)}"

    async def simulate_competitor_impact(self, current_data: Dict[str, Any], new_competitor: Dict[str, Any]) -> Dict[str, Any]:
        if not self.client and not self.legacy_client:
            return {"error": "AI Agent disabled"}

        prompt = f"""
        Simulate impact of new competitor.
        Current Density: {current_data.get('competitor_density')}
        New Competitor: {new_competitor.get('brand_type')} at {new_competitor.get('distance')}m

        Output JSON only:
        {{
          "adjusted_competitor_density": "string",
          "estimated_market_share_loss_percentage": number,
          "new_risk_score": number,
          "impact_summary": "string"
        }}
        """
        
        try:
            if self.use_legacy:
                response = self.legacy_client.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
                return json.loads(response.text)
            else:
                from google.genai import types
                response = self.client.models.generate_content(
                    model=self.model_name,
                    contents=prompt,
                    config=types.GenerateContentConfig(response_mime_type="application/json")
                )
                return json.loads(response.text)
        except Exception as e:
            return {"error": str(e)}

    async def analyze_competitor_sentiment(self, reviews_text: str) -> Dict[str, Any]:
        if not self.client and not self.legacy_client:
            return {"error": "AI Agent disabled"}

        prompt = f"""
        Analyze reviews:
        {reviews_text}

        Output JSON only:
        {{
          "top_complaints": ["string"],
          "top_strengths": ["string"],
          "market_gap_opportunities": ["string"],
          "summary_insight": "string"
        }}
        """
        try:
            if self.use_legacy:
                response = self.legacy_client.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
                return json.loads(response.text)
            else:
                from google.genai import types
                response = self.client.models.generate_content(
                    model=self.model_name,
                    contents=prompt,
                    config=types.GenerateContentConfig(response_mime_type="application/json")
                )
                return json.loads(response.text)
        except Exception as e:
            return {"error": str(e)}

    async def run_advisor_task(self, query: str, context_data: Dict[str, Any], history: List[Any] = [], user_id: Optional[str] = None) -> str:
        if not self.client and not self.legacy_client:
             return "I apologize, but I am currently disabled because the AI Engine API Key is missing."

        # 0. Fetch User History Context
        user_history_context = ""
        if user_id:
            try:
                from app.services.analysis_service import AnalysisService
                service = AnalysisService()
                analyses = await service.get_user_analyses(user_id)
                if analyses:
                    summary_list = []
                    for a in analyses[:3]:
                         summary_list.append(f"- {a.name}: Score {a.data.get('metrics', {}).get('locationScore', 'N/A')}")
                    user_history_context = "\nUSER'S PAST ANALYSES:\n" + "\n".join(summary_list)
            except Exception:
                pass

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
        
        try:
            if self.use_legacy:
                # Build history for legacy SDK
                # Legacy SDK expects [{'role': 'user'|'model', 'parts': ['text']}]
                chat_history = []
                
                # 1. System Prompt (as User)
                chat_history.append({'role': 'user', 'parts': [system_prompt]})
                
                # 2. Check first message in history
                if history:
                    # Get role of first message safely
                    first_msg = history[0]
                    first_role = getattr(first_msg, 'role', None) or first_msg.get('role', 'user')
                    if first_role == 'assistant': first_role = 'model'
                    
                    # If first historic message is User, we need a Model message before it to maintain alternation
                    if first_role == 'user':
                        chat_history.append({'role': 'model', 'parts': ["I understand the context. Please proceed."]})
                
                # 3. Append History
                for msg in history:
                     role = getattr(msg, 'role', None) or msg.get('role', 'user')
                     text = getattr(msg, 'text', None) or msg.get('text', '')
                     if role == 'assistant': role = 'model'
                     
                     chat_history.append({'role': role, 'parts': [text]})
                
                # 4. Start Chat
                chat = self.legacy_client.start_chat(history=chat_history)
                
                # 5. Send Query
                response = chat.send_message(query)
                return response.text

            else:
                from google.genai import types
                
                chat_history = []
                chat_history.append(types.Content(role="user", parts=[types.Part.from_text(text=system_prompt)]))
                chat_history.append(types.Content(role="model", parts=[types.Part.from_text(text="I am ready to advise.")]))

                for msg in history:
                    role = getattr(msg, 'role', msg.get('role', 'user'))
                    text = getattr(msg, 'text', msg.get('text', ''))
                    if role == "system": role = "user"
                    chat_history.append(types.Content(role=role, parts=[types.Part.from_text(text=text)]))

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
        if not self.client and not self.legacy_client:
            return []

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
            if self.use_legacy:
                response = self.legacy_client.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
                return json.loads(response.text)
            else:
                from google.genai import types
                response = self.client.models.generate_content(
                    model=self.model_name,
                    contents=prompt,
                    config=types.GenerateContentConfig(response_mime_type="application/json")
                )
                return json.loads(response.text)
        except:
            return []

# Lazy singleton instance (not initialized at import time)
finaya_agent = None

def get_finaya_agent() -> FinayaAgent:
    """
    Lazy initialization of FinayaAgent to avoid blocking port binding during Railway startup.
    """
    global finaya_agent
    if finaya_agent is None:
        finaya_agent = FinayaAgent()
    return finaya_agent

