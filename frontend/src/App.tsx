import { useState, useCallback, useMemo } from 'react'
import StudentInfoForm from './components/StudentInfoForm'
import OpinionResults from './components/OpinionResults'
import ModelSelector from './components/ModelSelector'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import api from './utils/api'
import type { StudentInfo, OpinionData } from './types'

const App = () => {
  const [studentInfo, setStudentInfo] = useState<StudentInfo>({
    name: '',
    goodSubjects: [],
    weakSubjects: [],
    personality: [],
    characteristics: '',
    targetLength: 75,
    modelName: 'gemini-2.5-flash',
  })
  const [opinions, setOpinions] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 초기 상태를 useMemo로 메모이제이션
  const initialStudentInfo = useMemo<StudentInfo>(() => ({
    name: '',
    goodSubjects: [],
    weakSubjects: [],
    personality: [],
    characteristics: '',
    targetLength: 75,
    modelName: 'gemini-2.5-flash',
  }), [])

  const handleGenerate = useCallback(async () => {
    // 최소 하나의 항목 입력 확인
    const hasInput =
      studentInfo.name.trim() !== '' ||
      studentInfo.goodSubjects.length > 0 ||
      studentInfo.weakSubjects.length > 0 ||
      studentInfo.personality.length > 0 ||
      studentInfo.characteristics.trim() !== ''

    if (!hasInput) {
      setError('최소 하나의 항목은 입력해야 합니다.')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const { data } = await api.post<OpinionData>('/generate-opinions', {
        name: studentInfo.name.trim() || null,
        good_subjects: studentInfo.goodSubjects,
        weak_subjects: studentInfo.weakSubjects,
        personality: studentInfo.personality,
        characteristics: studentInfo.characteristics.trim() || null,
        target_length: studentInfo.targetLength,
        model_name: studentInfo.modelName,
      })

      setOpinions(data.opinions)
    } catch (err) {
      setError(err instanceof Error ? err.message : '의견 생성 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }, [studentInfo])

  const handleRefresh = useCallback(() => {
    if (opinions.length > 0) {
      handleGenerate()
    }
  }, [opinions.length, handleGenerate])

  const handleReset = useCallback(() => {
    setStudentInfo(initialStudentInfo)
    setOpinions([])
    setError(null)
  }, [initialStudentInfo])

  const handleCopyOpinion = useCallback((index: number) => {
    if (opinions[index]) {
      navigator.clipboard.writeText(opinions[index]).catch(() => {
        setError('클립보드 복사에 실패했습니다.')
      })
    }
  }, [opinions])

  const handleModelChange = useCallback((modelName: string) => {
    setStudentInfo((prev) => ({ ...prev, modelName }))
  }, [])

  const handleStudentInfoChange = useCallback((info: StudentInfo | ((prev: StudentInfo) => StudentInfo)) => {
    setStudentInfo(info)
  }, [])

  useKeyboardShortcuts({
    onGenerate: handleGenerate,
    onRefresh: handleRefresh,
    onReset: handleReset,
    onCopyOpinion: handleCopyOpinion,
  })

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 to-indigo-100 lg:overflow-hidden overflow-auto flex flex-col">
      <div className="flex-1 lg:overflow-hidden container mx-auto px-4 py-4 max-w-7xl">
        <div className="h-full flex flex-col lg:flex-row gap-4">
          {/* 왼쪽: 입력 영역 */}
          <div className="flex-shrink-0 lg:w-96 flex flex-col lg:overflow-y-auto overflow-visible">
            <div className="bg-white rounded-lg shadow-lg p-4 mb-4">
              <ModelSelector
                modelName={studentInfo.modelName}
                onChange={handleModelChange}
              />
            </div>

            <div className="bg-white rounded-lg shadow-lg p-4 flex-1">
              <StudentInfoForm
                studentInfo={studentInfo}
                onChange={handleStudentInfoChange}
                onGenerate={handleGenerate}
                isLoading={isLoading}
                error={error}
              />
            </div>
          </div>

          {/* 오른쪽: 결과 영역 */}
          <div className="flex-1 lg:overflow-y-auto overflow-visible">
            {opinions.length > 0 ? (
              <OpinionResults
                opinions={opinions}
                onRefresh={handleRefresh}
                isLoading={isLoading}
              />
            ) : (
              <div className="bg-white rounded-lg shadow-lg p-8 h-full flex items-center justify-center">
                <p className="text-gray-500 text-center">
                  학생 정보를 입력하고 의견 생성을 클릭하세요
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default App

