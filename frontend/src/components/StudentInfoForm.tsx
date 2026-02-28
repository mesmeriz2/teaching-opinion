import { useRef, useEffect, useState, useCallback } from 'react'
import type { StudentInfo } from '../types'

interface StudentInfoFormProps {
  studentInfo: StudentInfo
  onChange: (info: StudentInfo | ((prev: StudentInfo) => StudentInfo)) => void
  onGenerate: () => void
  isLoading: boolean
  error: string | null
}

const SUBJECTS = ['국어', '영어', '수학', '과학', '사회', '역사', '체육', '음악', '미술', '기술']
const PERSONALITY_TRAITS = ['침착함', '활발함', '사교적', '내성적', '성실함', '창의적', '리더십', '협동적', '독립적', '호기심 많음']

const StudentInfoForm = ({ studentInfo, onChange, onGenerate, isLoading, error }: StudentInfoFormProps) => {
  const nameInputRef = useRef<HTMLInputElement>(null)
  const characteristicsInputRef = useRef<HTMLTextAreaElement>(null)
  
  // 접기/펼치기 상태 (기본값: 모두 펼침)
  const [isGoodSubjectsOpen, setIsGoodSubjectsOpen] = useState(true)
  const [isWeakSubjectsOpen, setIsWeakSubjectsOpen] = useState(true)
  const [isPersonalityOpen, setIsPersonalityOpen] = useState(true)

  const toggleArrayItem = useCallback((array: string[], item: string) => {
    if (array.includes(item)) {
      return array.filter((i) => i !== item)
    }
    return [...array, item]
  }, [])

  const handleSubjectToggle = useCallback((subject: string, type: 'good' | 'weak') => {
    if (type === 'good') {
      onChange((prev) => ({
        ...prev,
        goodSubjects: toggleArrayItem(prev.goodSubjects, subject),
        weakSubjects: prev.weakSubjects.filter((s) => s !== subject),
      }))
    } else {
      onChange((prev) => ({
        ...prev,
        weakSubjects: toggleArrayItem(prev.weakSubjects, subject),
        goodSubjects: prev.goodSubjects.filter((s) => s !== subject),
      }))
    }
  }, [onChange, toggleArrayItem])

  const handlePersonalityToggle = useCallback((trait: string) => {
    onChange((prev) => ({
      ...prev,
      personality: toggleArrayItem(prev.personality, trait),
    }))
  }, [onChange, toggleArrayItem])

  const handleResetGoodSubjects = useCallback(() => {
    onChange((prev) => ({
      ...prev,
      goodSubjects: [],
    }))
  }, [onChange])

  const handleResetWeakSubjects = useCallback(() => {
    onChange((prev) => ({
      ...prev,
      weakSubjects: [],
    }))
  }, [onChange])

  const handleResetPersonality = useCallback(() => {
    onChange((prev) => ({
      ...prev,
      personality: [],
    }))
  }, [onChange])

  // 단축키 핸들러는 useKeyboardShortcuts에서 처리되지만, 여기서는 ref만 제공
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === '1') {
        e.preventDefault()
        nameInputRef.current?.focus()
      }
      if (e.ctrlKey && e.key === '2') {
        e.preventDefault()
        characteristicsInputRef.current?.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label htmlFor="name-input" className="block text-sm font-medium text-gray-700 mb-2">
              이름 <span className="text-gray-400 text-xs">(Ctrl + 1)</span>
            </label>
            <input
              id="name-input"
              ref={nameInputRef}
              type="text"
              value={studentInfo.name}
              onChange={(e) => {
                const value = e.target.value.slice(0, 5)
                onChange((prev) => ({ ...prev, name: value }))
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="이름 입력"
              maxLength={5}
              aria-label="학생 이름 입력"
            />
          </div>
          <div className="w-24">
            <label htmlFor="target-length-input" className="block text-sm font-medium text-gray-700 mb-2">
              답변 길이
            </label>
            <input
              id="target-length-input"
              type="number"
              min={50}
              max={100}
              value={studentInfo.targetLength}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 75
                const clampedValue = Math.min(Math.max(value, 50), 100)
                onChange((prev) => ({ ...prev, targetLength: clampedValue }))
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-label="답변 길이 입력"
            />
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="characteristics-input" className="block text-sm font-medium text-gray-700 mb-2">
          특징 <span className="text-gray-400 text-xs">(Ctrl + 2, 최대 40자)</span>
        </label>
        <textarea
          id="characteristics-input"
          ref={characteristicsInputRef}
          value={studentInfo.characteristics}
          onChange={(e) => {
            const value = e.target.value.slice(0, 40)
            onChange((prev) => ({ ...prev, characteristics: value }))
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="학생의 특징적인 면을 입력하세요"
          rows={2}
          maxLength={40}
          aria-label="학생 특징 입력"
        />
        <div className="text-right text-xs text-gray-500 mt-1" aria-live="polite">
          {studentInfo.characteristics.length}/40
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            잘하는 과목
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleResetGoodSubjects}
              disabled={studentInfo.goodSubjects.length === 0}
              className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 disabled:text-gray-300 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              aria-label="잘하는 과목 초기화"
            >
              초기화
            </button>
            <button
              type="button"
              onClick={() => setIsGoodSubjectsOpen(!isGoodSubjectsOpen)}
              className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              aria-label={isGoodSubjectsOpen ? '잘하는 과목 접기' : '잘하는 과목 펼치기'}
              aria-expanded={isGoodSubjectsOpen}
            >
              {isGoodSubjectsOpen ? '접기 ▲' : '펼치기 ▼'}
            </button>
          </div>
        </div>
        {isGoodSubjectsOpen && (
          <div className="flex flex-wrap gap-2" role="group" aria-label="잘하는 과목 선택">
            {SUBJECTS.map((subject) => (
              <button
                key={subject}
                type="button"
                onClick={() => handleSubjectToggle(subject, 'good')}
                aria-pressed={studentInfo.goodSubjects.includes(subject)}
                className={`px-3 py-2 text-sm rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  studentInfo.goodSubjects.includes(subject)
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {subject}
              </button>
            ))}
          </div>
        )}
        {!isGoodSubjectsOpen && studentInfo.goodSubjects.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {studentInfo.goodSubjects.map((subject) => (
              <span
                key={subject}
                className="px-3 py-1 text-sm bg-blue-500 text-white rounded-lg"
              >
                {subject}
              </span>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            못하는 과목
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleResetWeakSubjects}
              disabled={studentInfo.weakSubjects.length === 0}
              className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 disabled:text-gray-300 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              aria-label="못하는 과목 초기화"
            >
              초기화
            </button>
            <button
              type="button"
              onClick={() => setIsWeakSubjectsOpen(!isWeakSubjectsOpen)}
              className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              aria-label={isWeakSubjectsOpen ? '못하는 과목 접기' : '못하는 과목 펼치기'}
              aria-expanded={isWeakSubjectsOpen}
            >
              {isWeakSubjectsOpen ? '접기 ▲' : '펼치기 ▼'}
            </button>
          </div>
        </div>
        {isWeakSubjectsOpen && (
          <div className="flex flex-wrap gap-2" role="group" aria-label="못하는 과목 선택">
            {SUBJECTS.map((subject) => (
              <button
                key={subject}
                type="button"
                onClick={() => handleSubjectToggle(subject, 'weak')}
                aria-pressed={studentInfo.weakSubjects.includes(subject)}
                className={`px-3 py-2 text-sm rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 ${
                  studentInfo.weakSubjects.includes(subject)
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {subject}
              </button>
            ))}
          </div>
        )}
        {!isWeakSubjectsOpen && studentInfo.weakSubjects.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {studentInfo.weakSubjects.map((subject) => (
              <span
                key={subject}
                className="px-3 py-1 text-sm bg-red-500 text-white rounded-lg"
              >
                {subject}
              </span>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            성격
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleResetPersonality}
              disabled={studentInfo.personality.length === 0}
              className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 disabled:text-gray-300 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              aria-label="성격 초기화"
            >
              초기화
            </button>
            <button
              type="button"
              onClick={() => setIsPersonalityOpen(!isPersonalityOpen)}
              className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              aria-label={isPersonalityOpen ? '성격 접기' : '성격 펼치기'}
              aria-expanded={isPersonalityOpen}
            >
              {isPersonalityOpen ? '접기 ▲' : '펼치기 ▼'}
            </button>
          </div>
        </div>
        {isPersonalityOpen && (
          <div className="flex flex-wrap gap-2" role="group" aria-label="성격 선택">
            {PERSONALITY_TRAITS.map((trait) => (
              <button
                key={trait}
                type="button"
                onClick={() => handlePersonalityToggle(trait)}
                aria-pressed={studentInfo.personality.includes(trait)}
                className={`px-3 py-2 text-sm rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  studentInfo.personality.includes(trait)
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {trait}
              </button>
            ))}
          </div>
        )}
        {!isPersonalityOpen && studentInfo.personality.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {studentInfo.personality.map((trait) => (
              <span
                key={trait}
                className="px-3 py-1 text-sm bg-green-500 text-white rounded-lg"
              >
                {trait}
              </span>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <button
        onClick={onGenerate}
        disabled={isLoading}
        className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        aria-label="의견 생성"
      >
        {isLoading ? '의견 생성 중...' : '의견 생성 (Ctrl/Cmd + Enter)'}
      </button>
    </div>
  )
}

export default StudentInfoForm

