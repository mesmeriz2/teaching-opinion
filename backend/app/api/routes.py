from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
import logging
from app.services.gemini_service import GeminiService
from app.config import settings

logger = logging.getLogger(__name__)

router = APIRouter()

# 서비스 인스턴스 생성 (초기화 시 모델 목록 캐싱)
gemini_service = GeminiService(settings.gemini_api_key)


class OpinionRequest(BaseModel):
    name: Optional[str] = Field(None, max_length=50)
    good_subjects: List[str] = Field(default_factory=list)
    weak_subjects: List[str] = Field(default_factory=list)
    personality: List[str] = Field(default_factory=list)
    characteristics: Optional[str] = Field(None, max_length=40)
    target_length: int = Field(75, ge=50, le=100)
    model_name: str = Field("gemini-2.5-flash")


class OpinionResponse(BaseModel):
    opinions: List[str]


@router.get("/available-models")
async def get_available_models():
    """사용 가능한 Gemini 모델 목록을 반환합니다. 캐시된 목록을 사용합니다."""
    try:
        models = GeminiService.get_available_models()
        if not models:
            logger.warning("캐시된 모델 목록이 없습니다. 모델 목록을 다시 조회합니다.")
            # 캐시가 없는 경우 서비스 재초기화로 모델 목록 갱신
            global gemini_service
            gemini_service = GeminiService(settings.gemini_api_key)
            models = GeminiService.get_available_models()
        
        return {"models": models}
    except Exception as e:
        logger.error(f"모델 목록 조회 오류: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="모델 목록을 조회할 수 없습니다. API 키를 확인해주세요."
        )


@router.post("/generate-opinions", response_model=OpinionResponse)
async def generate_opinions(request: OpinionRequest):
    """학생 평가의견을 생성합니다."""
    # 최소 하나의 항목 입력 확인
    has_input = (
        (request.name and request.name.strip())
        or len(request.good_subjects) > 0
        or len(request.weak_subjects) > 0
        or len(request.personality) > 0
        or (request.characteristics and request.characteristics.strip())
    )
    
    if not has_input:
        raise HTTPException(
            status_code=400,
            detail="최소 하나의 항목(이름, 잘하는 과목, 못하는 과목, 성격, 특징)은 입력해야 합니다."
        )
    
    # 답변 길이를 50-100 범위로 제한 (Pydantic에서 이미 검증되지만 이중 체크)
    target_length = max(50, min(100, request.target_length))
    
    try:
        opinions = gemini_service.generate_opinions(
            model_name=request.model_name,
            name=request.name.strip() if request.name else None,
            good_subjects=request.good_subjects,
            weak_subjects=request.weak_subjects,
            personality=request.personality,
            characteristics=request.characteristics.strip() if request.characteristics else None,
            target_length=target_length,
        )
        logger.info(f"의견 생성 성공: 모델={request.model_name}, 길이={target_length}")
        return OpinionResponse(opinions=opinions)
    except ValueError as e:
        logger.warning(f"의견 생성 검증 오류: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        error_detail = str(e)
        logger.error(f"의견 생성 오류: {error_detail}", exc_info=True)
        # 사용자에게는 간단한 메시지만 전달
        raise HTTPException(
            status_code=500,
            detail="의견 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
        )

