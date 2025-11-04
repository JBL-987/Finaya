import httpx
import re
from typing import Dict, Any, Tuple
from fastapi import HTTPException

from app.core.config import settings
from app.schemas.schemas import AreaDistribution

NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org/reverse"

# Constants for calculations
GLOBAL_AVERAGE_DENSITY = 4000  # people per sq km (global average)
AVG_ROAD_WIDTH = 30  # meters
VISITOR_RATE = 0.1  # 0.1%
PURCHASE_RATE = 90  # 90%
ERROR_ADJUSTMENT = 1.305  # 30.5% error adjustment

OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"

async def reverse_geocode(lat: float, lon: float) -> str:
    """
    Reverse geocode coordinates to get location name using Nominatim API

    Args:
        lat: Latitude
        lon: Longitude

    Returns:
        Location name string
    """
    try:
        params = {
            "format": "json",
            "lat": lat,
            "lon": lon,
            "zoom": 16,
            "addressdetails": 1
        }

        headers = {
            "User-Agent": "Finaya/1.0"
        }

        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(NOMINATIM_BASE_URL, params=params, headers=headers)

            if response.status_code != 200:
                return f"{lat}, {lon}"

            data = response.json()

            if data and "display_name" in data:
                # Extract the most relevant parts of the address
                address = data.get("address", {})

                # Try to build a nice location name
                location_parts = []

                # Add street name if available
                if "road" in address:
                    location_parts.append(address["road"])

                # Add suburb/district if available
                if "suburb" in address:
                    location_parts.append(address["suburb"])
                elif "village" in address:
                    location_parts.append(address["village"])
                elif "town" in address:
                    location_parts.append(address["town"])

                # Add city
                if "city" in address:
                    location_parts.append(address["city"])
                elif "county" in address:
                    location_parts.append(address["county"])

                # Add state if available
                if "state" in address:
                    location_parts.append(address["state"])

                if location_parts:
                    return ", ".join(location_parts)
                else:
                    return data["display_name"].split(",")[0]  # Fallback to first part
            else:
                return f"{lat}, {lon}"

    except Exception as e:
        print(f"Geocoding error: {e}")
        return f"{lat}, {lon}"

async def analyze_location_image(image_base64: str, image_metadata: Dict[str, Any]) -> Tuple[AreaDistribution, str]:
    """
    Analyze map screenshot using OpenRouter Qwen AI to determine area distributions

    Args:
        image_base64: Base64 encoded image data
        image_metadata: Image dimensions and scale information

    Returns:
        Tuple of (AreaDistribution, raw_response)
    """

    prompt = f"""
You are an expert urban planner analyzing a satellite/map image to determine land use distribution for business location analysis.

IMPORTANT: This is a map/satellite image showing a city area. Look for actual buildings, roads, and open spaces.

Analyze this map image and estimate the percentage distribution of land use in these THREE categories:

1. **RESIDENTIAL AREAS**: Houses, apartment buildings, residential neighborhoods (typically gray/brown colored blocks)
2. **ROAD/HIGHWAY AREAS**: Streets, roads, highways, parking lots (black/gray lines and areas)
3. **OPEN SPACES**: Parks, empty lots, green areas, water bodies, undeveloped land (green, blue, or light colored areas)

Image details:
- Dimensions: {image_metadata.get('width', 800)}x{image_metadata.get('height', 600)} pixels
- Scale: {image_metadata.get('scale', 1.0)} meters/pixel
- This represents a city area for business analysis

CRITICAL: Most city areas should have a MIX of residential, roads, and open spaces. If you see mostly roads, look more carefully for buildings and open areas.

Provide your analysis in EXACTLY this format:
residential: XX%
road: XX%
open_space: XX%

Example response:
residential: 45%
road: 30%
open_space: 25%

Make sure the percentages add up to 100%.
"""

    # Convert base64 to data URL
    image_data_url = f"data:image/png;base64,{image_base64}"

    request_body = {
        "model": settings.OPENROUTER_MODEL,
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": prompt
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": image_data_url
                        }
                    }
                ]
            }
        ],
        "max_tokens": 200,
        "temperature": 0.1
    }

    headers = {
        "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
        "HTTP-Referer": "http://localhost:5174",
        "X-Title": "Finaya",
        "Content-Type": "application/json"
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
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

            analysis_text = data["choices"][0]["message"]["content"]
            print(f"DEBUG: AI Analysis Response: {analysis_text}")  # Debug log

            # Parse the response to extract percentages
            area_distribution = parse_area_distribution(analysis_text)

            return area_distribution, analysis_text

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
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to analyze location: {str(e)}"
        )

