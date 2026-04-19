import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import { useAuth } from '../context/AuthContext'
import { downloadPDF } from '../services/api.js'
import { countChanges } from '../utils/helpers.js'

// ── Sub-components ──────────────────────────────────────────────────────────

function ScoreSection({ scores }) {
  const bars = [
    { name: '🎯 Skills match',    before: scores.initial.keywords,   after: scores.optimized.keywords,   cls: 'green'  },
    { name: '💼 Experience match', before: scores.initial.experience, after: scores.optimized.experience, cls: 'amber'  },
    { name: '🔑 Keyword coverage', before: scores.initial.overall,    after: scores.optimized.overall,    cls: 'accent' },
  ]
  const [visible, setVisible] = useState(false)
  const ref = useRef()
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 300)
    return () => clearTimeout(t)
  }, [])

  const before = Math.round(scores.initial.overall)
  const after  = Math.round(scores.optimized.overall)
  const delta  = after - before

  return (
    <div className="or-card" style={{ padding: '28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px' }}>
        <div style={{ fontFamily: 'Sora,sans-serif', fontSize: '15px', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.01em' }}>
          ATS Score Analysis
        </div>
        <div style={{
          fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em',
          textTransform: 'uppercase', color: 'var(--accent)',
          background: 'var(--accentbg)', padding: '4px 10px', borderRadius: '6px',
        }}>Semantic Match</div>
      </div>

      {/* Before → After */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px', marginBottom: '28px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: '8px' }}>Before</div>
          <div style={{ fontFamily: 'Sora,sans-serif', fontSize: '56px', fontWeight: 800, letterSpacing: '-0.05em', lineHeight: 1, color: 'var(--red)' }}>{before}%</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
          <div style={{ fontSize: '24px', color: 'var(--text3)' }}>→</div>
          <div style={{
            fontSize: '12px', fontWeight: 700, color: '#fff',
            background: 'var(--green)', padding: '4px 10px', borderRadius: '100px',
          }}>+{delta}%</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: '8px' }}>After</div>
          <div style={{ fontFamily: 'Sora,sans-serif', fontSize: '56px', fontWeight: 800, letterSpacing: '-0.05em', lineHeight: 1, color: 'var(--green)' }}>{after}%</div>
        </div>
      </div>

      {/* Bars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {bars.map(b => (
          <div key={b.name}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)' }}>{b.name}</span>
              <span style={{ fontSize: '13px', color: 'var(--text3)' }}>
                {Math.round(b.before)}% → <strong style={{ color: 'var(--green)', fontWeight: 600 }}>{Math.round(b.after)}%</strong>
              </span>
            </div>
            <div className="score-bar-track">
              <div className={`score-bar-fill ${b.cls}`} style={{ width: visible ? `${Math.round(b.after)}%` : '0%' }} />
            </div>
          </div>
        ))}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)' }}>📄 Formatting</span>
            <span style={{ fontSize: '13px', color: 'var(--green)', fontWeight: 600 }}>ATS Safe ✓</span>
          </div>
          <div className="score-bar-track">
            <div className="score-bar-fill green" style={{ width: visible ? '100%' : '0%' }} />
          </div>
        </div>
      </div>
    </div>
  )
}

function SkillGapSection({ skillGaps }) {
  const high   = skillGaps.filter(s => s.importance === 'high'   || s.priority === 'high')
  const medium = skillGaps.filter(s => s.importance === 'medium' || s.priority === 'medium')
  const low    = skillGaps.filter(s => s.importance === 'low'    || s.priority === 'low')

  const priorityOf = (sg) => sg.importance || sg.priority || 'low'

  return (
    <div className="or-card" style={{ padding: '28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
        <div style={{ fontFamily: 'Sora,sans-serif', fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>Skill Gap Analysis</div>
        <div style={{ fontSize: '13px', color: 'var(--text3)' }}>{skillGaps.length} skills missing</div>
      </div>

      {/* Summary boxes */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '18px' }}>
        {[
          { count: high.length,   label: 'High priority', bg: 'var(--redbg)',   bd: 'var(--redbd)',   num: 'var(--red)'   },
          { count: medium.length, label: 'Medium',        bg: 'var(--amberbg)', bd: 'var(--amberbd)', num: 'var(--amber)' },
          { count: low.length,    label: 'Low',           bg: 'var(--greenbg)', bd: 'var(--greenbd)', num: 'var(--green)' },
        ].map(b => (
          <div key={b.label} style={{
            flex: 1, borderRadius: '10px', padding: '12px', textAlign: 'center',
            background: b.bg, border: `1px solid ${b.bd}`,
          }}>
            <div style={{ fontFamily: 'Sora,sans-serif', fontSize: '24px', fontWeight: 700, letterSpacing: '-0.03em', color: b.num }}>{b.count}</div>
            <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '2px' }}>{b.label}</div>
          </div>
        ))}
      </div>

      {/* Tags */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {skillGaps.map((sg, i) => (
          <span key={i} className={`sg-tag ${priorityOf(sg)}`}>
            <span className="sg-tag-dot" />
            {sg.skill || sg.name || sg}
          </span>
        ))}
      </div>

      {/* Legend */}
      <div style={{
        display: 'flex', gap: '16px', marginTop: '16px', paddingTop: '14px',
        borderTop: '1px solid var(--border)', fontSize: '11px', color: 'var(--text3)', flexWrap: 'wrap',
      }}>
        {[
          { color: 'var(--red)',   label: 'High — required, 3+ times' },
          { color: 'var(--amber)', label: 'Medium — mentioned 2×' },
          { color: 'var(--green)', label: 'Low — mentioned once' },
        ].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: l.color }} />
            {l.label}
          </div>
        ))}
      </div>
    </div>
  )
}

