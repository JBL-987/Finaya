import json
import re
import base64
import httpx
import google.generativeai as genai
from typing import Dict, Any
from fastapi import HTTPException

from app.core.config import settings
from app.schemas.schemas import AreaDistribution
from app.services.traffic_probability import probabilistic_traffic
from app.services.weather_probability import apply_weather_to_apt

genai.configure(api_key=settings.GEMINI_API_KEY)

NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org/reverse"

GLOBAL_AVERAGE_DENSITY = 4000
AVG_ROAD_WIDTH = 30
VISITOR_RATE = 0.1
PURCHASE_RATE = 90
ERROR_ADJUSTMENT = 1.305


# JSON EXTRACT
def extract_json(text: str) -> dict:
    text = text.replace("```json", "").replace("```", "").strip()
    match = re.search(r"\{[\s\S]*\}", text)
    if not match:
        raise ValueError("No JSON found in Gemini response")
    return json.loads(match.group())

# REVERSE GEOCODE
async def reverse_geocode(lat: float, lon: float) -> str:
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.get(
                NOMINATIM_BASE_URL,
                params={
                    "format": "json",
                    "lat": lat,
                    "lon": lon,
                    "zoom": 16,
                    "addressdetails": 1,
                },
                headers={"User-Agent": "Finaya/1.0"},
            )

            data = res.json()

            if data and "display_name" in data:
                return data["display_name"].split(",")[0]

            return f"{lat}, {lon}"

    except Exception:
        return f"{lat}, {lon}"

# GEMINI VISION WITH SEARCH AUGMENTATION
async def _web_search_density(location_name: str) -> str:
    """
    Helper to search for density data to ground Gemini's visual estimate.
    """
    try:
        from app.services.agent_service import finaya_agent
        query = f"population density statistics demographics {location_name} site:citypopulation.de OR site:bps.go.id OR site:wikipedia.org"
        return await finaya_agent._web_search(query)
    except:
        return "No external density data available."

async def analyze_location_image(
    image_base64: str,
    image_metadata: Dict[str, Any],
) -> AreaDistribution:

    # 1. Get Location Context
    try:
        center_lat = image_metadata.get('center', {}).get('lat')
        center_lng = image_metadata.get('center', {}).get('lng')
        location_name = await reverse_geocode(center_lat, center_lng)
    except:
        location_name = "Unknown Location"

    # 2. Search for Ground Truth Data (RAG)
    search_context = await _web_search_density(location_name)

    prompt = f"""
    You are an urban planner and business analyst.
    
    TASK:
    1. Analyze the satellite image provided.
    2. Cross-reference with this external data about {location_name}:
    "{search_context}"
    
    OUTPUT JSON ONLY:
    {{
      "residential_percentage": number (0-100, estimate from roof density),
      "road_percentage": number (0-100),
      "open_space_percentage": number (0-100),
      "estimated_population_density": number (people/km2. PRIORITY: Use valid number from Search Context if found. If not, estimate visually),
      "competitor_density_estimate": "low|medium|high",
      "reasoning": "Explain how you calculated density based on the search data vs visual."
    }}
    """

    # 3. Analyze with Gemini (New V1 SDK)
    try:
        image_bytes = base64.b64decode(image_base64)
        
        # Initialize the new GenAI client
        from google import genai
        from google.genai import types
        
        client = genai.Client(api_key=settings.GEMINI_API_KEY)

        # Structure the multipart content correctly for the new SDK
        response = client.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=[
                prompt,
                types.Part.from_bytes(data=image_bytes, mime_type="image/png")
            ],
            config=types.GenerateContentConfig(
                temperature=0.1,
                max_output_tokens=1024
            )
        )

        # The new SDK response typically has .text directly accessible
        full_text = response.text

        data = extract_json(full_text)

        return AreaDistribution(
            residential=data.get("residential_percentage", 0),
            road=data.get("road_percentage", 0),
            openSpace=data.get("open_space_percentage", 0),
            estimated_population_density=data.get("estimated_population_density", GLOBAL_AVERAGE_DENSITY),
            competitor_density_estimate=data.get("competitor_density_estimate", "medium"),
            reasoning=data.get("reasoning", "")
        )

    except Exception as e:
        print(f"Gemini Analysis Failed: {e}")
        # Fallback if Gemini fails completely
        return AreaDistribution(
            residential=50,
            road=20,
            openSpace=30,
            estimated_population_density=4000,
            competitor_density_estimate="medium",
            reasoning=f"Fallback: AI Analysis Failed - {str(e)}"
        )

