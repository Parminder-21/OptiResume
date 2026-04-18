import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { uploadResume } from '../services/api.js'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import ThemeToggle from '../components/ThemeToggle'

const SAMPLE_RESUME = `JOHN SMITH
john.smith@email.com | (555) 123-4567 | LinkedIn.com/in/johnsmith

EXPERIENCE
Software Engineer - TechCorp (2020-2023)
- Developed REST APIs using Python and FastAPI
- Optimized database queries reducing latency by 40%
- Implemented microservices architecture with Docker
- Managed CI/CD pipelines with GitHub Actions

Junior Developer - StartupXYZ (2018-2020)
- Built Python backend services
- Worked with PostgreSQL databases
- Collaborated with frontend team on API design

SKILLS
Python, FastAPI, REST APIs, Docker, Kubernetes, PostgreSQL, Redis, GitHub Actions, AWS

EDUCATION
BS Computer Science - University of California (2018)`

const SAMPLE_JD = `We are looking for a Software Engineer to join our backend team.

Requirements:
- 2+ years of experience with Python
- Experience with REST API development (FastAPI, Flask, or Django)
- Familiarity with SQL and PostgreSQL
- Experience with Docker and containerization
- Knowledge of CI/CD pipelines (GitHub Actions, Jenkins)
- Strong problem-solving skills and attention to detail

Nice to have:
- Experience with Redis or message queues (Kafka, RabbitMQ)
- Familiarity with Kubernetes
- AWS or GCP cloud experience`

