import { useState, useRef, useCallback, useEffect } from 'react'
import { copyToClipboard } from '../utils/clipboard'

interface OpinionResultsProps {
  opinions: string[]
  onRefresh: () => void
  isLoading: boolean
}

const CIRCLE_NUMS = ['①', '②', '③', '④', '⑤']

const OpinionResults = ({ opinions, onRefresh, isLoading }: OpinionResultsProps) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const handleCopy = useCallback(async (text: string, index: number) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    const success = await copyToClipboard(text)
    if (success) {
      setCopiedIndex(index)
      timeoutRef.current = setTimeout(() => {
        setCopiedIndex(null)
        timeoutRef.current = null
      }, 2000)
    }
  }, [])

  if (opinions.length === 0) {
    return (
      <div
        style={{
          minHeight: '200px',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '1rem',
          padding: '2rem',
        }}
      >
        {isLoading ? (
          <>
            <div style={{ display: 'flex', gap: '7px', alignItems: 'center' }}>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    width: '9px',
                    height: '9px',
                    borderRadius: '50%',
                    background: 'var(--amber)',
                    animation: 'dotPulse 1.3s ease-in-out infinite',
                    animationDelay: `${i * 0.22}s`,
                  }}
                />
              ))}
            </div>
            <p
              style={{
                fontFamily: 'Noto Serif KR, serif',
                fontSize: '0.9rem',
                color: 'var(--paper-muted)',
                margin: 0,
              }}
            >
              평어를 생성하고 있습니다…
            </p>
          </>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                border: '2px dashed var(--paper-border)',
                margin: '0 auto 1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.4rem',
                color: 'var(--paper-border)',
              }}
              aria-hidden="true"
            >
              ✏
            </div>
            <p
              style={{
                fontFamily: 'Noto Serif KR, serif',
                fontSize: '0.95rem',
                color: 'var(--paper-muted)',
                margin: 0,
                lineHeight: 1.7,
              }}
            >
              학생 정보를 입력하고<br />
              <span style={{ color: 'var(--amber)', fontWeight: 600 }}>의견 생성</span> 버튼을 눌러주세요
            </p>
            <div
              style={{
                marginTop: '1.5rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.35rem 0.8rem',
                border: '1px solid var(--paper-border)',
                borderRadius: '9999px',
                fontSize: '0.68rem',
                fontFamily: 'IBM Plex Mono, monospace',
                color: 'var(--paper-muted)',
                letterSpacing: '0.04em',
              }}
            >
              ⌘ + Enter
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ minHeight: '400px', height: '100%', display: 'flex', flexDirection: 'column', padding: '1.5rem' }}>

      {/* ── Header ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.2rem',
          flexShrink: 0,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: 'IBM Plex Mono, monospace',
              fontSize: '0.62rem',
              letterSpacing: '0.16em',
              color: 'var(--amber)',
              textTransform: 'uppercase',
              marginBottom: '0.2rem',
            }}
          >
            Generated Opinions
          </div>
          <h2
            style={{
              fontFamily: 'Noto Serif KR, serif',
              fontSize: '1.1rem',
              fontWeight: 700,
              color: 'var(--paper-text)',
              margin: 0,
            }}
          >
            생성된 평가의견
          </h2>
        </div>

        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="refresh-btn"
          aria-label="의견 새로고침"
        >
          {isLoading ? (
            <span
              style={{
                display: 'inline-block',
                animation: 'spin 0.8s linear infinite',
              }}
            >
              ↺
            </span>
          ) : (
            '↺ 새로고침'
          )}
        </button>
      </div>

      {/* ── Cards ── */}
      <div
        className="paper-scroll"
        style={{ flex: 1, overflowY: 'auto' }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '0.85rem',
          }}
        >
          {opinions.map((opinion, index) => (
            <article
              key={index}
              className="opinion-card"
              aria-labelledby={`opinion-${index + 1}-label`}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  marginBottom: '0.55rem',
                  gap: '0.5rem',
                }}
              >
                <span
                  id={`opinion-${index + 1}-label`}
                  style={{
                    fontFamily: 'IBM Plex Mono, monospace',
                    fontSize: '1.3rem',
                    fontWeight: 500,
                    color: 'var(--amber)',
                    lineHeight: 1,
                    flexShrink: 0,
                  }}
                >
                  {CIRCLE_NUMS[index]}
                </span>

                <button
                  onClick={() => handleCopy(opinion, index)}
                  className={`copy-btn${copiedIndex === index ? ' copied' : ''}`}
                  aria-label={`의견 ${index + 1} 복사`}
                >
                  {copiedIndex === index ? '✓ 복사됨' : `복사 (${index + 1})`}
                </button>
              </div>

              <p
                style={{
                  fontFamily: 'Noto Sans KR, sans-serif',
                  fontSize: '0.875rem',
                  lineHeight: 1.85,
                  color: 'var(--paper-text)',
                  margin: '0 0 0.5rem',
                  wordBreak: 'keep-all',
                }}
              >
                {opinion}
              </p>

              <div
                style={{
                  fontSize: '0.65rem',
                  color: 'var(--paper-muted)',
                  fontFamily: 'IBM Plex Mono, monospace',
                }}
                aria-label="글자 수"
              >
                {opinion.length}자
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* ── Footer hint ── */}
      <div
        style={{
          textAlign: 'center',
          fontSize: '0.63rem',
          color: 'var(--paper-muted)',
          fontFamily: 'IBM Plex Mono, monospace',
          paddingTop: '0.85rem',
          flexShrink: 0,
          letterSpacing: '0.04em',
        }}
      >
        키보드 1–5 로 해당 번호 의견을 바로 복사할 수 있습니다
      </div>
    </div>
  )
}

export default OpinionResults
