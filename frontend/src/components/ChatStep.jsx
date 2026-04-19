import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * ChatStep — shows between upload and optimization
 * Displays AI-generated questions, collects answers, then triggers optimize.
 *
 * Props:
 *  questions:  [{id, question, hint}]
 *  loading:    bool  (true while questions are loading)
 *  onContinue: (userContext: string) => void
 *  onSkip:     () => void
 */
export default function ChatStep({ questions = [], loading = false, onContinue, onSkip }) {
  const [answers, setAnswers] = useState({})

  const handleChange = (id, value) => {
    setAnswers(prev => ({ ...prev, [id]: value }))
  }

  // Bundle all answers into a readable string for the AI context
  const buildContext = () => {
    if (!questions.length) return ''
    return questions
      .map(q => {
        const answer = answers[q.id]?.trim()
        if (!answer) return null
        return `Q: ${q.question}\nA: ${answer}`
      })
      .filter(Boolean)
      .join('\n\n')
  }

  const answeredCount = questions.filter(q => answers[q.id]?.trim()).length

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '2rem',
    }}>
      {/* Nav */}
      <nav className="or-nav" style={{ position: 'fixed', top: 0, left: 0, right: 0 }}>
        <div className="or-nav-inner">
          <div className="or-logo">
            <div className="or-logo-mark">OR</div>
            <span className="or-logo-text">Opti<span>Resume</span></span>
          </div>
          <button className="btn-outline" onClick={onSkip} style={{ fontSize: '13px' }}>
            Skip → Optimize now
          </button>
        </div>
      </nav>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          width: '100%', maxWidth: '620px',
          background: 'var(--bg2)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)', overflow: 'hidden',
          boxShadow: 'var(--shadow-lg)', marginTop: '70px',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '28px 32px 22px',
          borderBottom: '1px solid var(--border)',
          background: 'linear-gradient(135deg, var(--accentbg) 0%, var(--bg2) 100%)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '10px',
              background: 'var(--accentbg2)', border: '1px solid var(--accentbg2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px',
            }}>💬</div>
            <div>
              <h2 style={{ fontFamily: 'Sora,sans-serif', fontSize: '18px', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>
                Quick Context Check
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text2)', marginTop: '2px' }}>
                Help us optimize smarter — answer what you can, skip what you can't
              </p>
            </div>
          </div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: 'var(--accentbg)', border: '1px solid var(--accentbg2)',
            color: 'var(--accent)', borderRadius: '100px',
            padding: '4px 12px', fontSize: '12px', fontWeight: 600,
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }} />
            AI analyzed your resume vs job description
          </div>
        </div>

        {/* Questions */}
        <div style={{ padding: '24px 32px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{ width: '48px', height: '48px', margin: '0 auto 16px', position: 'relative' }}>
                <div className="loading-ring" style={{ width: '48px', height: '48px', position: 'absolute', inset: 0 }} />
              </div>
              <p style={{ fontSize: '14px', color: 'var(--text2)' }}>Analyzing your resume for questions…</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              <AnimatePresence>
                {questions.map((q, i) => (
                  <motion.div
                    key={q.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                  >
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      {/* Number bubble */}
                      <div style={{
                        width: '26px', height: '26px', borderRadius: '50%', flexShrink: 0,
                        background: answers[q.id]?.trim() ? 'var(--green)' : 'var(--accentbg)',
                        border: `1.5px solid ${answers[q.id]?.trim() ? 'var(--greenbd)' : 'var(--accentbg2)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '11px', fontWeight: 700,
                        color: answers[q.id]?.trim() ? '#fff' : 'var(--accent)',
                        transition: 'all 0.2s', marginTop: '4px',
                      }}>
                        {answers[q.id]?.trim() ? '✓' : i + 1}
                      </div>

                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: '8px', lineHeight: 1.4 }}>
                          {q.question}
                        </label>
                        <textarea
                          value={answers[q.id] || ''}
                          onChange={e => handleChange(q.id, e.target.value)}
                          placeholder={q.hint || 'Type your answer here... (or leave blank to skip)'}
                          rows={2}
                          style={{
                            width: '100%', padding: '10px 14px',
                            border: `1.5px solid ${answers[q.id]?.trim() ? 'var(--greenbd)' : 'var(--border)'}`,
                            borderRadius: '10px', fontSize: '13px',
                            fontFamily: "'DM Sans',sans-serif", color: 'var(--text)',
                            background: answers[q.id]?.trim() ? 'var(--greenbg)' : '#ffffff',
                            resize: 'none', outline: 'none', lineHeight: 1.5,
                            transition: 'all 0.2s',
                          }}
                          onFocus={e => {
                            if (!answers[q.id]?.trim()) {
                              e.target.style.borderColor = 'var(--accent)'
                              e.target.style.background = 'var(--accentbg)'
                            }
                          }}
                          onBlur={e => {
                            if (!answers[q.id]?.trim()) {
                              e.target.style.borderColor = 'var(--border)'
                              e.target.style.background = '#ffffff'
                            }
                          }}
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '18px 32px 24px',
          borderTop: '1px solid var(--border)',
          background: 'var(--bg)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ fontSize: '13px', color: 'var(--text3)' }}>
            {answeredCount > 0
              ? <span style={{ color: 'var(--green)', fontWeight: 600 }}>✓ {answeredCount}/{questions.length} answered</span>
              : 'All questions are optional'}
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              className="btn-outline"
              onClick={onSkip}
              style={{ fontSize: '13px' }}
            >
              Skip all
            </button>
            <button
              className="btn-accent"
              onClick={() => onContinue(buildContext())}
              style={{ padding: '9px 22px', fontSize: '14px' }}
            >
              {answeredCount > 0 ? `Optimize with ${answeredCount} answer${answeredCount > 1 ? 's' : ''} →` : 'Optimize Resume →'}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Helper note */}
      <motion.p
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
        style={{ marginTop: '18px', fontSize: '12px', color: 'var(--text3)', textAlign: 'center', maxWidth: '480px' }}
      >
        Your answers help the AI personalize bullet rewrites — they stay entirely in memory and are never stored.
      </motion.p>
    </div>
  )
}
