# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**TeacherOpinion** — 초등학교 교사용 학생 생활통지표 의견 생성기. 학생 정보를 입력하면 Google Gemini API를 호출해 5개의 평어를 생성한다.

## Ports

부모 `PORT_REGISTRY.md` 참고:
- Backend: `8005:8000`
- Frontend: `8087:80`

## Commands

### Docker (Production)

```bash
# 빌드 + 실행
docker-compose up --build -d

# 로그 확인
docker-compose logs -f backend
docker-compose logs -f frontend

# 중지
docker-compose down
```

접속: `http://localhost:8087` (프론트), `http://localhost:8005/api` (백엔드)

### Backend (Local Dev)

```bash
cd backend
pip install -r requirements.txt
GEMINI_API_KEY=<key> uvicorn app.main:app --reload
# → http://localhost:8000
```

### Frontend (Local Dev)

```bash
cd frontend
npm install
npm run dev    # → http://localhost:3000 (프록시: /api → http://backend:8000)
npm run build  # → dist/
```

## Architecture

### Two-Container Setup

```
[User] → Nginx (8087) → React Static Files
                      ↘ /api/* → FastAPI (backend:8000)
```

- **Frontend container**: Nginx가 React 정적 파일 서빙 + `/api` 리버스 프록시
- **Backend container**: FastAPI + Uvicorn, `.env`의 `GEMINI_API_KEY` 필요
- Docker 내부 네트워크에서 `backend` 호스트명으로 통신

### Backend Structure (`backend/app/`)

| 파일 | 역할 |
|------|------|
| `main.py` | FastAPI 앱 생성, CORS, 라우터 등록 |
| `config.py` | pydantic-settings로 환경변수 파싱 |
| `api/routes.py` | `GET /api/available-models`, `POST /api/generate-opinions` |
| `services/gemini_service.py` | Gemini API 호출, 모델/프롬프트 캐싱, 응답 파싱 |
| `../prompts/opinion_prompt.txt` | 프롬프트 템플릿 (파일로 분리됨) |

**응답 파싱 전략** (`gemini_service.py`): JSON 직접 파싱 → 정규식 추출 → 따옴표 추출 → 라인 파싱 순으로 폴백.

**모델 폴백 순서**: 요청된 모델 → gemini-2.5-flash → gemini-2.5-pro → 첫 번째 사용 가능 모델.

### Frontend Structure (`frontend/src/`)

| 파일 | 역할 |
|------|------|
| `App.tsx` | 상태 관리, 핵심 핸들러, 레이아웃 |
| `components/StudentInfoForm.tsx` | 학생 정보 입력 폼 |
| `components/OpinionResults.tsx` | 생성된 의견 5개 표시 |
| `components/ModelSelector.tsx` | Gemini 모델 선택 드롭다운 |
| `hooks/useKeyboardShortcuts.ts` | 키보드 단축키 처리 |
| `utils/api.ts` | Axios 인스턴스 (base: `/api`, timeout: 60s) |
| `utils/clipboard.ts` | 클립보드 복사 (modern API + execCommand 폴백) |
| `types.ts` | `StudentInfo`, `OpinionData` 인터페이스 |

### Key API Contract

**`POST /api/generate-opinions`**
```json
// Request
{
  "name": "김철수",           // optional, max 5자
  "good_subjects": ["수학"],
  "weak_subjects": ["영어"],
  "personality": ["성실함"],
  "characteristics": "분석력 뛰어남",  // optional, max 40자
  "target_length": 75,        // 50~100
  "model_name": "gemini-2.5-flash"
}

// Response
{ "opinions": ["의견1", "의견2", "의견3", "의견4", "의견5"] }
```

백엔드 유효성 검사: 최소 하나의 입력 필드 필수.

## Environment

`.env` 파일 (루트):
```
GEMINI_API_KEY=your_key_here
```

`.env.example` 참고. `CORS_ORIGINS`는 `config.py`에서 기본값으로 `localhost:3000`, `localhost:80` 허용.

## Keyboard Shortcuts

| 단축키 | 동작 |
|--------|------|
| `Ctrl/Cmd + Enter` | 의견 생성 |
| `Ctrl/Cmd + R` | 새로고침 (재생성) |
| `Esc` | 폼 초기화 |
| `1`~`5` | 해당 번호 의견 복사 |
| `Ctrl + 1` | 이름 입력 포커스 |
| `Ctrl + 2` | 특징 입력 포커스 |
