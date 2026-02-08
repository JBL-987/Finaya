import os
import logging
from motor.motor_asyncio import AsyncIOMotorClient
import firebase_admin
from firebase_admin import credentials
from app.core.config import settings

logger = logging.getLogger(__name__)

class Database:
    client: AsyncIOMotorClient = None
    db_name: str = settings.MONGODB_DB_NAME

    async def initialize(self):
        # 1. Initialize MongoDB
        try:
            self.client = AsyncIOMotorClient(settings.MONGODB_URL)
            # Verify connection
            await self.client.admin.command('ping')
            logger.info(f" MongoDB connected to {settings.MONGODB_URL}")
        except Exception as e:
            logger.error(f"❌ MongoDB connection failed: {e}")
            # Do not raise to allow app startup for debugging
            # raise e

        # 2. Initialize Firebase
        try:
            # ✅ Early exit if Firebase config is completely empty
            if not settings.FIREBASE_PROJECT_ID:
                logger.warning(" Firebase disabled - FIREBASE_PROJECT_ID not set")
                return
            
            if not firebase_admin._apps:
                # Check for JSON credential file in backend/ directory
                # We are in backend/app/core, so we need to go up two levels
                base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
                
                # Find the specific JSON file dynamically or use the known name
                json_file = "finaya-cf555-firebase-adminsdk-fbsvc-8d6a843225.json"
                cred_path = os.path.join(base_dir, json_file)

                if os.path.exists(cred_path):
                    cred = credentials.Certificate(cred_path)
                    firebase_admin.initialize_app(cred)
                    logger.info(f"✅ Firebase Admin initialized with file: {json_file}")
                elif settings.FIREBASE_PRIVATE_KEY:
                    # Fallback to env vars
                    logger.warning("Firebase JSON file not found, attempting to use settings...")
                    cred_dict = {
                        "type": "service_account",
                        "project_id": settings.FIREBASE_PROJECT_ID,
                        "private_key_id": settings.FIREBASE_PRIVATE_KEY_ID,
                        "private_key": settings.FIREBASE_PRIVATE_KEY.replace('\\n', '\n'),
                        "client_email": settings.FIREBASE_CLIENT_EMAIL,
                        "client_id": settings.FIREBASE_CLIENT_ID,
                        "auth_uri": settings.FIREBASE_AUTH_URI,
                        "token_uri": settings.FIREBASE_TOKEN_URI,
                        "auth_provider_x509_cert_url": settings.FIREBASE_AUTH_PROVIDER_CERT_URL,
                        "client_x509_cert_url": settings.FIREBASE_CLIENT_CERT_URL
                    }
                    cred = credentials.Certificate(cred_dict)
                    firebase_admin.initialize_app(cred)
                    logger.info(" Firebase Admin initialized with Environment Variables")
                else:
                    logger.warning(" No Firebase credentials found (File or Env). Firebase features will fail.")
            else:
                 logger.info(" Firebase Admin already initialized")

        except Exception as e:
            logger.error(f"❌ Firebase initialization failed: {e}")
            # We don't raise here to allow the app to start even if Firebase fails, 
            # though auth might break.

    async def close(self):
        if self.client:
            self.client.close()
            logger.info("MongoDB connection closed.")

database = Database()

async def init_db():
    await database.initialize()

def get_mongodb():
    if database.client:
        return database.client[database.db_name]
    return None

def get_firebase_auth():
    return firebase_admin.auth