async def calculate_business_metrics(
    area_distribution: AreaDistribution,
    business_params: Dict[str, Any],
    screenshot_metadata: Dict[str, Any],
) -> Dict[str, Any]:

    try:
        bw = float(business_params["buildingWidth"])
        oh = float(business_params["operatingHours"])
        price = float(business_params["productPrice"])

        scale = screenshot_metadata["scale"] * ERROR_ADJUSTMENT
        width_m = screenshot_metadata["width"] * scale
        height_m = screenshot_metadata["height"] * scale

        area_sq_m = width_m * height_m
        area_sq_km = area_sq_m / 1_000_000

        residential = area_distribution.residential
        road = area_distribution.road

        cglp = GLOBAL_AVERAGE_DENSITY * area_sq_km
        pops = cglp * (residential / 100)

        road_area = area_sq_m * (road / 100)
        pdr = pops / road_area

        apc = bw * AVG_ROAD_WIDTH * pdr
        apt = apc * oh * 3600

        # Weather effect (Real-time)
        center_coords = screenshot_metadata.get('center', {})
        apt, weather = apply_weather_to_apt(apt, lat=center_coords.get('lat'), lng=center_coords.get('lng'))

        # Traffic probability
        apt = probabilistic_traffic(apt, ["B", "P", "B"])

        visitors = apt * (VISITOR_RATE / 100)
        buyers = visitors * (PURCHASE_RATE / 100)

        daily_rev = buyers * price
        monthly_rev = daily_rev * 30
        yearly_rev = daily_rev * 365

        # SCORING (More realistic formula)
        competitor_map = {"low": 1.0, "medium": 0.6, "high": 0.3}
        competitor_factor = competitor_map.get(
            area_distribution.competitor_density_estimate, 0.5
        )

        # Dampen profitability score.
        # Assuming 100M IDR monthly revenue is "Very High" (Score ~9) for a small business
        # Logarithmic scale helps dampen massive linear numbers
        import math
        if monthly_rev > 0:
            profit_score = 3.5 * math.log10(monthly_rev / 1_000_000 + 1) # +1 to avoid log(0)
            profit_score = min(profit_score, 9.5) # Hard cap at 9.5
        else:
            profit_score = 0

        # Density factor: 20,000 p/km2 is very dense (Jakarta slump/high rise) -> score 10
        density_factor = min(area_distribution.estimated_population_density / 2000, 10)

        # Final Weighted Score
        # Profitability (50%), Density (30%), Competitors (20%)
        raw_score = (0.5 * profit_score) + (0.3 * density_factor) + (0.2 * competitor_factor * 10)
        
        # Penalize slightly if transaction count is very low (e.g. < 20/day) to reflect "niche" risk
        if buyers < 20:
            raw_score *= 0.85

        final_score = min(max(raw_score, 1.0), 9.5) # Never 10/10, cap at 9.5

        risk = 1 - (final_score / 12) # Simplified risk metric inversely prop to score

        # Determine Confidence Level
        # Based on how much fallback data we used. 
        # If Gemini gave "reasonable" reasoning, we assume Medium-High.
        confidence = "Medium" 
        if "Fallback" in area_distribution.reasoning:
            confidence = "Low"
        elif area_distribution.estimated_population_density > 100 and area_distribution.road > 0:
            confidence = "High"

        assumptions = f"Assumes average transaction value of {price:,.0f} with a standard visitor conversion rate of {VISITOR_RATE}% from passing traffic."

        return {
            "monthlyRevenue": round(monthly_rev),
            "yearlyRevenue": round(yearly_rev),
            "dailyRevenue": round(daily_rev),
            "tppd": round(buyers),  # Total Purchases Per Day
            "cglp": round(cglp),    # CGLP Population density
            "pops": round(pops),    # Residential Population
            "apt": round(apt),      # Adjusted Passing Traffic
            "pdr": round(pdr, 4),   # Population Density Ratio
            "weatherUsed": weather,
            "locationScore": round(final_score, 2),
            "riskScore": round(risk, 3),
            "confidenceLevel": confidence,
            "assumptions": assumptions,
            "areaData": {
                "areaSqKm": area_sq_km,
                "areaSqM": area_sq_m,
                "widthM": width_m,
                "heightM": height_m
            }
        }

    except Exception as e:
        raise HTTPException(500, str(e))