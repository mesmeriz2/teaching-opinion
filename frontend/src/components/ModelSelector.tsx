import { useState, useEffect } from 'react'
import api from '../utils/api'

interface ModelSelectorProps {
  modelName: string
  onChange: (modelName: string) => void
}

interface Model {
  name: string
  full_name: string
  display_name: string
}

const ModelSelector = ({ modelName, onChange }: ModelSelectorProps) => {
  const [models, setModels] = useState<Model[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchModels = async () => {
      try {
        setIsLoading(true)
        const { data } = await api.get<{ models: Model[] }>('/available-models')
        setModels(data.models)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : '모델 목록을 불러올 수 없습니다.')
        // 폴백 모델 목록
        setModels([
          { name: 'gemini-2.5-flash', full_name: 'models/gemini-2.5-flash', display_name: 'Gemini 2.5 Flash (빠름 · 권장)' },
          { name: 'gemini-2.5-pro', full_name: 'models/gemini-2.5-pro', display_name: 'Gemini 2.5 Pro (고품질)' },
          { name: 'gemini-2.5-flash-lite', full_name: 'models/gemini-2.5-flash-lite', display_name: 'Gemini 2.5 Flash Lite (경량)' },
        ])
      } finally {
        setIsLoading(false)
      }
    }

    fetchModels()
  }, [])

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Gemini 모델 선택
      </label>
      {isLoading ? (
        <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
          모델 목록 로딩 중...
        </div>
      ) : (
        <>
          <select
            value={modelName}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            aria-label="Gemini 모델 선택"
          >
            {models.map((model) => (
              <option key={model.name} value={model.name}>
                {model.display_name || model.name}
              </option>
            ))}
          </select>
          {error && (
            <p className="mt-1 text-xs text-amber-600">
              {error}
            </p>
          )}
          <p className="mt-2 text-xs text-gray-500">
            모델에 따라 생성 속도와 품질이 달라질 수 있습니다.
          </p>
        </>
      )}
    </div>
  )
}

export default ModelSelector

