import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { getScoreBadgeClass, getScoreRating } from '../utils/dataProcessor'
import { AgentPanel } from '../components/AgentPanel'
import clsx from 'clsx'

const COLORS = ['#6366f1','#10b981','#3b82f6','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899']

export function AgentsPage() {
  const { state } = useApp()
  const { agentStats, settings } = state
  const [selected, setSelected] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const agents = Object.values(agentStats)
    .sort((a, b) => b.score - a.score)
    .filter(a => !search || a.agent.toLowerCase().includes(search.toLowerCase()))

  if (!agents.length) {
    return (
      <div className="text-center py-24 text-gray-400">
        <div className="text-5xl mb-4">👤</div>
        <div className="font-semibold text-lg">No agent data yet</div>
        <div className="text-sm mt-1">Upload a Freshdesk export from the Overview page</div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-extrabold">Agent Performance</h1>
          <p className="text-gray-500 text-sm mt-0.5">{agents.length} agents · click a card to view details</p>
        </div>
        <input className="input text-sm w-44" placeholder="Search agents..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {agents.map((s, i) => {
          const badge = getScoreBadgeClass(s.score, settings.thresholds)
          const rating = getScoreRating(s.score, settings.thresholds)
          const color = COLORS[i % COLORS.length]
          const initials = s.agent.split(' ').map((p: string) => p[0]).join('').slice(0, 2).toUpperCase()
          return (
            <div key={s.agent} className="card card-hover cursor-pointer p-4" onClick={() => setSelected(s.agent)}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-extrabold text-base flex-shrink-0" style={{ background: color }}>{initials}</div>
                <div className="min-w-0">
                  <div className="font-bold text-sm truncate">{s.agent}</div>
                  <div className="text-xs text-gray-400 truncate">{s.group || '—'}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {([['Assigned', s.assigned], ['Resolved', s.resolved], ['CSAT', s.avgCsat > 0 ? `${s.avgCsat.toFixed(0)}%` : '—'], ['SLA', s.slaRate > 0 ? `${s.slaRate.toFixed(0)}%` : '—']] as [string, string|number][]).map(([l, v]) => (
                  <div key={l} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 text-center">
                    <div className="text-[10px] text-gray-400 uppercase tracking-wide">{l}</div>
                    <div className="font-bold text-base">{v}</div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <span className={clsx('text-xs font-semibold px-2 py-0.5 rounded-full', badge)}>{s.score}/100 · {rating}</span>
                <span className="text-xs text-gray-400">View →</span>
              </div>
            </div>
          )
        })}
      </div>
      <AgentPanel agentName={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
