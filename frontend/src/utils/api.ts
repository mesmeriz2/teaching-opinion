import axios, { AxiosInstance, AxiosError } from 'axios'

// axios 인스턴스 생성
const api: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 60000, // 60초 타임아웃
  headers: {
    'Content-Type': 'application/json',
  },
})

// 요청 인터셉터
api.interceptors.request.use(
  (config) => {
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 응답 인터셉터
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error: AxiosError<{ detail?: string }>) => {
    // 에러 처리
    if (error.response) {
      const message = error.response.data?.detail || error.response.statusText || '요청 처리 중 오류가 발생했습니다.'
      return Promise.reject(new Error(message))
    } else if (error.request) {
      return Promise.reject(new Error('서버에 연결할 수 없습니다. 네트워크를 확인해주세요.'))
    } else {
      return Promise.reject(new Error('요청 설정 중 오류가 발생했습니다.'))
    }
  }
)

export default api


