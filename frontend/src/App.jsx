import { useState } from 'react'
import Home   from './pages/home.jsx'
import Result from './pages/Result.jsx'
import Loader from './components/Loader.jsx'
import AuthPage from './pages/AuthPage.jsx'
import { optimizeResume } from './services/api.js'
import { useAuth } from './context/AuthContext.jsx'

/**
 * Global app state:
 *   step:         'upload' | 'loading' | 'results'
 *   resumeText:   string  (extracted or pasted)
 *   jobDesc:      string
 *   results:      OptimizeResponse | null
 *   error:        string | null
 */

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
    return <AuthPage />
  }

  return (
    <div className="min-h-screen bg-[var(--bg-page)]">
      {step === 'upload'  && <Home   onOptimize={handleOptimize} error={error} />}
      {step === 'loading' && <Loader />}
      {step === 'results' && <Result results={results} onReset={handleReset} resumeText={resumeText} />}
    </div>
  )
}