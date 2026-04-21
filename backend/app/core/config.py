import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from backend directory
backend_dir = Path(__file__).parent.parent.parent
env_path = backend_dir / ".env"
load_dotenv(dotenv_path=env_path)


class Settings:
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    MODEL_NAME: str = os.getenv("MODEL_NAME", "llama-3.3-70b-versatile")
    SBERT_MODEL: str = os.getenv("SBERT_MODEL", "all-MiniLM-L6-v2")
    MAX_TOKENS: int = int(os.getenv("MAX_TOKENS", "2000"))
    ALLOWED_ORIGINS: list = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")

    # Database Settings
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./optiresume.db")

    # Security Settings — JWT_SECRET MUST be set in the environment; no hardcoded default.
    _jwt_secret_raw: str = os.getenv("JWT_SECRET", "")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", str(24 * 60)))

    @property
    def JWT_SECRET(self) -> str:  # type: ignore[override]
        if not self._jwt_secret_raw:
            raise ValueError(
                "JWT_SECRET is not set. "
                "Add it to your .env file: JWT_SECRET=<a long random string>"
            )
        return self._jwt_secret_raw

    # App Settings
    MAX_FILE_SIZE_MB: int = 5
    MAX_RESUME_CHARS: int = 8000
    MIN_SCORE_FLOOR: float = 10.0


settings = Settings()