import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { countChanges } from '../utils/helpers.js'

// Simple inline diff highlighter — no external dep needed
function highlightChanges(original, optimized) {
  if (original === optimized) return { origHtml: original, optHtml: optimized }

  const origWords = original.split(' ')
  const optWords  = optimized.split(' ')
  const optSet    = new Set(optWords.map(w => w.toLowerCase().replace(/[^a-z0-9]/g, '')))
  const origSet   = new Set(origWords.map(w => w.toLowerCase().replace(/[^a-z0-9]/g, '')))

  const origHtml = origWords.map(w => {
    const clean = w.toLowerCase().replace(/[^a-z0-9]/g, '')
    return optSet.has(clean) ? w : `<mark class="removed">${w}</mark>`
  }).join(' ')

  const optHtml = optWords.map(w => {
    const clean = w.toLowerCase().replace(/[^a-z0-9]/g, '')
    return origSet.has(clean) ? w : `<mark class="added">${w}</mark>`
  }).join(' ')

  return { origHtml, optHtml }
}

function DiffRow({ item, index, isExpanded, onToggle }) {
  const { origHtml, optHtml } = highlightChanges(item.original, item.optimized)
  const hasChange = item.changed

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`rounded-xl overflow-hidden border ${
        hasChange
          ? 'border-brand-500/30 bg-brand-500/5'
          : 'border-white/5 bg-white/2'
      }`}
    >
      {/* Row header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors"
      >
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${hasChange ? 'bg-green-400' : 'bg-slate-600'}`} />
        <span className="text-sm text-slate-300 flex-1 truncate">
          {item.original.slice(0, 80)}{item.original.length > 80 ? '…' : ''}
        </span>
        {hasChange && (
          <span className="text-xs text-green-400 font-medium bg-green-400/10 px-2 py-0.5 rounded-full flex-shrink-0">
            Improved
          </span>
        )}
        <span className="text-slate-600 text-xs">{isExpanded ? '▲' : '▼'}</span>
      </button>

      {/* Expanded diff */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-2 gap-px bg-[var(--border-pri)] border-t border-[var(--border-pri)]">
              {/* Original */}
              <div className="bg-[var(--bg-page)] px-4 py-3">
                <p className="text-xs text-red-500 dark:text-red-400 font-semibold uppercase tracking-wider mb-2">Original</p>
                <p
                  className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed diff-text"
                  dangerouslySetInnerHTML={{ __html: origHtml }}
                />
              </div>
              {/* Optimized */}
              <div className="bg-[var(--bg-surface)] px-4 py-3">
                <p className="text-xs text-green-600 dark:text-green-400 font-semibold uppercase tracking-wider mb-2">Optimized</p>
                <p
                  className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed diff-text"
                  dangerouslySetInnerHTML={{ __html: optHtml }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function ResumeDiff({ diff }) {
  const [expandedIdx, setExpandedIdx]   = useState(null)
  const [showAll,     setShowAll]       = useState(false)
  const [filter,      setFilter]        = useState('all') // 'all' | 'changed' | 'unchanged'

  if (!diff || diff.length === 0) {
    return (
      <div className="glass-card p-6">
        <p className="section-title">Resume Improvements</p>
        <p className="text-slate-500 text-sm text-center py-8">No bullets found to compare.</p>
      </div>
    )
  }

  const changedCount   = countChanges(diff)
  const unchangedCount = diff.length - changedCount

  const filteredDiff = diff.filter(item => {
    if (filter === 'changed')   return item.changed
    if (filter === 'unchanged') return !item.changed
    return true
  })

  const displayDiff = showAll ? filteredDiff : filteredDiff.slice(0, 6)

  const handleToggle = (idx) => {
    setExpandedIdx(prev => prev === idx ? null : idx)
  }

  return (
    <div className="glass-card p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <p className="section-title mb-0">Resume Improvements</p>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-400" />
            {changedCount} improved
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-slate-600" />
            {unchangedCount} unchanged
          </span>
        </div>
      </div>

      {/* Improvement summary */}
      <div className="mb-5 p-3 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-3">
        <span className="text-2xl">✨</span>
        <div>
          <p className="text-green-400 font-semibold text-sm">
            {changedCount} of {diff.length} bullets improved
          </p>
          <p className="text-slate-400 text-xs mt-0.5">
            Click any bullet to see the before/after comparison
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {['all', 'changed', 'unchanged'].map(f => (
          <button
            key={f}
            onClick={() => { setFilter(f); setExpandedIdx(null) }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
              filter === f
                ? 'bg-brand-500 text-white'
                : 'bg-white/5 text-slate-400 hover:bg-white/10'
            }`}
          >
            {f === 'all' ? `All (${diff.length})` : f === 'changed' ? `Improved (${changedCount})` : `Unchanged (${unchangedCount})`}
          </button>
        ))}
      </div>

      {/* Diff rows */}
      <div className="space-y-2">
        {displayDiff.map((item, idx) => (
          <DiffRow
            key={idx}
            item={item}
            index={idx}
            isExpanded={expandedIdx === idx}
            onToggle={() => handleToggle(idx)}
          />
        ))}
      </div>

      {/* Show more */}
      {filteredDiff.length > 6 && (
        <button
          onClick={() => setShowAll(prev => !prev)}
          className="mt-4 w-full text-center text-sm text-brand-400 hover:text-brand-300 transition-colors py-2"
        >
          {showAll
            ? '↑ Show less'
            : `↓ Show ${filteredDiff.length - 6} more bullets`}
        </button>
      )}

      {/* Inline styles for diff highlights */}
      <style>{`
        .diff-text mark.added {
          background: rgba(34, 197, 94, 0.15);
          color: #16a34a;
          border-radius: 3px;
          padding: 0 2px;
        }
        .dark .diff-text mark.added {
          color: #86efac;
          background: rgba(34, 197, 94, 0.25);
        }
        .diff-text mark.removed {
          background: rgba(239, 68, 68, 0.10);
          color: #dc2626;
          border-radius: 3px;
          padding: 0 2px;
          text-decoration: line-through;
        }
        .dark .diff-text mark.removed {
          color: #fca5a5;
          background: rgba(239, 68, 68, 0.20);
        }
      `}</style>
    </div>
  )
}