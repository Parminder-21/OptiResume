import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Home     from './pages/home.jsx'
import Result   from './pages/Result.jsx'
import Loader   from './components/Loader.jsx'
import ChatStep from './components/ChatStep.jsx'
import AuthPage from './pages/AuthPage.jsx'
import { getChatQuestions, optimizeResume } from './services/api.js'
import { useAuth } from './context/AuthContext.jsx'

const fade = {
  initial: { opacity: 0 },
  enter:   { opacity: 1, transition: { duration: 0.3 } },
  exit:    { opacity: 0, transition: { duration: 0.2 } },
}

export default function App() {
  const { user } = useAuth()

  const [step,        setStep]        = useState('upload')  // upload | chat | loading | results
  const [resumeText,  setResumeText]  = useState('')
  const [jobDesc,     setJobDesc]     = useState('')
  const [questions,   setQuestions]   = useState([])
  const [chatLoading, setChatLoading] = useState(false)
  const [results,     setResults]     = useState(null)
  const [error,       setError]       = useState(null)

  // ── Called from Home when user clicks "Optimize My Resume" ─────────────────
  const handleOptimize = async (text, jd) => {
    setResumeText(text)
    setJobDesc(jd)
    setError(null)

    // Move to chat step and start fetching questions in parallel
    setStep('chat')
    setChatLoading(true)
    setQuestions([])

    try {
      const data = await getChatQuestions(text, jd)
      setQuestions(data.questions || [])
    } catch (err) {
      console.warn('Chat questions failed, will skip:', err)
      setQuestions([])
    } finally {
      setChatLoading(false)
    }
  }

  // ── Called from ChatStep when user clicks "Optimize" (with or without answers)
  const handleChatContinue = async (userContext) => {
    setStep('loading')
    try {
      const data = await optimizeResume(resumeText, jobDesc, userContext || null)
      setResults(data)
      setStep('results')
    } catch (err) {
      const msg = err?.response?.data?.detail || 'Something went wrong. Please try again.'
      setError(msg)
      setStep('upload')
    }
  }

  // ── Skip chatbot entirely ────────────────────────────────────────────────────
  const handleChatSkip = () => handleChatContinue(null)

  const handleReset = () => {
    setStep('upload')
    setResults(null)
    setError(null)
    setResumeText('')
    setJobDesc('')
    setQuestions([])
  }

  // ── Auth gate ────────────────────────────────────────────────────────────────
  if (!user) {
    return (
      <AnimatePresence mode="wait">
        <motion.div key="auth" variants={fade} initial="initial" animate="enter" exit="exit">
          <AuthPage />
        </motion.div>
      </AnimatePresence>
    )
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      {step === 'upload' && (
        <motion.div key="home" variants={fade} initial="initial" animate="enter" exit="exit">
          <Home onOptimize={handleOptimize} error={error} />
        </motion.div>
      )}

      {step === 'chat' && (
        <motion.div key="chat" variants={fade} initial="initial" animate="enter" exit="exit">
          <ChatStep
            questions={questions}
            loading={chatLoading}
            onContinue={handleChatContinue}
            onSkip={handleChatSkip}
          />
        </motion.div>
      )}

      {step === 'loading' && (
        <motion.div key="loading" variants={fade} initial="initial" animate="enter" exit="exit">
          <Loader />
        </motion.div>
      )}

      {step === 'results' && (
        <motion.div key="results" variants={fade} initial="initial" animate="enter" exit="exit">
          <Result results={results} onReset={handleReset} resumeText={resumeText} />
        </motion.div>
      )}
    </AnimatePresence>
  )
}