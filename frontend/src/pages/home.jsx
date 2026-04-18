import { useState, useCallback, useEffect, useRef } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion'
import { uploadResume } from '../services/api.js'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import ThemeToggle from '../components/ThemeToggle'
import HeroCanvas from '../components/HeroCanvas'
import BentoGallery from '../components/BentoGallery'
import InteractiveTimeline from '../components/InteractiveTimeline'
import Footer from '../components/Footer'
import { CloudUpload, Github, FileText, ChevronRight, Sparkles, ChevronDown, CheckCircle, ArrowRight } from 'lucide-react'

const SAMPLE_RESUME = `JOHN SMITH\njohn.smith@email.com | (555) 123-4567\n\nEXPERIENCE\nSoftware Engineer - TechCorp (2020-2023)\n- Developed REST APIs using Python and FastAPI\n- Optimized database queries reducing latency by 40%`

const SAMPLE_JD = `We are looking for a Software Engineer to join our backend team.\nRequirements:\n- 2+ years of experience with Python\n- Experience with REST API development (FastAPI)`

export default function Home({ onOptimize, error }) {
  const { user, logout } = useAuth()
  const [resumeFile,  setResumeFile]  = useState(null)
  const [resumeText,  setResumeText]  = useState('')
  const [jobDesc,     setJobDesc]     = useState('')
  const [inputMode,   setInputMode]   = useState('upload') 
  const [uploading,   setUploading]   = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const [charCount,   setCharCount]   = useState(0)
  const [isScrolled,  setIsScrolled]  = useState(false)

  const optimizerRef = useRef(null)
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToOptimizer = () => {
    optimizerRef.current?.scrollIntoView({ behavior: 'smooth' })
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
      setCharCount(data.char_count)
    } catch (err) {
      setUploadError('Failed to parse PDF. Try pasting text instead.')
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

  const canSubmit = resumeText.trim().length >= 50 && jobDesc.trim().length >= 50

  return (
    <div className="min-h-screen bg-bg-page overflow-x-hidden">
      {/* Scroll Progress Bar */}
      <motion.div className="fixed top-0 left-0 right-0 h-1 bg-brand-pri z-[100] origin-left" style={{ scaleX }} />

      {/* Hero 3D Background */}
      <HeroCanvas />

      {/* Sticky Premium Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-bg-page/80 backdrop-blur-lg border-b border-white/5 py-4' : 'bg-transparent py-6'}`}>
        <nav className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5 group cursor-pointer">
            <div className="w-10 h-10 bg-gradient-to-br from-brand-pri to-brand-sec rounded-xl flex items-center justify-center text-lg shadow-lg shadow-brand-pri/20 group-hover:scale-110 transition-transform">
              ⚡
            </div>
            <span className="font-black text-white text-xl tracking-tighter uppercase italic">OptiResume</span>
          </div>
          
          <div className="flex items-center gap-8">
            <div className="hidden md:flex items-center gap-6 text-xs font-bold uppercase tracking-widest text-slate-400">
              <a href="#" className="hover:text-brand-400 transition-colors">Analyzer</a>
              <a href="#" className="hover:text-brand-400 transition-colors">Optimizer</a>
              <a href="#" className="hover:text-brand-400 transition-colors">Security</a>
            </div>
            <div className="h-6 w-px bg-white/10 mx-2" />
            <ThemeToggle />
            {user && (
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex flex-col items-end">
                   <span className="text-xs font-bold text-white tracking-tight">{user.full_name || user.email}</span>
                   <button onClick={logout} className="text-[10px] text-brand-400 uppercase font-black tracking-widest hover:text-brand-300">Logout</button>
                </div>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-pri/20 to-brand-sec/20 border border-white/10 flex items-center justify-center font-bold text-brand-400">
                  {user.email.charAt(0).toUpperCase()}
                </div>
              </div>
            )}
          </div>
        </nav>
      </header>

      {/* ── Main Layout ────────────────────────────────────────────────────────── */}
      <main className="relative z-10 pt-32">
        
        {/* HERO SECTION */}
        <section className="min-h-[80vh] flex flex-col items-center justify-center text-center px-6 relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
          >
            <span className="label-premium flex items-center gap-2">
              <Sparkles size={12} className="text-brand-400" />
              Next-Gen Recruitment Intelligence
            </span>
            <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter leading-[0.9] mb-8">
              BEAT THE <br />
              <span className="text-gradient">GATEKEEPERS.</span>
            </h1>
            <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-12">
              Don't leave your career to chance. Our AI-driven ATS simulator analyzes, weights, and rewrites your resume for maximum semantic visibility.
            </p>
            
            <div className="flex flex-col md:flex-row items-center justify-center gap-6">
              <button 
                onClick={scrollToOptimizer}
                className="btn-premium group"
              >
                Scan My Resume 
                <ChevronRight className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="flex items-center gap-2 text-sm font-bold text-white hover:text-brand-400 transition-colors">
                <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center">
                  ▶
                </div>
                Watch Demo
              </button>
            </div>
          </motion.div>

          <motion.div 
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 text-slate-600 cursor-pointer"
            onClick={scrollToOptimizer}
          >
            <ChevronDown size={32} />
          </motion.div>
        </section>

        {/* FEATURE GALLERY */}
        <BentoGallery />

        {/* TIMELINE */}
        <InteractiveTimeline />

        {/* THE OPTIMIZER (Core Functionality) */}
        <section ref={optimizerRef} className="py-24 px-6 bg-slate-950">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
               <span className="label-premium">The Optimizer</span>
               <h2 className="text-4xl font-bold mt-4">Start Your <span className="text-gradient">Transformation</span></h2>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="glass-card overflow-hidden"
            >
              <div className="grid md:grid-cols-2">
                
                {/* ── Left Side: Uploader ── */}
                <div className="p-8 md:p-12 border-b md:border-b-0 md:border-r border-white/5 space-y-8">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold flex items-center gap-3 text-white">
                      <div className="w-8 h-8 rounded-lg bg-brand-pri/20 flex items-center justify-center text-xs text-brand-pri">01</div>
                      Resume Assets
                    </h3>
                    <button 
                      onClick={() => setInputMode(prev => prev === 'upload' ? 'paste' : 'upload')}
                      className="text-xs font-bold text-brand-pri hover:underline"
                    >
                      {inputMode === 'upload' ? 'Paste Text' : 'Upload PDF'}
                    </button>
                  </div>

                  <AnimatePresence mode="wait">
                    {inputMode === 'upload' ? (
                      <motion.div
                        key="u"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        {...getRootProps()}
                        className={`border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all ${
                          isDragActive ? 'border-brand-pri bg-brand-pri/5' : 'border-white/10 hover:border-white/20'
                        }`}
                      >
                        <input {...getInputProps()} />
                        <CloudUpload size={48} className="mx-auto mb-4 text-slate-700" />
                        <p className="text-sm text-slate-400">
                          {resumeFile ? <span className="text-brand-pri font-bold">✓ {resumeFile.name}</span> : "Drop your PDF or click to browse"}
                        </p>
                      </motion.div>
                    ) : (
                      <motion.textarea
                        key="p"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        value={resumeText}
                        onChange={e => setResumeText(e.target.value)}
                        className="input-premium h-48 resize-none font-mono text-xs"
                        placeholder="Paste full resume text..."
                      />
                    )}
                  </AnimatePresence>
                  
                  {uploadError && <p className="text-xs text-red-400 font-bold">{uploadError}</p>}
                </div>

                {/* ── Right Side: Job Desc ── */}
                <div className="p-8 md:p-12 space-y-8">
                  <h3 className="text-lg font-bold flex items-center gap-3 text-white">
                    <div className="w-8 h-8 rounded-lg bg-pink-500/20 flex items-center justify-center text-xs text-pink-500">02</div>
                    Target Role
                  </h3>
                  <textarea
                    value={jobDesc}
                    onChange={e => setJobDesc(e.target.value)}
                    className="input-premium h-48 resize-none text-sm"
                    placeholder="Paste the target job description here..."
                  />
                  
                  <div className="pt-4">
                     <button
                        onClick={() => onOptimize(resumeText, jobDesc)}
                        disabled={!canSubmit || uploading}
                        className="btn-premium w-full flex items-center justify-center gap-3 group"
                     >
                        {uploading ? "Parsing..." : "Analyze & Optimize"}
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                     </button>
                     <p className="text-[10px] text-center text-slate-500 mt-4 uppercase tracking-tighter">
                        Min. 50 characters required for both fields
                     </p>
                  </div>
                </div>

              </div>
            </motion.div>
          </div>
        </section>

        {/* FOOTER */}
        <Footer />
      </main>

      {/* Floating Cursor/Circle Effect for Premium Feel */}
      <div className="hidden lg:block">
        <div className="cursor-dot md:w-3 md:h-3" />
      </div>
    </div>
  )
}