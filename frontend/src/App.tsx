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
    if (opinions.length > 0) handleGenerate()
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
    <div className="app-layout">
      {/* ── LEFT: dark ink panel ── */}
      <div
        className="ink-scroll left-panel"
        style={{
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          background: 'var(--ink-mid)',
        }}
      >
        {/* Header */}
        <div
          style={{
            flexShrink: 0,
            padding: '1.4rem 1.5rem 1.2rem',
            borderBottom: '1px solid var(--ink-border)',
          }}
        >
          <div
            style={{
              fontFamily: 'IBM Plex Mono, monospace',
              fontSize: '0.65rem',
              letterSpacing: '0.18em',
              color: 'var(--amber)',
              textTransform: 'uppercase',
              marginBottom: '0.45rem',
            }}
          >
            Teacher's Assistant
          </div>
          <h1
            style={{
              fontFamily: 'Noto Serif KR, serif',
              fontSize: '1.2rem',
              fontWeight: 700,
              color: 'var(--chalk)',
              margin: 0,
              lineHeight: 1.4,
            }}
          >
            학생 생활통지표
            <br />
            <span style={{ fontWeight: 400, fontSize: '1rem', color: 'var(--chalk-dim)' }}>
              평어 생성기
            </span>
          </h1>
        </div>

        {/* Model selector */}
        <div
          style={{
            flexShrink: 0,
            padding: '1rem 1.5rem',
            borderBottom: '1px solid var(--ink-border)',
          }}
        >
          <ModelSelector modelName={studentInfo.modelName} onChange={handleModelChange} />
        </div>

        {/* Form */}
        <div style={{ flex: 1, padding: '1rem 1.5rem 1.5rem' }}>
          <StudentInfoForm
            studentInfo={studentInfo}
            onChange={handleStudentInfoChange}
            onGenerate={handleGenerate}
            isLoading={isLoading}
            error={error}
          />
        </div>
      </div>

      {/* ── RIGHT: cream paper panel ── */}
      <div
        className="paper-panel right-panel"
        style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      >
        <OpinionResults
          opinions={opinions}
          onRefresh={handleRefresh}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}

export default App
