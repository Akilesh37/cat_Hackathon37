import os
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "CAT Operator Intelligence & Safety Copilot"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./cat_copilot.db")
    
    # Redis
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    
    # AI / LLM
    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")
    ANTHROPIC_MODEL: str = os.getenv("ANTHROPIC_MODEL", "claude-3-5-sonnet-20241022")
    
    # Admin Auth
    SECRET_KEY: str = os.getenv("SECRET_KEY", "supersecretkey_for_cat_copilot")
    ADMIN_USERNAME: str = os.getenv("ADMIN_USERNAME", "admin")
    ADMIN_PASSWORD: str = os.getenv("ADMIN_PASSWORD", "catadmin2026")

    # External APIs
    ACCUWEATHER_API_KEY: str = os.getenv("ACCUWEATHER_API_KEY", "MOCK_KEY")
    GOOGLE_MAPS_API_KEY: str = os.getenv("GOOGLE_MAPS_API_KEY", "")
    
    # CORS
    CORS_ORIGINS: List[str] = ["*"]
    
    # Simulator Settings
    SIMULATOR_TICK_SECONDS: float = 2.0
    SIMULATOR_ENABLED: bool = True
    
    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
