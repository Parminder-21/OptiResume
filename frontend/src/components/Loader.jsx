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

    // Smooth progress bar — runs independently
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 0.4, 95))
    }, 80)

    return () => clearInterval(progressInterval)
  }, [])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      {/* Animated background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1.5s' }} />
      </div>

      <div className="relative z-10 w-full max-w-md text-center">
        {/* Spinning logo */}
        <div className="relative mx-auto mb-10 w-24 h-24">
          <div className="absolute inset-0 rounded-full border-2 border-brand-500/30 animate-spin" style={{ animationDuration: '3s' }} />
          <div className="absolute inset-2 rounded-full border-2 border-t-brand-500 border-r-transparent border-b-transparent border-l-transparent animate-spin" style={{ animationDuration: '1.2s' }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl">⚡</span>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-[var(--text-pri)] mb-2">Optimizing Your Resume</h2>
        <p className="text-[var(--text-sec)] mb-10 text-sm">AI is analyzing and rewriting for maximum ATS impact</p>

        {/* Progress bar */}
        <div className="score-bar-track mb-3">
          <motion.div
            className="h-full bg-gradient-to-r from-brand-500 to-purple-500 rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>
        <p className="text-right text-xs text-[var(--text-sec)] mb-8">{Math.round(progress)}%</p>

        {/* Step messages */}
        <div className="glass-card p-4 text-left space-y-2">
          {PROCESSING_STEPS.map((step, i) => (
            <AnimatePresence key={i}>
              {i <= currentStep && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 text-sm"
                >
                  {i < currentStep ? (
                    <span className="text-green-500 text-base">✓</span>
                  ) : (
                    <span className="w-4 h-4 border-2 border-brand-400 border-t-transparent rounded-full animate-spin inline-block flex-shrink-0" />
                  )}
                  <span className={i < currentStep ? 'text-[var(--text-sec)] line-through' : 'text-[var(--text-pri)]'}>
                    {step.label}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          ))}
        </div>
      </div>
    </div>
  )
}