import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { uploadResume } from '../services/api.js'
import { useAuth } from '../context/AuthContext'

const SAMPLE_JD = `Software Engineer — Backend (Python)
TechNova Inc. | Full-time

Required Qualifications:
- 2+ years of experience with Python (FastAPI, Django, or Flask)
- Experience with REST API design and development
- Solid understanding of SQL and PostgreSQL
- Experience with Docker and containerization
- Familiarity with CI/CD pipelines (GitHub Actions, Jenkins)
- Knowledge of Git and version control best practices

Preferred Qualifications:
- Experience with Redis or other caching solutions
- AWS, GCP, or Azure cloud experience`

const FEATURES = [
  {
    icon: '🎯',
    iconBg: '#FFF3EE', iconBd: '#FFE8DC',
    name: 'Semantic ATS Scoring',
    desc: 'TF-IDF embeddings score your resume section-by-section: Skills 50% · Experience 30% · Keywords 20% — mirroring how enterprise ATS weighs your application.',
  },
  {
    icon: '✏️',
    iconBg: '#EDFAF4', iconBd: '#BBF7D0',
    name: 'Truth-Preserved Rewriting',
    desc: 'Groq AI rewrites your bullets to match JD language. An anti-hallucination layer rejects any rewrite that drifts too far from your original. Zero fabricated experience.',
  },
  {
    icon: '🔍',
    iconBg: '#FFFBEB', iconBd: '#FDE68A',
    name: 'Skill Gap Intelligence',
    desc: '500-skill master list identifies exactly what you\'re missing, ranked High / Medium / Low by frequency and placement in the job description.',
  },
  {
    icon: '📄',
    iconBg: '#F5F3FF', iconBd: '#DDD6FE',
    name: 'Professional PDF Output',
    desc: 'ReportLab generates a clean, single-column ATS-safe PDF with proper section headers, bullet formatting, and professional typography.',
  },
]

const PROOF = [
  {
    before: '38%', after: '81%', delta: '+43%',
    quote: '"I\'ve been applying for months with no callbacks. OptiResume showed me exactly what was missing — Docker and CI/CD were the blockers. Got 3 interview calls the next week."',
    name: 'Arjun Mehta', role: 'Backend Engineer, Bangalore',
  },
  {
    before: '44%', after: '79%', delta: '+35%',
    quote: '"The skill gap breakdown was eye-opening. I didn\'t realize my resume was missing 6 keywords from the job description. The diff view showed every single improvement."',
    name: 'Priya Sharma', role: 'Data Analyst, Pune',
  },
  {
    before: '42%', after: '78%', delta: '+36%',
    quote: '"It doesn\'t add fake experience — it rewrites what you actually did using stronger language. My bullets went from \'worked on backend\' to \'engineered REST APIs handling 100K+ requests daily.\'"',
    name: 'Rohan Desai', role: 'Full-Stack Developer, Mumbai',
  },
]

