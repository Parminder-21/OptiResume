import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * ChatStep — Claude-style conversational Q&A
 * One question at a time. Each question has clickable option chips + optional free text.
 */
export default function ChatStep({ questions = [], loading = false, onContinue, onSkip }) {
  const [currentIdx,    setCurrentIdx]    = useState(0)
  const [answers,       setAnswers]       = useState({}) // { qId: { selected: [], custom: '' } }
  const [customText,    setCustomText]    = useState('')
  const [showCustom,    setShowCustom]    = useState(false)
  const [chatHistory,   setChatHistory]   = useState([]) // Past Q&A shown above
  const inputRef = useRef(null)

  const current = questions[currentIdx]
  const isLast  = currentIdx === questions.length - 1

  // Auto-focus textarea when showCustom appears
  useEffect(() => {
    if (showCustom && inputRef.current) inputRef.current.focus()
  }, [showCustom, currentIdx])

  const currentAnswer = answers[current?.id] || { selected: [], custom: '' }
  const hasAnswer = currentAnswer.selected.length > 0 || currentAnswer.custom.trim()

  // Single-select option (radio behavior — click same to deselect)
  const toggleOption = (option) => {
    const prev = answers[current.id]?.selected || []
    const next  = prev.includes(option) ? [] : [option]   // ← radio: only one at a time
    setAnswers(a => ({ ...a, [current.id]: { ...currentAnswer, selected: next } }))
  }

  // Save custom text continuously
  const handleCustomChange = (val) => {
    setCustomText(val)
    setAnswers(a => ({ ...a, [current.id]: { ...(answers[current.id] || { selected: [] }), custom: val } }))
  }

  // Move to next question or finish
  const handleNext = () => {
    const ans = answers[current.id] || { selected: [], custom: '' }
    const summary = [
      ...ans.selected,
      ...(ans.custom.trim() ? [ans.custom.trim()] : []),
    ].join('; ')

    // Add to history
    setChatHistory(h => [
      ...h,
      { question: current.question, answer: summary || '—' },
    ])

    setCustomText('')
    setShowCustom(false)

    if (isLast) {
      onContinue(buildContext())
    } else {
      setCurrentIdx(i => i + 1)
    }
  }

  // Skip current question
  const handleSkipThis = () => {
    setChatHistory(h => [
      ...h,
      { question: current.question, answer: '(skipped)' },
    ])
    setCustomText('')
    setShowCustom(false)
    if (isLast) {
      onContinue(buildContext())
    } else {
      setCurrentIdx(i => i + 1)
    }
  }

  // Bundle all answers
  const buildContext = () => {
    const parts = questions.map(q => {
      const ans = answers[q.id]
      if (!ans) return null
      const parts = [...(ans.selected || []), ...(ans.custom?.trim() ? [ans.custom.trim()] : [])]
      if (!parts.length) return null
      return `Q: ${q.question}\nA: ${parts.join('; ')}`
    }).filter(Boolean)
    return parts.join('\n\n')
  }

  const progress = questions.length
    ? Math.round((currentIdx / questions.length) * 100)
    : 0

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* ── Nav ── */}
      <nav className="or-nav">
        <div className="or-nav-inner">
          <div className="or-logo">
            <div className="or-logo-mark">OR</div>
            <span className="or-logo-text">Opti<span>Resume</span></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Progress dots */}
            {!loading && questions.length > 0 && (
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                {questions.map((_, i) => (
                  <div key={i} style={{
                    width: i < currentIdx ? '20px' : '8px',
                    height: '8px', borderRadius: '100px',
                    background: i < currentIdx
                      ? 'var(--green)'
                      : i === currentIdx
                        ? 'var(--accent)'
                        : 'var(--border2)',
                    transition: 'all 0.3s ease',
                  }} />
                ))}
              </div>
            )}
            <button className="btn-outline" onClick={onSkip} style={{ fontSize: '12px' }}>
              Skip all →
            </button>
          </div>
        </div>
      </nav>

      {/* ── Chat area ── */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        maxWidth: '680px', width: '100%', margin: '0 auto',
        padding: '24px 1.5rem 120px',
      }}>

        {/* Loading state */}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '32px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%',
              background: 'var(--accentbg)', border: '2px solid var(--accentbg2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0,
            }}>💬</div>
            <div style={{
              background: 'var(--bg2)', border: '1px solid var(--border)',
              borderRadius: '0 16px 16px 16px', padding: '14px 18px',
            }}>
              <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    width: '7px', height: '7px', borderRadius: '50%',
                    background: 'var(--text3)',
                    animation: `or-pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                  }} />
                ))}
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text3)', marginTop: '6px' }}>
                Analyzing your resume for smart questions…
              </p>
            </div>
          </div>
        )}

        {/* Chat history (past Q&As) */}
        {!loading && chatHistory.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ marginBottom: '20px' }}
          >
            {/* AI question */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: 'var(--bg3)', border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px', flexShrink: 0,
              }}>🤖</div>
              <div style={{
                background: 'var(--bg2)', border: '1px solid var(--border)',
                borderRadius: '0 14px 14px 14px', padding: '10px 16px',
                fontSize: '14px', color: 'var(--text2)', lineHeight: 1.5,
              }}>
                {item.question}
              </div>
            </div>

            {/* User answer bubble */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <div style={{
                background: item.answer === '(skipped)'
                  ? 'var(--bg3)'
                  : 'var(--accent)',
                color: item.answer === '(skipped)' ? 'var(--text3)' : '#fff',
                borderRadius: '14px 0 14px 14px', padding: '10px 16px',
                fontSize: '13px', fontStyle: item.answer === '(skipped)' ? 'italic' : 'normal',
                maxWidth: '80%', lineHeight: 1.5,
              }}>
                {item.answer}
              </div>
            </div>
          </motion.div>
        ))}

        {/* Current question */}
        {!loading && current && (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIdx}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              {/* AI question bubble */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: 'var(--accentbg)', border: '2px solid var(--accentbg2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '16px', flexShrink: 0,
                }}>💬</div>
                <div style={{
                  background: 'var(--bg2)', border: '1px solid var(--border)',
                  borderRadius: '0 18px 18px 18px', padding: '16px 20px',
                  boxShadow: 'var(--shadow-sm)', flex: 1,
                }}>
                  <p style={{ fontSize: '15px', color: 'var(--text)', fontWeight: 500, lineHeight: 1.5, marginBottom: '14px' }}>
                    {current.question}
                  </p>

                  {/* Option chips */}
                  {current.options && current.options.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: showCustom ? '12px' : '0' }}>
                      {current.options.map(opt => {
                        const isSelected = currentAnswer.selected.includes(opt)
                        return (
                          <button
                            key={opt}
                            onClick={() => toggleOption(opt)}
                            style={{
                              padding: '7px 14px', borderRadius: '100px',
                              fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                              border: `1.5px solid ${isSelected ? 'var(--accent)' : 'var(--border2)'}`,
                              background: isSelected ? 'var(--accent)' : 'var(--bg)',
                              color: isSelected ? '#fff' : 'var(--text2)',
                              transition: 'all 0.15s',
                              display: 'flex', alignItems: 'center', gap: '5px',
                            }}
                          >
                            {isSelected && <span style={{ fontSize: '11px' }}>✓</span>}
                            {opt}
                          </button>
                        )
                      })}
                      {/* "Add details" toggle */}
                      <button
                        onClick={() => setShowCustom(v => !v)}
                        style={{
                          padding: '7px 14px', borderRadius: '100px',
                          fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                          border: `1.5px dashed ${showCustom ? 'var(--accent)' : 'var(--border2)'}`,
                          background: 'transparent',
                          color: showCustom ? 'var(--accent)' : 'var(--text3)',
                          transition: 'all 0.15s',
                        }}
                      >
                        {showCustom ? '× Close' : '✎ Add details'}
                      </button>
                    </div>
                  )}

                  {/* Custom text input */}
                  <AnimatePresence>
                    {showCustom && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        style={{ overflow: 'hidden', marginTop: '10px' }}
                      >
                        <textarea
                          ref={inputRef}
                          rows={2}
                          value={customText}
                          onChange={e => handleCustomChange(e.target.value)}
                          placeholder={current.hint || 'Add more context here...'}
                          style={{
                            width: '100%', padding: '10px 14px',
                            border: '1.5px solid var(--border)',
                            borderRadius: '10px', fontSize: '13px',
                            fontFamily: "'DM Sans',sans-serif", color: 'var(--text)',
                            background: '#ffffff', resize: 'none', outline: 'none', lineHeight: 1.5,
                          }}
                          onFocus={e => { e.target.style.borderColor = 'var(--accent)' }}
                          onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Action row */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingLeft: '46px' }}>
                <button
                  className="btn-outline"
                  onClick={handleSkipThis}
                  style={{ fontSize: '12px', padding: '7px 14px' }}
                >
                  Skip
                </button>
                <button
                  className="btn-accent"
                  onClick={handleNext}
                  disabled={!hasAnswer}
                  style={{ padding: '8px 20px', fontSize: '13px', borderRadius: '100px' }}
                >
                  {isLast
                    ? (hasAnswer ? 'Finish & Optimize →' : 'Skip & Optimize →')
                    : (hasAnswer ? 'Next →' : 'Skip →')}
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* ── Bottom hint bar ── */}
      {!loading && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: 'rgba(248,246,242,0.95)', backdropFilter: 'blur(8px)',
          borderTop: '1px solid var(--border)', padding: '14px 1.5rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ fontSize: '12px', color: 'var(--text3)' }}>
            Question <strong style={{ color: 'var(--text)' }}>{currentIdx + 1}</strong> of {questions.length} · Answers help personalize your resume
          </div>
          <button
            onClick={onSkip}
            style={{ fontSize: '12px', color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
          >
            Skip all & optimize →
          </button>
        </div>
      )}
    </div>
  )
}
