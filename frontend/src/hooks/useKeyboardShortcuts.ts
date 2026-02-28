import { useEffect, useRef } from 'react'

interface UseKeyboardShortcutsProps {
  onGenerate: () => void
  onRefresh: () => void
  onReset: () => void
  onCopyOpinion: (index: number) => void
}

export const useKeyboardShortcuts = ({
  onGenerate,
  onRefresh,
  onReset,
  onCopyOpinion,
}: UseKeyboardShortcutsProps) => {
  // ref를 사용하여 최신 콜백 참조 유지 (의존성 배열 제거)
  const callbacksRef = useRef({ onGenerate, onRefresh, onReset, onCopyOpinion })
  
  // 콜백이 변경될 때마다 ref 업데이트
  useEffect(() => {
    callbacksRef.current = { onGenerate, onRefresh, onReset, onCopyOpinion }
  }, [onGenerate, onRefresh, onReset, onCopyOpinion])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const { onGenerate, onRefresh, onReset, onCopyOpinion } = callbacksRef.current

      // Ctrl/Cmd + Enter: 의견 생성
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        onGenerate()
        return
      }

      // Ctrl/Cmd + R: 새로고침
      if ((e.ctrlKey || e.metaKey) && e.key === 'r' && !e.shiftKey) {
        e.preventDefault()
        onRefresh()
        return
      }

      // Esc: 입력 초기화
      if (e.key === 'Escape') {
        e.preventDefault()
        onReset()
        return
      }

      // 1-5: 해당 번호 의견 복사
      if (e.key >= '1' && e.key <= '5' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const index = parseInt(e.key) - 1
        onCopyOpinion(index)
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, []) // 의존성 배열 비워서 이벤트 리스너는 한 번만 등록
}

