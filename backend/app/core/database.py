from supabase import create_client, Client
from .config import settings

supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

async def init_db():
    """Initialize Supabase connection"""
    try:
        response = supabase.table('users').select('*').limit(1).execute()
        print("✅ Supabase connection established")
    except Exception as e:
        print(f"❌ Supabase initialization failed: {e}")
        raise

def get_supabase_client() -> Client:
    """Get Supabase client instance"""
    return supabase