export default function Home({ onOptimize, error }) {
  const { user, logout } = useAuth()
  const [resumeFile,  setResumeFile]  = useState(null)
  const [resumeText,  setResumeText]  = useState('')
  const [jobDesc,     setJobDesc]     = useState('')
  const [inputMode,   setInputMode]   = useState('upload') // 'upload' | 'paste'
  const [uploading,   setUploading]   = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const [charCount,   setCharCount]   = useState(0)

  // ── Dropzone ──────────────────────────────────────────────────────────────
  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0]
    if (!file) return

    setUploadError(null)
    setUploading(true)
    setResumeFile(file)

    try {
      const data = await uploadResume(file)
      setResumeText(data.resume_text)
      setCharCount(data.char_count)
    } catch (err) {
      const msg = err?.response?.data?.detail || 'Failed to parse PDF. Try pasting your resume text instead.'
      setUploadError(msg)
      setResumeFile(null)
    } finally {
      setUploading(false)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    disabled: uploading,
  })

  // ── Submit ────────────────────────────────────────────────────────────────
  const canSubmit = resumeText.trim().length >= 50 && jobDesc.trim().length >= 50
  const submitHint = !resumeText.trim() ? 'Upload or paste your resume (min 50 characters)' : 
                     !jobDesc.trim() ? 'Paste a job description (min 50 characters)' :
                     'Results in ~10 seconds · No data stored'

  const handleSubmit = () => {
    if (!canSubmit) return
    onOptimize(resumeText, jobDesc)
  }

  const handlePasteToggle = () => {
    setInputMode(prev => prev === 'upload' ? 'paste' : 'upload')
    setResumeFile(null)
    setResumeText('')
    setUploadError(null)
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-brand-500/8 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-purple-600/8 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-600/4 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Nav */}
        <nav className="flex items-center justify-between px-8 py-5 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-purple-500 rounded-lg flex items-center justify-center text-sm font-bold">
              ⚡
            </div>
            <span className="font-bold text-[var(--text-pri)] text-lg tracking-tight">OptiResume <span className="text-brand-400">AI</span></span>
          </div>
          <div className="flex items-center gap-6">
            <ThemeToggle />
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              AI Engine Ready
            </div>
            
            {user && (
              <div className="flex items-center gap-4 pl-6 border-l border-[var(--border-pri)]">
                <div className="flex flex-col items-end">
                  <span className="text-xs font-semibold text-[var(--text-pri)]">{user.full_name || user.email}</span>
                  <button 
                    onClick={logout}
                    className="text-[10px] text-slate-500 hover:text-brand-400 uppercase tracking-widest font-bold transition-colors"
                  >
                    Logout
                  </button>
                </div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center text-xs text-brand-400 font-bold">
                  {(user.full_name || user.email).charAt(0).toUpperCase()}
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* Hero */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12 max-w-2xl"
          >
            <div className="inline-flex items-center gap-2 bg-brand-500/10 border border-brand-500/20 rounded-full px-4 py-1.5 text-xs text-brand-400 font-medium mb-6">
              <span className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-pulse" />
              Real-time ATS Simulator &amp; Optimizer
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
              Beat the ATS.<br />
              <span className="bg-gradient-to-r from-brand-400 to-purple-400 bg-clip-text text-transparent">
                Land the interview.
              </span>
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed">
              Upload your resume, paste the job description — get a semantically scored, AI-optimized resume with measurable improvement in under 10 seconds.
            </p>
          </motion.div>

          {/* Stats strip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-8 mb-10 text-center"
          >
            {[
              { stat: '70%',  label: 'Resumes rejected by ATS'   },
              { stat: '250+', label: 'Applications per job'       },
              { stat: '45min',label: 'Saved per application'      },
            ].map(({ stat, label }) => (
              <div key={stat}>
                <p className="text-2xl font-bold text-brand-400">{stat}</p>
                <p className="text-xs text-slate-500 mt-0.5">{label}</p>
              </div>
            ))}
          </motion.div>

          {/* Main card */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="w-full max-w-4xl"
          >
            <div className="glass-card p-8">
              <div className="grid md:grid-cols-2 gap-6">

                {/* ── Left: Resume Input ─────────────────────────────────── */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-white flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md bg-brand-500/20 flex items-center justify-center text-xs">1</span>
                      Your Resume
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { setResumeText(SAMPLE_RESUME); setResumeFile(null); }}
                        className="text-xs text-slate-500 hover:text-brand-400 transition-colors"
                      >
                        Try demo →
                      </button>
                      <span className="text-white/20">|</span>
                      <button
                        onClick={handlePasteToggle}
                        className="text-xs text-brand-400 hover:text-brand-300 transition-colors underline underline-offset-2"
                      >
                        {inputMode === 'upload' ? 'Paste text instead →' : '← Upload PDF instead'}
                      </button>
                    </div>
                  </div>

                  <AnimatePresence mode="wait">
                    {inputMode === 'upload' ? (
                      <motion.div
                        key="upload"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex-1"
                      >
                        <div
                          {...getRootProps()}
                          className={`relative flex flex-col items-center justify-center min-h-[220px] rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer
                            ${isDragActive
                              ? 'border-brand-400 bg-brand-500/10'
                              : resumeFile
                                ? 'border-green-500/50 bg-green-500/5'
                                : 'border-white/15 hover:border-brand-500/50 hover:bg-white/3'
                            }`}
                        >
                          <input {...getInputProps()} />

                          {uploading ? (
                            <div className="flex flex-col items-center gap-3 text-center p-6">
                              <div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
                              <p className="text-sm text-slate-400">Parsing your resume...</p>
                            </div>
                          ) : resumeFile && resumeText ? (
                            <div className="flex flex-col items-center gap-3 text-center p-6">
                              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                                <span className="text-2xl">✅</span>
                              </div>
                              <div>
                                <p className="text-green-400 font-semibold text-sm">{resumeFile.name}</p>
                                <p className="text-slate-500 text-xs mt-1">{charCount.toLocaleString()} characters extracted</p>
                              </div>
                              <button
                                onClick={(e) => { e.stopPropagation(); setResumeFile(null); setResumeText('') }}
                                className="text-xs text-slate-500 hover:text-red-400 transition-colors"
                              >
                                Remove ✕
                              </button>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-3 text-center p-6">
                              <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-3xl border border-white/10">
                                📄
                              </div>
                              <div>
                                <p className="text-white font-medium text-sm">Drop your resume here</p>
                                <p className="text-slate-500 text-xs mt-1">or click to browse · PDF only · max 5MB</p>
                              </div>
                            </div>
                          )}
                        </div>

                        <AnimatePresence>
                          {uploadError && (
                            <motion.p
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0 }}
                              className="text-red-400 text-xs mt-2 flex items-start gap-1.5"
                            >
                              <span>⚠</span> {uploadError}
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="paste"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex-1"
                      >
                        <textarea
                          value={resumeText}
                          onChange={e => setResumeText(e.target.value)}
                          placeholder="Paste your full resume text here..."
                          rows={10}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-300 placeholder-slate-600 resize-none focus:outline-none focus:border-brand-500/50 transition-colors font-mono leading-relaxed"
                        />
                        {resumeText && (
                          <p className="text-xs text-slate-600 mt-1 text-right">{resumeText.length} characters</p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* ── Right: Job Description ────────────────────────────── */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-white flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md bg-purple-500/20 flex items-center justify-center text-xs">2</span>
                      Job Description
                    </label>
                    <button
                      onClick={() => setJobDesc(SAMPLE_JD)}
                      className="text-xs text-slate-500 hover:text-brand-400 transition-colors"
                    >
                      Load sample →
                    </button>
                  </div>

                  <textarea
                    value={jobDesc}
                    onChange={e => setJobDesc(e.target.value)}
                    placeholder="Paste the job description here..."
                    rows={10}
                    className="flex-1 w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-300 placeholder-slate-600 resize-none focus:outline-none focus:border-purple-500/50 transition-colors leading-relaxed"
                  />
                  {jobDesc && (
                    <p className="text-xs text-slate-600 mt-1 text-right">{jobDesc.length} characters</p>
                  )}
                </div>
              </div>

              {/* Global error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2 text-sm text-red-400"
                  >
                    <span>⚠</span> {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit */}
              <div className="mt-6 flex flex-col items-center gap-3">
                <motion.button
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  whileHover={canSubmit ? { scale: 1.02 } : {}}
                  whileTap={canSubmit ? { scale: 0.98 } : {}}
                  className={`w-full md:w-auto px-12 py-4 rounded-xl font-semibold text-base transition-all duration-200 flex items-center justify-center gap-3
                    ${canSubmit
                      ? 'bg-gradient-to-r from-brand-500 to-purple-500 text-white shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 cursor-pointer'
                      : 'bg-white/10 text-slate-500 cursor-not-allowed'
                    }`}
                >
                  <span>⚡</span>
                  Optimize My Resume
                  <span>→</span>
                </motion.button>

                {!canSubmit && (
                  <p className="text-xs text-slate-600">
                    {submitHint}
                  </p>
                )}
                {canSubmit && (
                  <p className="text-xs text-slate-500">{submitHint}</p>
                )}
              </div>
            </div>
          </motion.div>

          {/* Feature pills */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex flex-wrap justify-center gap-3 mt-8"
          >
            {[
              '🎯 Semantic ATS Scoring',
              '🤖 AI Bullet Rewriting',
              '📊 Skill Gap Detection',
              '📄 ATS-Safe PDF Export',
              '🔒 Truth-Preserved Output',
            ].map(feat => (
              <span key={feat} className="text-xs text-slate-500 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
                {feat}
              </span>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  )
}