def parse_area_distribution(response_text: str) -> AreaDistribution:
    """
    Parse Finaya AI response to extract area distribution percentages
    
    Args:
        response_text: Raw response from Finaya AI
    
    Returns:
        AreaDistribution object with parsed percentages
    """
    percentages = {
        "residential": 0.0,
        "road": 0.0,
        "openSpace": 0.0
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
            percentages["openSpace"] = float(open_space_match.group(1))

        # If no matches found, try fallback extraction
        if percentages["residential"] == 0 and percentages["road"] == 0 and percentages["openSpace"] == 0:
            all_numbers = re.findall(r'(\d+(?:\.\d+)?)%', response_text)
            if len(all_numbers) >= 3:
                percentages["residential"] = float(all_numbers[0])
                percentages["road"] = float(all_numbers[1])
                percentages["openSpace"] = float(all_numbers[2])

        # Validate that percentages add up to ~100%
        total = percentages["residential"] + percentages["road"] + percentages["openSpace"]

        # If percentages don't add up, normalize them
        if abs(total - 100) > 10 and total > 0:
            factor = 100 / total
            percentages["residential"] = round(percentages["residential"] * factor, 2)
            percentages["road"] = round(percentages["road"] * factor, 2)
            percentages["openSpace"] = round(percentages["openSpace"] * factor, 2)

        # If still zero or invalid, use fallback Jakarta values
        if total == 0:
            percentages = {
                "residential": 45.0,
                "road": 25.0,
                "openSpace": 30.0
            }

        return AreaDistribution(**percentages)
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to parse area distribution: {str(e)}"
        )

async def calculate_business_metrics(area_distribution: AreaDistribution, business_params: Dict[str, Any], screenshot_metadata: Dict[str, Any]) -> Dict[str, Any]:
    """
    Calculate business profitability metrics based on area distribution and business parameters

    Args:
        area_distribution: AreaDistribution object from OpenRouter analysis
        business_params: Business parameters (buildingWidth, operatingHours, productPrice)
        screenshot_metadata: Screenshot metadata (width, height, scale)

    Returns:
        Dict with calculated metrics
    """
    try:
        # Extract business parameters
        building_width = float(business_params.get('buildingWidth', 0))
        operating_hours = float(business_params.get('operatingHours', 0))
        product_price = float(business_params.get('productPrice', 0))

        if not all([building_width, operating_hours, product_price]):
            raise HTTPException(status_code=400, detail="Missing required business parameters")

        # Calculate area from screenshot data
        width = screenshot_metadata.get('width', 800)
        height = screenshot_metadata.get('height', 600)
        scale = screenshot_metadata.get('scale', 1.0)

        # Apply error adjustment
        adjusted_scale = scale * ERROR_ADJUSTMENT

        # Calculate real dimensions in meters
        width_meters = width * adjusted_scale
        height_meters = height * adjusted_scale
        area_sq_m = width_meters * height_meters
        area_sq_km = area_sq_m / 1_000_000

        # Extract percentages
        residential = area_distribution.residential
        road = area_distribution.road
        open_space = area_distribution.openSpace

        # Step 7: Calculate Current Gross Local Population (CGLP)
        cglp = GLOBAL_AVERAGE_DENSITY * area_sq_km

        # Step 8: Estimate population in residential areas
        pops = cglp * (residential / 100)

        # Step 8.1: Calculate road area
        road_area_sqm = area_sq_m * (road / 100)

        # Step 8.2: Calculate People Density on Road (PDR)
        if road_area_sqm <= 0:
            raise HTTPException(status_code=400, detail="Road area is zero or negative")
        pdr = pops / road_area_sqm

        # Step 9: Calculate Average Population Capitalization (APC)
        apc = building_width * AVG_ROAD_WIDTH * pdr

        # Step 10: Calculate Average Population Traffic (APT)
        daily_seconds = operating_hours * 3600
        apt = apc * daily_seconds

        # Step 11: Calculate Visitor Capitalizations of Daily Traffic (VCDT)
        vcdt = apt * (VISITOR_RATE / 100)

        # Step 12: Calculate Total People-Purchase Daily (TPPD)
        tppd = vcdt * (PURCHASE_RATE / 100)

        # Step 13: Calculate revenue
        daily_revenue = tppd * product_price
        monthly_revenue = daily_revenue * 30
        yearly_revenue = daily_revenue * 365

        return {
            "cglp": round(cglp) if cglp == cglp else 0,  # Handle NaN
            "pops": round(pops) if pops == pops else 0,
            "roadAreaSqm": round(road_area_sqm) if road_area_sqm == road_area_sqm else 0,
            "pdr": round(pdr, 6) if pdr == pdr else 0,
            "apc": round(apc, 3) if apc == apc else 0,
            "apt": round(apt) if apt == apt else 0,
            "vcdt": round(vcdt) if vcdt == vcdt else 0,
            "tppd": round(tppd) if tppd == tppd else 0,
            "dailyRevenue": round(daily_revenue) if daily_revenue == daily_revenue else 0,
            "monthlyRevenue": round(monthly_revenue) if monthly_revenue == monthly_revenue else 0,
            "yearlyRevenue": round(yearly_revenue) if yearly_revenue == yearly_revenue else 0,
            "areaData": {
                "widthMeters": round(width_meters, 2) if width_meters == width_meters else 0,
                "heightMeters": round(height_meters, 2) if height_meters == height_meters else 0,
                "areaSqM": round(area_sq_m, 2) if area_sq_m == area_sq_m else 0,
                "areaSqKm": round(area_sq_km, 6) if area_sq_km == area_sq_km else 0,
                "adjustedScale": round(adjusted_scale, 4) if adjusted_scale == adjusted_scale else 0
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to calculate business metrics: {str(e)}")
