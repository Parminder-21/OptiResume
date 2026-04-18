import { motion } from 'framer-motion'
import { getPriorityStyle, getPriorityDot } from '../utils/helpers.js'

const PRIORITY_ORDER = { High: 0, Medium: 1, Low: 2 }

export default function SkillGap({ skillGaps }) {
  if (!skillGaps || skillGaps.length === 0) {
    return (
      <div className="glass-card p-6">
        <p className="section-title">Skill Gap Analysis</p>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <span className="text-4xl mb-3">🎉</span>
          <p className="text-green-400 font-semibold">No major skill gaps detected!</p>
          <p className="text-slate-500 text-sm mt-1">Your resume covers the key requirements well.</p>
        </div>
      </div>
    )
  }

  const sorted = [...skillGaps].sort(
    (a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
  )

  const highCount   = sorted.filter(s => s.priority === 'High').length
  const mediumCount = sorted.filter(s => s.priority === 'Medium').length
  const lowCount    = sorted.filter(s => s.priority === 'Low').length

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <p className="section-title mb-0">Skill Gap Analysis</p>
        <span className="text-xs text-slate-500">{sorted.length} skills missing</span>
      </div>

      {/* Summary counts */}
      <div className="flex gap-3 mb-5">
        {highCount > 0 && (
          <div className="flex-1 bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-red-400">{highCount}</p>
            <p className="text-xs text-red-400/80 mt-0.5">High Priority</p>
          </div>
        )}
        {mediumCount > 0 && (
          <div className="flex-1 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-yellow-400">{mediumCount}</p>
            <p className="text-xs text-yellow-400/80 mt-0.5">Medium</p>
          </div>
        )}
        {lowCount > 0 && (
          <div className="flex-1 bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-green-400">{lowCount}</p>
            <p className="text-xs text-green-400/80 mt-0.5">Low Priority</p>
          </div>
        )}
      </div>

      {/* Skill tags */}
      <div className="flex flex-wrap gap-2">
        {sorted.map((item, idx) => (
          <motion.div
            key={item.skill}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.04, duration: 0.25 }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border ${getPriorityStyle(item.priority)}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${getPriorityDot(item.priority)}`} />
            {item.skill}
          </motion.div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-5 pt-4 border-t border-[var(--border-pri)] flex gap-5 text-xs text-slate-500">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400" />High — appears in required section</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-yellow-400" />Medium — mentioned 2+ times</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-400" />Low — mentioned once</span>
      </div>
    </div>
  )
}