from supabase import create_client, Client, ClientOptions
from .config import settings
import httpx

transport = httpx.HTTPTransport(http2=False)

options = ClientOptions(
    postgrest_client_timeout=10,  
    schema="public",
    headers={},
)

supabase: Client = create_client(
    settings.SUPABASE_URL,
    settings.SUPABASE_KEY,
    options=options
)

async def init_db():
    """Initialize Supabase connection"""
    try:
        response = supabase.table("users").select("*").limit(1).execute()
        print("✅ Supabase connection established")
    except Exception as e:
        print(f"⚠️ Supabase initialization failed: {e}")
        # Jangan raise supaya backend tetap bisa jalan

def get_supabase_client() -> Client:
    """Get Supabase client instance"""
    return supabase
