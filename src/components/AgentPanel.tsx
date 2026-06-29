import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MdClose, MdTrendingUp, MdStar } from 'react-icons/md'
import { ResponsiveContainer, LineChart, Line, Tooltip, XAxis } from 'recharts'
import { useApp } from '../context/AppContext'
import { getScoreBadgeClass, getScoreRating } from '../utils/dataProcessor'
import clsx from 'clsx'

interface AgentPanelProps { agentName: string | null; onClose: () => void }

const COLORS = ['#6366f1','#10b981','#3b82f6','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899']

export function AgentPanel({ agentName, onClose }: AgentPanelProps) {
  const { state } = useApp()
  const s = agentName ? state.agentStats[agentName] : null

  const agentsList = Object.values(state.agentStats).sort((a, b) => b.score - a.score)
  const rank = agentName ? agentsList.findIndex(a => a.agent === agentName) + 1 : 0
  const idx = agentsList.findIndex(a => a.agent === agentName)
  const color = COLORS[idx % COLORS.length]

  const { settings } = state
  const badgeCls = s ? getScoreBadgeClass(s.score, settings.thresholds) : ''
  const rating = s ? getScoreRating(s.score, settings.thresholds) : ''

  const dailyData = s
    ? Object.entries(s.dailyCounts).sort(([a], [b]) => a.localeCompare(b)).slice(-14)
        .map(([date, count]) => ({ date: date.slice(5), count }))
    : []

  const strengths: string[] = []
  const improvements: string[] = []
  if (s) {
    const t = settings.targets
    if (s.avgCsat >= t.csat) strengths.push('High CSAT') ; else if (s.avgCsat > 0) improvements.push('Improve CSAT')
    if (s.slaRate >= t.sla) strengths.push('SLA Compliant'); else if (s.slaRate > 0) improvements.push('SLA adherence')
    if (s.avgFrt <= t.frt && s.avgFrt > 0) strengths.push('Fast First Response'); else if (s.avgFrt > 0) improvements.push('Reduce FRT')
    if (s.resolutionRate >= 80) strengths.push('High Resolution Rate'); else improvements.push('Resolution rate')
    if (s.escalations === 0) strengths.push('Zero Escalations'); else if (s.escalations > 3) improvements.push('Reduce escalations')
    if (s.reopens === 0) strengths.push('Zero Reopens')
  }

  return (
    <>
      <AnimatePresence>
        {agentName && (
          <motion.div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
        )}
      </AnimatePresence>
      <motion.div
        className="fixed top-0 right-0 bottom-0 w-[420px] max-w-full bg-white dark:bg-gray-900 border-l border-gray-100 dark:border-gray-800 z-50 flex flex-col shadow-2xl"
        initial={{ x: '100%' }} animate={{ x: agentName ? 0 : '100%' }} transition={{ type: 'spring', stiffness: 350, damping: 30 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-brand-600 to-purple-600 text-white">
          <div>
            <div className="text-xs opacity-75 mb-1">Agent Profile</div>
            <div className="font-bold text-lg leading-tight">{agentName || '—'}</div>
            <div className="text-xs opacity-75 mt-0.5">{s?.group || 'No group'}</div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors">
            <MdClose className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 scrollbar-thin">
          {s && (
            <>
              {/* Score */}
              <div className="flex items-center gap-4 mb-5">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-extrabold flex-shrink-0"
                  style={{ background: color }}
                >
                  {(agentName || '?').split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="text-3xl font-extrabold">{s.score}<span className="text-base font-medium text-gray-400">/100</span></div>
                  <span className={clsx('text-xs font-semibold px-2 py-0.5 rounded-full', badgeCls)}>{rating}</span>
                  <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                    <MdStar className="w-3.5 h-3.5 text-amber-400" />
                    Rank #{rank} of {agentsList.length}
                  </div>
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-2.5 mb-5">
                {[
                  { label: 'Assigned', value: s.assigned },
                  { label: 'Resolved', value: s.resolved },
                  { label: 'Pending', value: s.pending },
                  { label: 'Open', value: s.open },
                  { label: 'Avg FRT', value: s.avgFrt > 0 ? `${s.avgFrt.toFixed(1)}h` : '—' },
                  { label: 'Avg Res.Time', value: s.avgRt > 0 ? `${s.avgRt.toFixed(1)}h` : '—' },
                  { label: 'CSAT', value: s.avgCsat > 0 ? `${s.avgCsat.toFixed(1)}%` : '—' },
                  { label: 'SLA', value: s.slaRate > 0 ? `${s.slaRate.toFixed(0)}%` : '—' },
                  { label: 'Escalations', value: s.escalations },
                  { label: 'Reopens', value: s.reopens },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700">
                    <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</div>
                    <div className="text-xl font-bold">{value}</div>
                  </div>
                ))}
              </div>

              {/* Trend chart */}
              <div className="card p-4 mb-5">
                <div className="flex items-center gap-2 mb-3 text-sm font-semibold">
                  <MdTrendingUp className="text-brand-500" />
                  14-Day Ticket Trend
                </div>
                <ResponsiveContainer width="100%" height={90}>
                  <LineChart data={dailyData}>
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke={color} strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Strengths */}
              <div className="mb-4">
                <div className="text-sm font-semibold mb-2">💪 Strengths</div>
                <div className="flex flex-wrap gap-2">
                  {strengths.length
                    ? strengths.map(s => (
                        <span key={s} className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900">{s}</span>
                      ))
                    : <span className="text-xs text-gray-400">Not enough data</span>
                  }
                </div>
              </div>

              {/* Improvements */}
              <div>
                <div className="text-sm font-semibold mb-2">🎯 Areas for Improvement</div>
                <div className="flex flex-wrap gap-2">
                  {improvements.length
                    ? improvements.map(im => (
                        <span key={im} className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border border-amber-100 dark:border-amber-900">{im}</span>
                      ))
                    : <span className="text-xs text-emerald-600 dark:text-emerald-400">Performing well across all areas! ✓</span>
                  }
                </div>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </>
  )
}
