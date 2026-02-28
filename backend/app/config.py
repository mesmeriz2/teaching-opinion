from pydantic_settings import BaseSettings
from typing import List
import logging

logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    gemini_api_key: str
    cors_origins: List[str] = ["http://localhost:3000", "http://localhost:80"]
    
    class Config:
        env_file = ".env"
        case_sensitive = False
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self._validate()
    
    def _validate(self) -> None:
        """환경 변수 검증"""
        if not self.gemini_api_key or not self.gemini_api_key.strip():
            raise ValueError(
                "GEMINI_API_KEY 환경 변수가 설정되지 않았습니다. "
                ".env 파일에 GEMINI_API_KEY를 설정해주세요."
            )
        
        if not self.cors_origins:
            logger.warning("CORS_ORIGINS가 설정되지 않았습니다. 기본값을 사용합니다.")
        
        logger.info("환경 변수 검증 완료")


settings = Settings()

