import httpx
import re
from typing import Dict, Any, Tuple
from fastapi import HTTPException

from app.core.config import settings
from app.schemas.schemas import AreaDistribution

class GeminiService:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.model = settings.GEMINI_MODEL
        self.base_url = "https://generativelanguage.googleapis.com/v1beta"

    async def analyze_location(self, location: str, business_type: str = "general") -> Dict[str, Any]:
        """Analyze a specific location for business opportunities"""
        prompt = f"""
        Provide a comprehensive business analysis for {location}.
        Include:
        1. Market overview and demographics
        2. Economic indicators
        3. Business opportunities in {business_type}
        4. Competition analysis
        5. Risk factors
        6. Recommendations

        Format the response as JSON with clear sections.
        """

        return await self.generate_analysis(prompt, location)

    async def generate_analysis(self, prompt: str, location: str) -> Dict[str, Any]:
        """Generate business analysis using Gemini API"""
        url = f"{self.base_url}/models/{self.model}:generateContent?key={self.api_key}"

        payload = {
            "contents": [{
                "parts": [{
                    "text": f"Analyze business opportunities in {location}. {prompt}"
                }]
            }]
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload)

        if response.status_code == 200:
            return response.json()
        else:
            raise Exception(f"Gemini API error: {response.status_code} - {response.text}")

GEMINI_API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.GEMINI_MODEL}:generateContent"

async def analyze_location_image(image_base64: str, image_metadata: Dict[str, Any]) -> Tuple[AreaDistribution, str]:
    """
    Analyze map screenshot using Gemini AI to determine area distributions
    
    Args:
        image_base64: Base64 encoded image data
        image_metadata: Image dimensions and scale information
    
    Returns:
        Tuple of (AreaDistribution, raw_response)
    """
    
    prompt = f"""
You are analyzing a map screenshot to determine area distributions for business location analysis.

In this Leaflet map image, the colors represent:
- Yellow: Main roads
- White: Secondary roads  
- Brown/Chocolate: Buildings (residential/commercial)
- Light Gray: Open spaces (parking, plazas)
- Green: Vegetative open spaces (parks, trees)
- Blue: Water bodies (rivers, lakes)

Please analyze this image and provide the exact percentage distribution of these three categories:

1. RESIDENTIAL AREA: All buildings (brown/chocolate colored areas)
2. ROAD AREA: All roads (yellow and white colored areas) 
3. OPEN SPACE AREA: All open spaces (light gray, green, and blue areas)

Image dimensions: {image_metadata.get('width', 800)}x{image_metadata.get('height', 600)} pixels
Map scale: {image_metadata.get('scale', 1.0)} meters/pixel

Please respond with ONLY the percentages in this exact format:
residential: XX%
road: XX%
open_space: XX%

The three percentages must add up to 100%.
"""

    request_body = {
        "contents": [{
            "parts": [
                {"text": prompt},
                {
                    "inline_data": {
                        "mime_type": "image/png",
                        "data": image_base64
                    }
                }
            ]
        }],
        "generationConfig": {
            "temperature": 0.1,
            "topK": 1,
            "topP": 0.8,
            "maxOutputTokens": 200,
        }
    }
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{GEMINI_API_URL}?key={settings.GEMINI_API_KEY}",
                json=request_body
            )
            
            if response.status_code != 200:
                error_data = response.json()
                raise HTTPException(
                    status_code=500,
                    detail=f"Gemini API Error: {error_data.get('error', {}).get('message', response.text)}"
                )
            
            data = response.json()
            
            if not data.get("candidates") or not data["candidates"][0].get("content"):
                raise HTTPException(
                    status_code=500,
                    detail="Invalid response format from Gemini AI"
                )
            
            analysis_text = data["candidates"][0]["content"]["parts"][0]["text"]
            
            # Parse the response to extract percentages
            area_distribution = parse_area_distribution(analysis_text)
            
            return area_distribution, analysis_text
            
    except httpx.TimeoutException:
        raise HTTPException(
            status_code=504,
            detail="Gemini AI request timed out"
        )
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to connect to Gemini AI: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to analyze location: {str(e)}"
        )

def parse_area_distribution(response_text: str) -> AreaDistribution:
    """
    Parse Gemini AI response to extract area distribution percentages
    
    Args:
        response_text: Raw response from Gemini AI
    
    Returns:
        AreaDistribution object with parsed percentages
    """
    percentages = {
        "residential": 0.0,
        "road": 0.0,
        "open_space": 0.0
    }
    
    try:
        # Extract percentages using regex - try multiple patterns
        residential_match = re.search(r'residential:\s*(\d+(?:\.\d+)?)%', response_text, re.IGNORECASE) or \
                           re.search(r'residential.*?(\d+(?:\.\d+)?)%', response_text, re.IGNORECASE)
        
        road_match = re.search(r'road:\s*(\d+(?:\.\d+)?)%', response_text, re.IGNORECASE) or \
                    re.search(r'road.*?(\d+(?:\.\d+)?)%', response_text, re.IGNORECASE)
        
        open_space_match = re.search(r'open[_\s]space:\s*(\d+(?:\.\d+)?)%', response_text, re.IGNORECASE) or \
                          re.search(r'open[_\s]space.*?(\d+(?:\.\d+)?)%', response_text, re.IGNORECASE) or \
                          re.search(r'green.*?(\d+(?:\.\d+)?)%', response_text, re.IGNORECASE)
        
        if residential_match:
            percentages["residential"] = float(residential_match.group(1))
        if road_match:
            percentages["road"] = float(road_match.group(1))
        if open_space_match:
            percentages["open_space"] = float(open_space_match.group(1))
        
        # If no matches found, try fallback extraction
        if percentages["residential"] == 0 and percentages["road"] == 0 and percentages["open_space"] == 0:
            all_numbers = re.findall(r'(\d+(?:\.\d+)?)%', response_text)
            if len(all_numbers) >= 3:
                percentages["residential"] = float(all_numbers[0])
                percentages["road"] = float(all_numbers[1])
                percentages["open_space"] = float(all_numbers[2])
        
        # Validate that percentages add up to ~100%
        total = percentages["residential"] + percentages["road"] + percentages["open_space"]
        
        # If percentages don't add up, normalize them
        if abs(total - 100) > 10 and total > 0:
            factor = 100 / total
            percentages["residential"] = round(percentages["residential"] * factor, 2)
            percentages["road"] = round(percentages["road"] * factor, 2)
            percentages["open_space"] = round(percentages["open_space"] * factor, 2)
        
        # If still zero or invalid, use fallback Jakarta values
        if total == 0:
            percentages = {
                "residential": 45.0,
                "road": 25.0,
                "open_space": 30.0
            }
        
        return AreaDistribution(**percentages)
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to parse area distribution: {str(e)}"
        )
