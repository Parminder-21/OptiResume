import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Home   from './pages/home.jsx'
import Result from './pages/Result.jsx'
import Loader from './components/Loader.jsx'
import AuthPage from './pages/AuthPage.jsx'
import { optimizeResume } from './services/api.js'
import { useAuth } from './context/AuthContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import CustomCursor from './components/CustomCursor.jsx'

export default function App() {
  const { user } = useAuth()
  const [step,       setStep]       = useState('upload')
  const [resumeText, setResumeText] = useState('')
  const [jobDesc,    setJobDesc]    = useState('')
  const [results,    setResults]    = useState(null)
  const [error,      setError]      = useState(null)

  const handleOptimize = async (text, jd) => {
    setResumeText(text)
    setJobDesc(jd)
    setError(null)
    setStep('loading')

    try {
      const data = await optimizeResume(text, jd)
      setResults(data)
      setStep('results')
    } catch (err) {
      const msg = err?.response?.data?.detail || 'Something went wrong. Please try again.'
      setError(msg)
      setStep('upload')
    }
  }

  const handleReset = () => {
    setStep('upload')
    setResults(null)
    setError(null)
    setResumeText('')
    setJobDesc('')
  }

  if (!user) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
           key="auth"
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           exit={{ opacity: 0 }}
        >
          <AuthPage />
        </motion.div>
      </AnimatePresence>
    )
  }

  const pageVariants = {
    initial: { opacity: 0, scale: 0.98 },
    enter: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: "easeOut" } },
    exit: { opacity: 0, scale: 1.02, transition: { duration: 0.4, ease: "easeIn" } }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-page)]">
      <CustomCursor />
      <AnimatePresence mode="wait" initial={false}>
        {step === 'upload' && (
          <motion.div key="home" variants={pageVariants} initial="initial" animate="enter" exit="exit">
            <Home onOptimize={handleOptimize} error={error} />
          </motion.div>
        )}
        
        {step === 'loading' && (
          <motion.div key="loading" variants={pageVariants} initial="initial" animate="enter" exit="exit">
            <Loader />
          </motion.div>
        )}
        
        {step === 'results' && (
          <motion.div key="results" variants={pageVariants} initial="initial" animate="enter" exit="exit">
            <Result results={results} onReset={handleReset} resumeText={resumeText} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}