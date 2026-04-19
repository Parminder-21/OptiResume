import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PROCESSING_STEPS } from '../utils/helpers.js'

export default function Loader() {
  const [currentStep, setCurrentStep] = useState(0)
  const [progress,    setProgress]    = useState(0)

  useEffect(() => {
    let stepIndex = 0
    const totalDuration = PROCESSING_STEPS.reduce((s, p) => s + p.duration, 0)
    let elapsed = 0

    const advance = () => {
      if (stepIndex >= PROCESSING_STEPS.length - 1) return
      const step = PROCESSING_STEPS[stepIndex]
      setTimeout(() => {
        stepIndex++
        elapsed += step.duration
        setCurrentStep(stepIndex)
        setProgress(Math.min(95, (elapsed / totalDuration) * 100))
        advance()
      }, step.duration)
    }
    advance()

    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 0.5, 95))
    }, 80)

    return () => clearInterval(progressInterval)
  }, [])

  return (
    <div style={{
      minHeight: 'calc(100vh - 60px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px 2rem', background: 'var(--bg)',
    }}>
      {/* Nav */}
      <nav className="or-nav" style={{ position: 'fixed', top: 0, left: 0, right: 0 }}>
        <div className="or-nav-inner">
          <div className="or-logo">
            <div className="or-logo-mark">OR</div>
            <span className="or-logo-text">Opti<span>Resume</span></span>
          </div>
        </div>
      </nav>

      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        style={{
          background: 'var(--bg2)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)', padding: '52px 60px',
          width: '100%', maxWidth: '520px', textAlign: 'center',
          boxShadow: 'var(--shadow-lg)', marginTop: '60px',
        }}
      >
        {/* Spinner */}
        <div style={{ width: '80px', height: '80px', margin: '0 auto 28px', position: 'relative' }}>
          <div className="loading-ring" style={{ position: 'absolute', inset: 0 }} />
          <div className="loading-ring2" />
        </div>

        <h2 style={{
          fontFamily: 'Sora,sans-serif', fontSize: '22px', fontWeight: 700,
          color: 'var(--text)', letterSpacing: '-0.02em', marginBottom: '8px',
        }}>
          Optimizing your resume
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text2)', marginBottom: '28px' }}>
          AI is analyzing and rewriting for maximum ATS impact
        </p>

        {/* Progress */}
        <div className="progress-track" style={{ marginBottom: '6px' }}>
          <motion.div
            className="progress-bar"
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>
        <p style={{ fontSize: '11px', color: 'var(--text3)', textAlign: 'right', marginBottom: '24px' }}>
          {Math.round(progress)}%
        </p>

        {/* Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left' }}>
          {PROCESSING_STEPS.map((step, i) => (
            <AnimatePresence key={i}>
              {i <= currentStep && (
                <motion.div
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    fontSize: '13px',
                    color: i < currentStep ? 'var(--green)' : i === currentStep ? 'var(--text)' : 'var(--text3)',
                  }}
                >
                  <div style={{
                    width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '11px', border: '1.5px solid',
                    borderColor: i < currentStep ? 'var(--greenbd)' : i === currentStep ? 'var(--accent)' : 'var(--border2)',
                    background: i < currentStep ? 'var(--greenbg)' : 'transparent',
                    color: i < currentStep ? 'var(--green)' : i === currentStep ? 'var(--accent)' : 'var(--text3)',
                  }}>
                    {i < currentStep ? '✓' : i + 1}
                  </div>
                  <span style={{ textDecoration: i < currentStep ? 'none' : 'none' }}>
                    {step.label}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          ))}
        </div>
      </motion.div>
    </div>
  )
}