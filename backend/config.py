from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Supabase
    supabase_url: str
    supabase_key: str
    supabase_storage_bucket: str = "course-documents"

    # Database
    database_url: str

    # JWT
    jwt_secret: str
    jwt_refresh_secret: str
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 30
    jwt_refresh_token_expire_days: int = 7

    # OpenAI
    openai_api_key: str
    openai_embedding_model: str = "text-embedding-3-small"
    openai_chat_model: str = "gpt-4o-mini"

    # Pinecone
    pinecone_api_key: str
    pinecone_index_name: str = "course-assistant-vectors"

    # CORS
    cors_origins: str = "http://localhost:3000,http://localhost:5173,https://ai-course-assistant-architecture.vercel.app"

    # App
    environment: str = "development"
    rate_limit_per_minute: int = 60
    max_file_size_mb: int = 10

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    return Settings()
