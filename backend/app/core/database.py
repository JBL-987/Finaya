from supabase import create_client, Client
from supabase.lib.client_options import ClientOptions
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

class Database:
    """Database manager class for dependency injection"""

    def __init__(self):
        self.client = supabase

    async def initialize(self):
        """Initialize database connection"""
        try:
            response = self.client.table("users").select("*").limit(1).execute()
            print("✅ Supabase connection established")
        except Exception as e:
            print(f"⚠️ Supabase initialization failed: {e}")
            # Jangan raise supaya backend tetap bisa jalan

    async def close(self):
        """Close database connection"""
        pass

async def init_db():
    """Legacy initialize Supabase connection (deprecated, use Database class)"""
    db = Database()
    await db.initialize()

def get_supabase_client() -> Client:
    """Get Supabase client instance"""
    return supabase
