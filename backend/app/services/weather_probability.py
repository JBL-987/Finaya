import random
import httpx

WEATHER_VIC = {
    "clear": 1.0,
    "cloudy": 0.9,
    "light_rain": 0.85,
    "heavy_rain": 0.6,
    "storm": 0.4
}

# Fallback values
WEATHER_STATES = ["clear", "light_rain", "heavy_rain", "cloudy", "storm"]
WEATHER_PROBS = [0.4, 0.3, 0.15, 0.1, 0.05]

def get_wmo_weather_state(wmo_code: int) -> str:
    """Map WMO codes to our weather states"""
    if wmo_code <= 1: return "clear"        # 0,1: Clear/Mainly clear
    if wmo_code <= 3: return "cloudy"       # 2,3: Partly cloudy/Overcast
    if wmo_code <= 65: return "light_rain"  # 51-65: Drizzle/Rain
    if wmo_code <= 82: return "heavy_rain"  # 80-82: Showers
    return "storm"                          # 95+: Thunderstorm

def get_real_weather(lat: float, lng: float) -> str:
    """Fetch real-time weather from Open-Meteo (No API Key required)"""
    try:
        url = "https://api.open-meteo.com/v1/forecast"
        params = {
            "latitude": lat,
            "longitude": lng,
            "current_weather": "true"
        }
        # synchronous call for simplicity in this synchronous logic flow, 
        # but optimally should be async. Since this is called by async servicer, 
        # we'll use httpx.get but we need to run it synchronously or change logic to async.
        # Given this file is imported as valid python module, let's keep it sync for compatibility, 
        # or use httpx inside a wrapper. 
        # Actually Open-Meteo is fast. Let's use standard requests or httpx.Client().
        
        with httpx.Client(timeout=3.0) as client:
            resp = client.get(url, params=params)
            if resp.status_code == 200:
                data = resp.json()
                weather_code = data.get("current_weather", {}).get("weathercode", 0)
                return get_wmo_weather_state(weather_code)
    except Exception as e:
        print(f"Weather API failed: {e}, using fallback.")
    
    return random.choices(WEATHER_STATES, WEATHER_PROBS)[0]

def apply_weather_to_apt(apt: float, lat: float = None, lng: float = None) -> tuple:
    if lat and lng:
        weather = get_real_weather(lat, lng)
    else:
        # Fallback to random if no coordinates provided
        weather = random.choices(WEATHER_STATES, WEATHER_PROBS)[0]
    
    vic = WEATHER_VIC.get(weather, 1.0)
    return apt * vic, weather