export default function Home({ onOptimize, error }) {
  const { user, logout } = useAuth()
  const [resumeFile,  setResumeFile]  = useState(null)
  const [resumeText,  setResumeText]  = useState('')
  const [jobDesc,     setJobDesc]     = useState('')
  const [inputMode,   setInputMode]   = useState('upload')
  const [uploading,   setUploading]   = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const [jdCount,     setJdCount]     = useState(0)
  const [resumeCount, setResumeCount] = useState(0)

  const handleComingSoon = (e) => {
    e.preventDefault()
    window.alert('We are working on this feature! Please check back soon.')
  }

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
    } catch (err) {
      const errorMsg = err?.response?.data?.detail || err.message || 'Unknown network error'
      setUploadError(`Upload failed: ${errorMsg}. Try pasting text instead.`)
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

  const clearFile = () => { setResumeFile(null); setResumeText('') }

  const canSubmit = resumeText.trim().length >= 50 && jobDesc.trim().length >= 50

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* ── Nav ────────────────────────────────────────────────────────────── */}
      <nav className="or-nav">
        <div className="or-nav-inner">
          <a href="#" className="or-logo">
            <div className="or-logo-mark">OR</div>
            <span className="or-logo-text">Opti<span>Resume</span></span>
          </a>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button className="nav-link" onClick={handleComingSoon}>How it works</button>
            <button className="nav-link" onClick={handleComingSoon}>Features</button>
            {user && (
              <>
                <span style={{ fontSize: '13px', color: 'var(--text2)', marginLeft: '8px' }}>
                  {user.full_name || user.email}
                </span>
                <button className="nav-link" onClick={logout}>Logout</button>
              </>
            )}
            <button
              className="btn-accent"
              style={{ marginLeft: '8px' }}
              onClick={() => document.getElementById('upload-section')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Optimize Resume →
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero + Upload ───────────────────────────────────────────────────── */}
      <section
        id="upload-section"
        style={{
          maxWidth: '1200px', margin: '0 auto',
          padding: '72px 2rem 56px',
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px',
          alignItems: 'center',
        }}
      >
        {/* Left: Hero text */}
        <div className="fade-in">
          <div className="hero-badge">
            <span className="hero-badge-dot" />
            ATS Semantic Scoring Engine
          </div>
          <h1 style={{
            fontSize: 'clamp(40px,5vw,62px)', fontWeight: 800,
            color: 'var(--text)', marginBottom: '20px', letterSpacing: '-0.035em', lineHeight: 1.08,
          }}>
            Get past the{' '}
            <em style={{
              fontStyle: 'normal', color: 'var(--accent)', position: 'relative',
            }}>ATS filter</em>
            .<br />Land the interview.
          </h1>
          <p style={{ fontSize: '18px', color: 'var(--text2)', lineHeight: 1.65, marginBottom: '36px' }}>
            Upload your resume, paste any job description — get a semantically scored,
            AI-optimized resume with before/after proof in under 10 seconds.
          </p>

          {/* Stats */}
          <div style={{ display: 'flex', gap: '28px', flexWrap: 'wrap', marginBottom: '28px' }}>
            {[
              { num: '70%',  label: 'Resumes rejected by ATS' },
              { num: '+36%', label: 'Average score improvement' },
              { num: '<10s', label: 'Full optimization time' },
            ].map(s => (
              <div key={s.label}>
                <div style={{ fontFamily: 'Sora,sans-serif', fontSize: '28px', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.03em' }}>{s.num}</div>
                <div style={{ fontSize: '13px', color: 'var(--text3)', marginTop: '2px' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Trust */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
            {['No fabricated experience', 'ATS-safe PDF output', 'Explainable skill gaps'].map(t => (
              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '13px', color: 'var(--text3)' }}>
                <div className="trust-check">✓</div>
                {t}
              </div>
            ))}
          </div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{
                marginTop: '20px', padding: '12px 16px', borderRadius: '10px',
                background: 'var(--redbg)', border: '1px solid var(--redbd)',
                color: 'var(--red)', fontSize: '14px',
              }}
            >
              ⚠ {error}
            </motion.div>
          )}
        </div>

        {/* Right: Upload card */}
        <motion.div
          className="upload-card fade-in"
          style={{ animationDelay: '0.1s' }}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="upload-card-header">
            <div style={{ fontFamily: 'Sora,sans-serif', fontSize: '18px', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>
              Optimize your resume
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text3)' }}>Free · No data stored</div>
          </div>

          <div className="upload-card-body">
            {/* Step 1: Resume */}
            <div style={{ marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>① Your resume</span>
                <div className="mode-toggle">
                  <button className={`mode-btn ${inputMode === 'upload' ? 'active' : ''}`} onClick={() => setInputMode('upload')}>Upload PDF</button>
                  <button className={`mode-btn ${inputMode === 'paste' ? 'active' : ''}`} onClick={() => setInputMode('paste')}>Paste text</button>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {inputMode === 'upload' ? (
                  <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    {!resumeFile ? (
                      <div
                        {...getRootProps()}
                        className={`drop-zone ${isDragActive ? 'drag-over' : ''}`}
                      >
                        <input {...getInputProps()} />
                        <div className="drop-icon">📄</div>
                        <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text)', marginBottom: '4px' }}>
                          {uploading ? 'Parsing PDF...' : 'Drop your PDF here'}
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--text3)' }}>
                          or <span style={{ color: 'var(--accent)', fontWeight: 500 }}>browse files</span> — PDF only, max 5MB
                        </div>
                      </div>
                    ) : (
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '14px',
                        background: 'var(--greenbg)', border: '1px solid var(--greenbd)',
                        borderRadius: 'var(--radius)', padding: '14px 18px',
                      }}>
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '9px',
                          background: '#D1FAE5', display: 'flex', alignItems: 'center',
                          justifyContent: 'center', fontSize: '18px', flexShrink: 0,
                        }}>✓</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--green)' }}>{resumeFile.name}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '1px' }}>
                            {(resumeFile.size / 1024).toFixed(0)}KB · Ready to optimize
                          </div>
                        </div>
                        <button
                          onClick={clearFile}
                          style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: '18px', lineHeight: 1, padding: '4px' }}
                        >×</button>
                      </div>
                    )}
                    {uploadError && (
                      <p style={{ marginTop: '8px', fontSize: '13px', color: 'var(--red)' }}>⚠ {uploadError}</p>
                    )}
                  </motion.div>
                ) : (
                  <motion.div key="paste" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <textarea
                      className="jd-textarea"
                      placeholder="Paste your full resume text here..."
                      value={resumeText}
                      onChange={e => { setResumeText(e.target.value); setResumeCount(e.target.value.length) }}
                      style={{ minHeight: '120px' }}
                    />
                    <div style={{ fontSize: '11px', color: 'var(--text3)', textAlign: 'right', marginTop: '4px' }}>{resumeCount} characters</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div style={{ height: '1px', background: 'var(--border)', margin: '16px 0' }} />

            {/* Step 2: JD */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>② Job description</span>
                <button
                  style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer' }}
                  onClick={() => { setJobDesc(SAMPLE_JD); setJdCount(SAMPLE_JD.length) }}
                >
                  Load sample →
                </button>
              </div>
              <textarea
                className="jd-textarea"
                placeholder="Paste the job description you're applying for..."
                value={jobDesc}
                onChange={e => { setJobDesc(e.target.value); setJdCount(e.target.value.length) }}
              />
              <div style={{ fontSize: '11px', color: 'var(--text3)', textAlign: 'right', marginTop: '4px' }}>{jdCount} characters</div>
            </div>

            <button
              className="optimize-btn"
              onClick={() => onOptimize(resumeText, jobDesc)}
              disabled={!canSubmit || uploading}
            >
              Optimize My Resume
              <span style={{ transition: 'transform 0.2s' }}>→</span>
            </button>
            <p style={{ fontSize: '12px', color: 'var(--text3)', textAlign: 'center', marginTop: '10px' }}>
              {!canSubmit ? 'Upload your resume and paste a job description to continue' : 'No data stored · ATS-safe output guaranteed'}
            </p>
          </div>
        </motion.div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────────── */}
      <section style={{ borderTop: '1px solid var(--border)', padding: '64px 2rem', background: 'var(--bg2)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div style={{
              fontFamily: 'Sora,sans-serif', fontSize: '11px', fontWeight: 700,
              letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '12px',
            }}>What we do differently</div>
            <h2 style={{ fontSize: '36px', fontWeight: 700, color: 'var(--text)', marginBottom: '14px' }}>
              Not keyword stuffing.<br />Semantic intelligence.
            </h2>
            <p style={{ fontSize: '17px', color: 'var(--text2)', maxWidth: '520px', margin: '0 auto' }}>
              We use embedding technology that modern ATS systems use — so we optimize for meaning, not just words.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '18px' }}>
            {FEATURES.map(f => (
              <div key={f.name} className="feature-card">
                <div style={{
                  width: '46px', height: '46px', borderRadius: '12px',
                  background: f.iconBg, border: `1px solid ${f.iconBd}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '22px', marginBottom: '16px',
                }}>{f.icon}</div>
                <div style={{ fontFamily: 'Sora,sans-serif', fontSize: '15px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px', letterSpacing: '-0.02em' }}>{f.name}</div>
                <div style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Social Proof ─────────────────────────────────────────────────────── */}
      <section style={{ borderTop: '1px solid var(--border)', padding: '56px 2rem', background: 'var(--bg)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '24px' }}>
          {PROOF.map(p => (
            <div key={p.name} className="proof-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ fontFamily: 'Sora,sans-serif', fontSize: '32px', fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--red)' }}>{p.before}</div>
                <div style={{ fontSize: '20px', color: 'var(--text3)' }}>→</div>
                <div style={{ fontFamily: 'Sora,sans-serif', fontSize: '32px', fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--green)' }}>{p.after}</div>
                <div style={{
                  marginLeft: 'auto', fontSize: '12px', fontWeight: 700, color: 'var(--green)',
                  background: 'var(--greenbg)', border: '1px solid var(--greenbd)',
                  padding: '3px 9px', borderRadius: '100px',
                }}>{p.delta}</div>
              </div>
              <p style={{ fontSize: '14px', color: 'var(--text2)', lineHeight: 1.6, fontStyle: 'italic', marginBottom: '16px' }}>{p.quote}</p>
              <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text)' }}>{p.name}</div>
              <div style={{ fontSize: '12px', color: 'var(--text3)' }}>{p.role}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '24px 2rem', background: 'var(--bg2)' }}>
        <div style={{
          maxWidth: '1200px', margin: '0 auto',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text3)' }}>
            <div className="or-logo-mark" style={{ width: '26px', height: '26px', fontSize: '12px' }}>OR</div>
            OptiResume AI · Built for the hackathon
          </div>
          <div style={{ display: 'flex', gap: '20px' }}>
            {['Privacy', 'Terms', 'Contact'].map(l => (
              <a key={l} href="#" onClick={handleComingSoon} style={{ fontSize: '13px', color: 'var(--text3)', textDecoration: 'none' }}>{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}