from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    # Application
    APP_NAME: str = "Finaya"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Database
    DATABASE_URL: str = ""  # Optional, not used since we're using Supabase

    # Supabase
    SUPABASE_URL: str
    SUPABASE_KEY: str
    SUPABASE_SERVICE_ROLE_KEY: str

    # OpenRouter API
    OPENROUTER_API_KEY: str
    OPENROUTER_MODEL: str = "qwen/qwen2.5-vl-32b-instruct:free"

    # Security
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080

    # CORS
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:5174,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:5174,http://localhost:8000"

    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()
