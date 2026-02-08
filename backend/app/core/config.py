from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    # Application
    APP_NAME: str = "Finaya"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Database
    MONGODB_URL: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "(default)"

    # Firebase
    FIREBASE_PROJECT_ID: str
    FIREBASE_PRIVATE_KEY_ID: str
    FIREBASE_PRIVATE_KEY: str
    FIREBASE_CLIENT_EMAIL: str
    FIREBASE_CLIENT_ID: str
    FIREBASE_AUTH_URI: str = "https://accounts.google.com/o/oauth2/auth"
    FIREBASE_TOKEN_URI: str = "https://oauth2.googleapis.com/token"
    FIREBASE_AUTH_PROVIDER_CERT_URL: str = "https://www.googleapis.com/oauth2/v1/certs"
    FIREBASE_CLIENT_CERT_URL: str = ""
    FIREBASE_STORAGE_BUCKET: str = ""

    # Google Gemini API
    GEMINI_API_KEY: str
    GEMINI_MODEL: str = "gemini-3-flash-preview"  # Updated default
    GOOGLE_MAPS_API_KEY: str = "" # Optional, if using Places API
    GOOGLE_SEARCH_API_KEY: str = "" # Custom Search JSON API Key
    GOOGLE_SEARCH_CX: str = ""      # Programmable Search Engine ID

    # Security
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080

    # CORS
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:5174,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:5174,http://localhost:8000,https://finaya.vercel.app"

    # Rate Limiting
    REDIS_URL: str = "redis://localhost:6379"
    RATE_LIMIT_REQUESTS: int = 100  # requests per window
    RATE_LIMIT_WINDOW: int = 60     # seconds
    AUTH_RATE_LIMIT_REQUESTS: int = 5  # auth endpoints stricter
    AUTH_RATE_LIMIT_WINDOW: int = 300   # 5 minutes

    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()
