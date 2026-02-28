import { useState, useRef, useCallback, useEffect } from 'react'
import { copyToClipboard } from '../utils/clipboard'

interface OpinionResultsProps {
  opinions: string[]
  onRefresh: () => void
  isLoading: boolean
}

const OpinionResults = ({ opinions, onRefresh, isLoading }: OpinionResultsProps) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const handleCopy = useCallback(async (text: string, index: number) => {
    // 이전 타이머가 있으면 클리어
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    const success = await copyToClipboard(text)
    if (success) {
      setCopiedIndex(index)
      timeoutRef.current = setTimeout(() => {
        setCopiedIndex(null)
        timeoutRef.current = null
      }, 2000)
    }
  }, [])

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 lg:h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 flex-shrink-0">
        <h2 className="text-lg sm:text-xl font-bold text-gray-800">생성된 평가의견</h2>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="w-full sm:w-auto px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
          aria-label="의견 새로고침"
        >
          {isLoading ? '재생성 중...' : '새로고침 (Ctrl/Cmd + R)'}
        </button>
      </div>

      <div className="lg:flex-1 lg:overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {opinions.map((opinion, index) => (
          <article
            key={index}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow relative"
            aria-labelledby={`opinion-${index + 1}-title`}
          >
            <div className="flex justify-between items-start mb-2">
              <h3 id={`opinion-${index + 1}-title`} className="text-sm font-semibold text-gray-600">
                의견 {index + 1}
              </h3>
              <button
                onClick={() => handleCopy(opinion, index)}
                className={`px-3 py-1 text-sm rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  copiedIndex === index
                    ? 'bg-green-500 text-white'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
                aria-label={`의견 ${index + 1} 복사`}
              >
                {copiedIndex === index ? '복사됨!' : `복사 (${index + 1})`}
              </button>
            </div>
            <p className="text-gray-700 leading-relaxed">{opinion}</p>
            <div className="mt-2 text-xs text-gray-500" aria-label="글자 수">
              {opinion.length}자
            </div>
          </article>
        ))}
        </div>
      </div>

      <div className="mt-3 text-xs text-gray-500 text-center flex-shrink-0">
        💡 팁: 키보드 단축키 1-5를 눌러 해당 번호의 의견을 바로 복사할 수 있습니다.
      </div>
    </div>
  )
}

export default OpinionResults

