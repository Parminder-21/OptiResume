import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import ThemeToggle from '../components/ThemeToggle'
import ScoreCard  from '../components/ScoreCard.jsx'
import SkillGap   from '../components/SkillGap.jsx'
import ResumeDiff from '../components/ResumeDiff.jsx'
import { downloadPDF } from '../services/api.js'
import { countChanges } from '../utils/helpers.js'

export default function Result({ results, onReset, resumeText }) {
  const { user, logout } = useAuth()
  const [downloading, setDownloading] = useState(false)
  const [downloadErr, setDownloadErr] = useState(null)
  const [activeTab,   setActiveTab]   = useState('overview') // 'overview' | 'diff' | 'resume'

  const { scores, skill_gaps, diff, optimized_resume } = results

  const improvement  = Math.round(scores.optimized.overall - scores.initial.overall)
  const changedCount = countChanges(diff)

  const handleDownload = async () => {
    setDownloading(true)
    setDownloadErr(null)
    try {
      await downloadPDF(optimized_resume)
    } catch (err) {
      setDownloadErr('Download failed. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-green-500/10 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-brand-500/10 rounded-full blur-3xl opacity-50" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* ── Nav ────────────────────────────────────────────────────────── */}
        <nav className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-pri)] sticky top-0 bg-[var(--bg-glass)] backdrop-blur-md z-20">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-gradient-to-br from-brand-500 to-purple-500 rounded-lg flex items-center justify-center text-sm">
              ⚡
            </div>
            <span className="font-bold text-[var(--text-pri)] tracking-tight">OptiResume <span className="text-brand-400">AI</span></span>
          </div>

          <div className="flex items-center gap-6">
            <ThemeToggle />
            <div className="flex items-center gap-3">
              <motion.button
                onClick={handleDownload}
                disabled={downloading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="btn-primary flex items-center gap-2 py-2 px-5 text-sm"
              >
                {downloading
                  ? <><span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Generating PDF...</>
                  : <><span>⬇</span> Download Resume</>
                }
              </motion.button>
              <button onClick={onReset} className="btn-secondary py-2 px-4 text-sm">
                ← Optimize Another
              </button>
            </div>

            {user && (
              <div className="flex items-center gap-3 pl-6 border-l border-[var(--border-pri)]">
                <div className="flex flex-col items-end">
                  <span className="text-[11px] font-semibold text-[var(--text-pri)]">{user.full_name || user.email}</span>
                  <button 
                    onClick={logout}
                    className="text-[9px] text-slate-500 hover:text-brand-400 uppercase tracking-widest font-bold transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </nav>

        <div className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-6 py-8">

          {/* ── Win banner ──────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-5 bg-gradient-to-r from-green-500/10 to-brand-500/10 border border-green-500/20 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center text-2xl flex-shrink-0">
                🎯
              </div>
              <div>
                <h2 className="text-lg font-bold text-[var(--text-pri)]">
                  ATS Score improved by{' '}
                  <span className="text-green-500 font-black">+{improvement}%</span>
                </h2>
                <p className="text-[var(--text-sec)] text-sm mt-0.5">
                  {changedCount} bullet{changedCount !== 1 ? 's' : ''} rewritten ·{' '}
                  {skill_gaps.length} skill gap{skill_gaps.length !== 1 ? 's' : ''} identified ·{' '}
                  <span className="text-green-400">{Math.round(scores.optimized.overall)}% overall match</span>
                </p>
              </div>
            </div>

            {/* Quick stats */}
            <div className="flex gap-4 flex-shrink-0">
              <div className="text-center">
                <p className="text-2xl font-bold text-[var(--text-sec)]">{Math.round(scores.initial.overall)}%</p>
                <p className="text-xs text-[var(--text-sec)]">Before</p>
              </div>
              <div className="flex items-center text-green-500 font-bold text-xl">→</div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-500">{Math.round(scores.optimized.overall)}%</p>
                <p className="text-xs text-[var(--text-sec)]">After</p>
              </div>
            </div>
          </motion.div>

          {/* ── Tab navigation ─────────────────────────────────────────── */}
          <div className="flex gap-2 mb-6 border-b border-white/10 pb-0">
            {[
              { id: 'overview', label: '📊 Score Overview'  },
              { id: 'diff',     label: `✏️ Improvements (${changedCount})` },
              { id: 'resume',   label: '📄 Full Resume'     },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all border-b-2 -mb-px ${
                  activeTab === tab.id
                    ? 'text-[var(--text-pri)] border-brand-500 bg-brand-500/10'
                    : 'text-[var(--text-sec)] border-transparent hover:text-[var(--text-pri)] hover:bg-[var(--bg-glass)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── Overview Tab ───────────────────────────────────────────── */}
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid md:grid-cols-2 gap-6"
            >
              <ScoreCard initial={scores.initial} optimized={scores.optimized} />
              <SkillGap  skillGaps={skill_gaps} />
            </motion.div>
          )}

          {/* ── Diff Tab ────────────────────────────────────────────────── */}
          {activeTab === 'diff' && (
            <motion.div
              key="diff"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <ResumeDiff diff={diff} />
            </motion.div>
          )}

          {/* ── Resume Tab ────────────────────────────────────────────── */}
          {activeTab === 'resume' && (
            <motion.div
              key="resume"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid md:grid-cols-2 gap-6"
            >
              {/* Original */}
              <div className="glass-card p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="section-title mb-0">Original Resume</p>
                  <span className="text-xs text-[var(--text-sec)]">{resumeText?.length || 0} chars</span>
                </div>
                <pre className="text-xs text-[var(--text-sec)] leading-relaxed whitespace-pre-wrap font-mono overflow-y-auto max-h-[600px] pr-2">
                  {resumeText || 'No original text available.'}
                </pre>
              </div>

              {/* Optimized */}
              <div className="glass-card p-5 border-green-500/20">
                <div className="flex items-center justify-between mb-3">
                  <p className="section-title mb-0 text-green-500 font-bold">Optimized Resume</p>
                  <span className="text-xs text-[var(--text-sec)]">{optimized_resume?.length || 0} chars</span>
                </div>
                <pre className="text-xs text-[var(--text-pri)] leading-relaxed whitespace-pre-wrap font-mono overflow-y-auto max-h-[600px] pr-2">
                  {optimized_resume || 'No optimized text available.'}
                </pre>
              </div>
            </motion.div>
          )}

          {/* Download error */}
          {downloadErr && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 text-center text-red-400 text-sm"
            >
              ⚠ {downloadErr}
            </motion.p>
          )}

          {/* Bottom CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-10 text-center"
          >
            <motion.button
              onClick={handleDownload}
              disabled={downloading}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-3 px-10 py-4 bg-gradient-to-r from-brand-500 to-purple-500 text-white font-semibold rounded-2xl shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 transition-shadow text-base"
            >
              {downloading
                ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Generating...</>
                : <><span>⬇</span> Download Optimized Resume (PDF)</>
              }
            </motion.button>
            <p className="text-xs text-slate-600 mt-3">
              ATS-safe formatting · Single column · Standard fonts
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}