import google.generativeai as genai
from typing import List, Optional, Dict
import json
import re
import os
import logging
from functools import lru_cache

logger = logging.getLogger(__name__)


class GeminiService:
    # 클래스 변수로 모델 목록 캐싱
    _cached_available_models: Optional[Dict[str, str]] = None
    _cached_prompt_template: Optional[str] = None
    
    def __init__(self, api_key: str):
        if not api_key:
            raise ValueError("GEMINI_API_KEY가 설정되지 않았습니다.")
        
        genai.configure(api_key=api_key)
        self.models = {
            "gemini-pro": "gemini-pro-latest",
            "gemini-pro-vision": "gemini-pro-vision",
            "gemini-1.5-pro": "gemini-2.5-pro",
            "gemini-1.5-flash": "gemini-2.5-flash",
            "gemini-2.5-pro": "gemini-2.5-pro",
            "gemini-2.5-flash": "gemini-2.5-flash",
        }
        
        # 프롬프트 템플릿 미리 로드
        self._load_prompt_template()
        
        # 사용 가능한 모델 목록 확인 및 매핑
        self._update_available_models()
    
    def _load_prompt_template(self) -> None:
        """프롬프트 템플릿을 메모리에 캐싱합니다."""
        if GeminiService._cached_prompt_template is not None:
            return
        
        current_dir = os.path.dirname(os.path.abspath(__file__))
        prompt_file_path = os.path.join(current_dir, '..', '..', 'prompts', 'opinion_prompt.txt')
        
        try:
            with open(prompt_file_path, 'r', encoding='utf-8') as f:
                GeminiService._cached_prompt_template = f.read()
            logger.info("프롬프트 템플릿을 성공적으로 로드했습니다.")
        except (FileNotFoundError, IOError) as e:
            logger.warning(f"프롬프트 파일을 읽을 수 없습니다: {str(e)}. 기본 프롬프트를 사용합니다.")
            GeminiService._cached_prompt_template = """당신은 경험이 풍부한 선생님입니다. 다음 학생에 대한 평가의견을 작성해주세요.

학생 정보:
{student_info}

요구사항:
1. 정확히 {target_length}자로 작성해주세요. {target_length}자를 초과하거나 미만이 되지 않도록 주의해주세요.
2. 5개의 서로 다른 스타일의 평가의견을 작성해주세요:
   - 격려형: 학생의 장점을 강조하고 격려하는 톤
   - 객관형: 객관적이고 균형잡힌 평가
   - 구체적 예시 포함형: 구체적인 사례나 예시를 포함한 평가
   - 발전 가능성 강조형: 향후 발전 가능성을 강조하는 평가
   - 종합형: 여러 측면을 종합적으로 평가

3. 각 의견은 JSON 배열 형식으로 반환해주세요:
["의견1", "의견2", "의견3", "의견4", "의견5"]

4. 각 의견은 정확히 {target_length}자여야 합니다.

JSON 형식으로만 응답해주세요. 다른 설명 없이 배열만 반환해주세요."""
    
    def _update_available_models(self) -> None:
        """사용 가능한 모델 목록을 확인하고 캐싱합니다."""
        if GeminiService._cached_available_models is not None:
            # 캐시된 모델 목록 사용
            available_models = GeminiService._cached_available_models
        else:
            # 모델 목록 조회 및 캐싱
            try:
                available_models = {}
                for model in genai.list_models():
                    if 'generateContent' in model.supported_generation_methods:
                        model_name = model.name.replace('models/', '')
                        available_models[model_name] = model_name
                GeminiService._cached_available_models = available_models
                logger.info(f"사용 가능한 모델 {len(available_models)}개를 캐싱했습니다.")
            except Exception as e:
                logger.warning(f"모델 목록 확인 실패: {str(e)}. 기본 모델을 사용합니다.")
                available_models = {}
        
        # 사용 가능한 모델로 업데이트
        if available_models:
            updated_models = {}
            for key, default_value in self.models.items():
                if default_value in available_models:
                    updated_models[key] = default_value
                else:
                    # 부분 매칭 시도
                    matched = False
                    for available_name in available_models.keys():
                        if default_value in available_name or available_name.endswith(default_value):
                            updated_models[key] = available_name
                            matched = True
                            break
                    if not matched:
                        updated_models[key] = default_value
            self.models = updated_models
    
    @classmethod
    def get_available_models(cls) -> List[Dict[str, str]]:
        """캐시된 사용 가능한 모델 목록을 반환합니다."""
        if cls._cached_available_models is None:
            return []
        
        models = []
        for model_name, _ in cls._cached_available_models.items():
            models.append({
                "name": model_name,
                "full_name": f"models/{model_name}",
                "display_name": model_name
            })
        return models
    
    @classmethod
    def clear_cache(cls) -> None:
        """캐시를 초기화합니다 (테스트용)."""
        cls._cached_available_models = None
        cls._cached_prompt_template = None

    def generate_opinions(
        self,
        model_name: str,
        name: Optional[str],
        good_subjects: List[str],
        weak_subjects: List[str],
        personality: List[str],
        characteristics: Optional[str],
        target_length: int,
    ) -> List[str]:
        """학생 평가의견 5개를 생성합니다."""
        model = self._get_model(model_name)
        prompt = self._build_prompt(
            name, good_subjects, weak_subjects, personality, characteristics, target_length
        )
        
        try:
            response = model.generate_content(prompt)
            response_text = self._extract_response_text(response)
            
            if not response_text:
                raise ValueError("Gemini API 응답에서 텍스트를 찾을 수 없습니다.")
            
            opinions = self._parse_response(response_text)
            return opinions
        except Exception as e:
            error_class = e.__class__.__name__
            error_msg = str(e)
            logger.error(f"Gemini API 오류 [{error_class}]: {error_msg}", exc_info=True)
            raise Exception(f"의견 생성 중 오류가 발생했습니다: {error_msg}")
    
    def _get_model(self, model_name: str):
        """모델을 초기화하고 반환합니다. 실패 시 대체 모델을 시도합니다."""
        model_id = self.models.get(model_name, "gemini-2.5-flash")
        
        # 모델 이름에서 'models/' 접두사 제거
        if model_id.startswith('models/'):
            model_id = model_id.replace('models/', '')
        
        # 모델 초기화 시도 (우선순위: 요청된 모델 -> gemini-2.5-flash -> gemini-pro -> 첫 번째 사용 가능한 모델)
        fallback_models = ["gemini-2.5-flash", "gemini-pro"]
        
        if model_id not in fallback_models:
            fallback_models.insert(0, model_id)
        
        last_error = None
        for attempt_model in fallback_models:
            try:
                model = genai.GenerativeModel(attempt_model)
                if attempt_model != model_id:
                    logger.info(f"모델 '{model_id}' 대신 '{attempt_model}'을 사용합니다.")
                return model
            except Exception as e:
                last_error = e
                continue
        
        # 모든 시도 실패 시 사용 가능한 모델 중 첫 번째 시도
        if GeminiService._cached_available_models:
            for available_model in GeminiService._cached_available_models.keys():
                try:
                    model = genai.GenerativeModel(available_model)
                    logger.warning(f"대체 모델 '{available_model}'을 사용합니다.")
                    return model
                except Exception:
                    continue
        
        raise Exception(f"모델 초기화 실패: {str(last_error)}")
    
    def _extract_response_text(self, response) -> Optional[str]:
        """응답 객체에서 텍스트를 추출합니다."""
        if hasattr(response, 'text') and response.text:
            return response.text
        
        if hasattr(response, 'candidates') and response.candidates:
            candidate = response.candidates[0]
            if hasattr(candidate, 'content') and hasattr(candidate.content, 'parts'):
                if candidate.content.parts:
                    return candidate.content.parts[0].text
        
        return None

    def _build_prompt(
        self,
        name: Optional[str],
        good_subjects: List[str],
        weak_subjects: List[str],
        personality: List[str],
        characteristics: Optional[str],
        target_length: int,
    ) -> str:
        """프롬프트를 생성합니다. 캐시된 템플릿을 사용합니다."""
        student_info_parts = []
        
        if name and name.strip():
            student_info_parts.append(f"이름: {name.strip()}")
        if good_subjects:
            student_info_parts.append(f"잘하는 과목: {', '.join(good_subjects)}")
        if weak_subjects:
            student_info_parts.append(f"못하는 과목: {', '.join(weak_subjects)}")
        if personality:
            student_info_parts.append(f"성격: {', '.join(personality)}")
        if characteristics and characteristics.strip():
            student_info_parts.append(f"특징: {characteristics.strip()}")
        
        student_info_text = "\n".join(student_info_parts)
        
        # 캐시된 프롬프트 템플릿 사용
        prompt_template = GeminiService._cached_prompt_template or """당신은 경험이 풍부한 선생님입니다. 다음 학생에 대한 평가의견을 작성해주세요.

학생 정보:
{student_info}

요구사항:
1. 정확히 {target_length}자로 작성해주세요. {target_length}자를 초과하거나 미만이 되지 않도록 주의해주세요.
2. 5개의 서로 다른 스타일의 평가의견을 작성해주세요:
   - 격려형: 학생의 장점을 강조하고 격려하는 톤
   - 객관형: 객관적이고 균형잡힌 평가
   - 구체적 예시 포함형: 구체적인 사례나 예시를 포함한 평가
   - 발전 가능성 강조형: 향후 발전 가능성을 강조하는 평가
   - 종합형: 여러 측면을 종합적으로 평가

3. 각 의견은 JSON 배열 형식으로 반환해주세요:
["의견1", "의견2", "의견3", "의견4", "의견5"]

4. 각 의견은 정확히 {target_length}자여야 합니다.

JSON 형식으로만 응답해주세요. 다른 설명 없이 배열만 반환해주세요."""
        
        return prompt_template.format(
            student_info=student_info_text,
            target_length=target_length
        )

    def _parse_response(self, response_text: str) -> List[str]:
        """응답 텍스트에서 JSON 배열을 파싱합니다. 최적화된 파싱 로직을 사용합니다."""
        if not response_text or not response_text.strip():
            return ["의견을 생성할 수 없습니다."] * 5
        
        cleaned_text = response_text.strip()
        
        # 1차 시도: 직접 JSON 파싱
        try:
            opinions = json.loads(cleaned_text)
            if isinstance(opinions, list) and len(opinions) >= 5:
                return opinions[:5]
            elif isinstance(opinions, list) and len(opinions) > 0:
                # 부족한 경우 채우기
                while len(opinions) < 5:
                    opinions.append("의견을 생성할 수 없습니다.")
                return opinions[:5]
        except json.JSONDecodeError:
            pass
        
        # 2차 시도: JSON 배열 패턴 추출
        json_match = re.search(r'\[[\s\S]*?\]', cleaned_text, re.DOTALL)
        if json_match:
            try:
                opinions = json.loads(json_match.group())
                if isinstance(opinions, list) and len(opinions) >= 5:
                    return opinions[:5]
                elif isinstance(opinions, list) and len(opinions) > 0:
                    while len(opinions) < 5:
                        opinions.append("의견을 생성할 수 없습니다.")
                    return opinions[:5]
            except json.JSONDecodeError:
                pass
        
        # 3차 시도: 따옴표로 감싸진 문자열 추출
        quoted_pattern = re.findall(r'["\']([^"\']+)["\']', cleaned_text)
        if len(quoted_pattern) >= 5:
            return quoted_pattern[:5]
        
        # 4차 시도: 줄 단위 파싱
        opinions = []
        lines = [line.strip() for line in cleaned_text.split('\n') if line.strip()]
        
        for line in lines:
            # 따옴표로 감싸진 줄
            if (line.startswith('"') and line.endswith('"')) or \
               (line.startswith("'") and line.endswith("'")):
                opinion = line[1:-1].strip()
                if opinion and len(opinions) < 5:
                    opinions.append(opinion)
            # 리스트 마커로 시작하는 줄
            elif line.startswith(('-', '•', '*', '1.', '2.', '3.', '4.', '5.')):
                opinion = re.sub(r'^[-•*]\s*|\d+\.\s*', '', line).strip().strip('"\'')
                if opinion and len(opinions) < 5:
                    opinions.append(opinion)
        
        # 5개가 아니면 부족한 만큼 채우기
        while len(opinions) < 5:
            opinions.append("의견을 생성할 수 없습니다.")
        
        return opinions[:5]