function DiffSection({ diff }) {
  const [open,   setOpen]   = useState(null)
  const [filter, setFilter] = useState('all')

  const items = diff || []
  const filtered = items.filter(d => {
    if (filter === 'changed')   return d.changed
    if (filter === 'unchanged') return !d.changed
    return true
  })
  const changedCount   = items.filter(d => d.changed).length
  const unchangedCount = items.filter(d => !d.changed).length

  return (
    <div className="or-card" style={{ overflow: 'hidden' }}>
      <div style={{
        padding: '18px 22px', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ fontFamily: 'Sora,sans-serif', fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>
          Resume Improvements
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {[
            { id: 'all',       label: `All (${items.length})` },
            { id: 'changed',   label: `Improved (${changedCount})` },
            { id: 'unchanged', label: `Unchanged (${unchangedCount})` },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              style={{
                padding: '5px 12px', borderRadius: '7px', fontSize: '12px', fontWeight: 500,
                border: '1px solid', cursor: 'pointer', transition: 'all 0.15s',
                background: filter === f.id ? 'var(--text)' : 'transparent',
                color:      filter === f.id ? '#fff' : 'var(--text2)',
                borderColor: filter === f.id ? 'var(--text)' : 'var(--border)',
              }}
            >{f.label}</button>
          ))}
        </div>
      </div>

      {filtered.map((item, i) => (
        <div key={i} className="diff-item">
          <div
            className="diff-item-header"
            onClick={() => setOpen(open === i ? null : i)}
          >
            <span className={`diff-status ${item.changed ? 'changed' : 'unchanged'}`} />
            <span style={{
              fontSize: '14px', color: 'var(--text2)', flex: 1,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {(item.original || '').slice(0, 80)}{(item.original || '').length > 80 ? '…' : ''}
            </span>
            <span style={{
              fontSize: '11px', fontWeight: 600, padding: '3px 9px', borderRadius: '6px', flexShrink: 0,
              background: item.changed ? 'var(--greenbg)' : 'var(--bg3)',
              color:      item.changed ? 'var(--green)'   : 'var(--text3)',
              border: `1px solid ${item.changed ? 'var(--greenbd)' : 'var(--border)'}`,
            }}>
              {item.changed ? 'Improved' : 'Unchanged'}
            </span>
            <span style={{ color: 'var(--text3)', fontSize: '12px', marginLeft: '8px', transition: 'transform 0.2s', transform: open === i ? 'rotate(180deg)' : 'none' }}>▼</span>
          </div>

          <AnimatePresence>
            {open === i && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                style={{ overflow: 'hidden', padding: '0 22px 18px' }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ background: 'var(--redbg)', border: '1px solid var(--redbd)', borderRadius: '10px', padding: '14px 16px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--red)', marginBottom: '8px' }}>Original</div>
                    <div style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--text)' }}>{item.original}</div>
                  </div>
                  <div style={{ background: 'var(--greenbg)', border: '1px solid var(--greenbd)', borderRadius: '10px', padding: '14px 16px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--green)', marginBottom: '8px' }}>Optimized</div>
                    <div style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--text)' }}>{item.optimized}</div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  )
}

// ── Main Result page ────────────────────────────────────────────────────────

export default function Result({ results, onReset, resumeText }) {
  const { user, logout } = useAuth()
  const [downloading, setDownloading] = useState(false)
  const [downloadErr, setDownloadErr] = useState(null)
  const [activeTab,   setActiveTab]   = useState('overview')

  useEffect(() => {
    confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 }, colors: ['#D95F2B', '#F47B4F', '#1A7C4A', '#22c55e'] })
  }, [])

  const { scores, skill_gaps, diff, optimized_resume } = results
  const improvement  = Math.round(scores.optimized.overall - scores.initial.overall)
  const changedCount = countChanges(diff)

  const handleDownload = async () => {
    setDownloading(true)
    setDownloadErr(null)
    try {
      await downloadPDF(optimized_resume)
    } catch {
      setDownloadErr('Download failed. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  const TABS = [
    { id: 'overview',      label: 'Score Overview' },
    { id: 'improvements',  label: `Improvements (${changedCount})` },
    { id: 'resume',        label: 'Full Resume' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* ── Sticky nav with tabs ── */}
      <div style={{ background: 'var(--bg2)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 90 }}>
        <div style={{
          maxWidth: '1200px', margin: '0 auto',
          padding: '0 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '52px',
        }}>
          <div style={{ display: 'flex', gap: '2px' }}>
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`result-tab ${activeTab === t.id ? 'active' : ''}`}
              >{t.label}</button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button className="btn-outline" onClick={onReset}>← Optimize Another</button>
            <button className="btn-accent" onClick={handleDownload} disabled={downloading}>
              {downloading ? '⏳ Generating…' : '⬇ Download Resume'}
            </button>
            {user && (
              <button className="nav-link" onClick={logout} style={{ fontSize: '13px' }}>Logout</button>
            )}
          </div>
        </div>
      </div>

      {/* ── Win banner ── */}
      <div className="win-banner">
        <div style={{
          maxWidth: '1200px', margin: '0 auto',
          display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap',
        }}>
          <div style={{
            width: '46px', height: '46px', borderRadius: '12px',
            background: '#D1FAE5', border: '1px solid #86EFAC',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0,
          }}>🎯</div>
          <div>
            <h3 style={{ fontFamily: 'Sora,sans-serif', fontSize: '17px', fontWeight: 700, color: 'var(--green)', letterSpacing: '-0.02em' }}>
              ATS Score improved by +{improvement} points
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text2)', marginTop: '2px' }}>
              {changedCount} bullet{changedCount !== 1 ? 's' : ''} rewritten ·{' '}
              {skill_gaps.length} skill gap{skill_gaps.length !== 1 ? 's' : ''} identified ·{' '}
              {Math.round(scores.initial.overall)}% → {Math.round(scores.optimized.overall)}% overall match
            </p>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '16px' }}>
            {[
              { num: `${Math.round(scores.optimized.overall)}%`, label: 'Optimized score', green: true },
              { num: changedCount,    label: 'Bullets rewritten' },
              { num: skill_gaps.length, label: 'Skills missing' },
              { num: 'ATS ✓',        label: 'Format status', green: true },
            ].map(m => (
              <div key={m.label} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'Sora,sans-serif', fontSize: '20px', fontWeight: 700, letterSpacing: '-0.03em', color: m.green ? 'var(--green)' : 'var(--text)' }}>{m.num}</div>
                <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '26px 2rem 60px' }}>

        {/* Overview tab */}
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <ScoreSection scores={scores} />
              {/* Mini diff preview in overview */}
              <div className="or-card" style={{ overflow: 'hidden' }}>
                <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontFamily: 'Sora,sans-serif', fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>Top improvements</div>
                  <button
                    onClick={() => setActiveTab('improvements')}
                    style={{ fontSize: '13px', color: 'var(--accent)', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer' }}
                  >See all {changedCount} →</button>
                </div>
                {(diff || []).filter(d => d.changed).slice(0, 3).map((item, i) => (
                  <div key={i} style={{ padding: '13px 22px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span className="diff-status changed" />
                    <span style={{ fontSize: '13px', color: 'var(--text2)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {(item.original || '').slice(0, 70)}…
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '6px', background: 'var(--greenbg)', color: 'var(--green)', border: '1px solid var(--greenbd)', flexShrink: 0 }}>
                      Improved
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <SkillGapSection skillGaps={skill_gaps} />
          </motion.div>
        )}

        {/* Improvements tab */}
        {activeTab === 'improvements' && (
          <motion.div key="improvements" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <DiffSection diff={diff} />
          </motion.div>
        )}

        {/* Full Resume tab */}
        {activeTab === 'resume' && (
          <motion.div
            key="resume"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}
          >
            {[
              { title: 'Original Resume',  text: resumeText,         score: Math.round(scores.initial.overall),   color: 'var(--red)'   },
              { title: 'Optimized Resume', text: optimized_resume,   score: Math.round(scores.optimized.overall), color: 'var(--green)' },
            ].map(p => (
              <div key={p.title} className="or-card" style={{ overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: 'Sora,sans-serif', fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>{p.title}</span>
                  <span style={{ fontSize: '12px', fontWeight: 600, padding: '3px 9px', borderRadius: '6px', color: p.color, background: p.color === 'var(--red)' ? 'var(--redbg)' : 'var(--greenbg)' }}>
                    {p.score}% ATS score
                  </span>
                </div>
                <pre style={{
                  padding: '20px', fontFamily: "'DM Mono',monospace", fontSize: '12px',
                  color: 'var(--text2)', lineHeight: 1.8, whiteSpace: 'pre-wrap',
                  maxHeight: '520px', overflowY: 'auto',
                }}>{p.text || 'No text available.'}</pre>
              </div>
            ))}
          </motion.div>
        )}

        {/* Download error */}
        {downloadErr && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: '16px', textAlign: 'center', color: 'var(--red)', fontSize: '14px' }}>
            ⚠ {downloadErr}
          </motion.p>
        )}

        {/* Bottom CTA */}
        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <button className="btn-accent" onClick={handleDownload} disabled={downloading} style={{ padding: '14px 36px', fontSize: '15px', borderRadius: 'var(--radius-lg)' }}>
            {downloading ? '⏳ Generating PDF…' : '⬇ Download Optimized Resume (PDF)'}
          </button>
          <p style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '10px' }}>
            ATS-safe formatting · Single column · Standard fonts
          </p>
        </div>
      </div>
    </div>
  )
}