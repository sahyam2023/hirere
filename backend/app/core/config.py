from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    app_name: str = "Hirere"
    database_url: str = "postgresql://postgres:postgres@db:5432/hirere"
    face_match_threshold: float = 0.4

settings = Settings()
