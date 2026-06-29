import { useState } from 'react'
import { UploadZone } from '../components/UploadZone'
import { FilterBar } from '../components/FilterBar'
import { KPICard } from '../components/ui/KPICard'
import { AgentPanel } from '../components/AgentPanel'
import { useApp } from '../context/AppContext'
import { getScoreBadgeClass, getScoreRating } from '../utils/dataProcessor'
import {
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, Legend, CartesianGrid,
} from 'recharts'
import clsx from 'clsx'

const COLORS = ['#6366f1','#10b981','#3b82f6','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899']

export function OverviewPage() {
  const { state } = useApp()
  const { globalMetrics: m, agentStats, settings } = state
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState<string>('score')
  const [sortDir, setSortDir] = useState(-1)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const PAGE = 15
  const { targets } = settings

  const dailyMap: Record<string, number> = {}
  state.filteredTickets.forEach(t => {
    if (t.createdAt) {
      const d = t.createdAt
      const k = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
      dailyMap[k] = (dailyMap[k] || 0) + 1
    }
  })
  const dailyData = Object.keys(dailyMap).sort().slice(-21).map(k => ({ date: k.slice(5), tickets: dailyMap[k] }))

  const statusMap: Record<string, number> = {}
  state.filteredTickets.forEach(t => { const s = t.status || 'Unknown'; statusMap[s] = (statusMap[s] || 0) + 1 })
  const statusData = Object.entries(statusMap).map(([name, value]) => ({ name, value }))

  const agents = Object.values(agentStats)
  const sort = (key: string) => { if (sortKey === key) setSortDir(d => -d); else { setSortKey(key); setSortDir(-1) } }

  const sorted = [...agents].sort((a, b) => {
    if (sortKey === 'agent') return sortDir * a.agent.localeCompare(b.agent)
    const av = Number((a as unknown as Record<string, unknown>)[sortKey]) || 0
    const bv = Number((b as unknown as Record<string, unknown>)[sortKey]) || 0
    return sortDir * (av - bv)
  }).filter(a => !search || a.agent.toLowerCase().includes(search.toLowerCase()))

  const totalPages = Math.ceil(sorted.length / PAGE)
  const pageAgents = sorted.slice(page * PAGE, (page + 1) * PAGE)
  const empty = !state.tickets.length

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-extrabold mb-1">Performance Overview</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          {state.lastUpload ? `${state.filteredTickets.length.toLocaleString()} tickets · ${agents.length} agents` : 'Upload a Freshdesk export to get started'}
        </p>
      </div>

      {empty && <UploadZone />}

      {!empty && (
        <>
          <FilterBar />
          <div className="mb-2 text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
            <span>📊 Key Metrics</span><div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 mb-6">
            {m && <>
              <KPICard icon="🎫" title="Total Tickets" value={m.total.toLocaleString()} color="blue" />
              <KPICard icon="✅" title="Resolved" value={m.resolved.toLocaleString()} color="green" achievePct={m.total > 0 ? m.resolved/m.total*100 : 0} />
              <KPICard icon="🔓" title="Open" value={m.open.toLocaleString()} color="orange" />
              <KPICard icon="⏳" title="Pending" value={m.pending.toLocaleString()} color="purple" />
              <KPICard icon="📋" title="Backlog" value={m.backlog.toLocaleString()} color="red" />
              <KPICard icon="⚡" title="Avg FRT" value={m.avgFrt.toFixed(1)} unit="h" color={m.avgFrt<=targets.frt?'green':'red'} target={`${targets.frt}h`} achievePct={m.avgFrt>0?Math.min(100,targets.frt/m.avgFrt*100):0} />
              <KPICard icon="⏱️" title="Avg Resolution" value={m.avgRt.toFixed(1)} unit="h" color={m.avgRt<=targets.rt?'green':'red'} target={`${targets.rt}h`} achievePct={m.avgRt>0?Math.min(100,targets.rt/m.avgRt*100):0} />
              <KPICard icon="😊" title="CSAT %" value={m.avgCsat.toFixed(1)} unit="%" color={m.avgCsat>=targets.csat?'green':m.avgCsat>=targets.csat*0.85?'orange':'red'} target={`${targets.csat}%`} achievePct={targets.csat>0?m.avgCsat/targets.csat*100:0} />
              <KPICard icon="📏" title="SLA %" value={m.slaRate.toFixed(1)} unit="%" color={m.slaRate>=targets.sla?'green':'orange'} target={`${targets.sla}%`} achievePct={targets.sla>0?m.slaRate/targets.sla*100:0} />
              <KPICard icon="🎯" title="FCR %" value={m.fcrRate.toFixed(1)} unit="%" color={m.fcrRate>=targets.fcr?'green':'orange'} target={`${targets.fcr}%`} achievePct={targets.fcr>0?m.fcrRate/targets.fcr*100:0} />
              <KPICard icon="🔄" title="Reopen Rate" value={m.reopenRate.toFixed(1)} unit="%" color={m.reopenRate<=targets.reopen?'green':'red'} target={`≤${targets.reopen}%`} achievePct={Math.min(100,targets.reopen/Math.max(0.01,m.reopenRate)*100)} />
              <KPICard icon="🚨" title="Escalations" value={m.escalations} color="red" />
              <KPICard icon="⭐" title="Avg Score" value={m.avgScore.toFixed(0)} unit="/100" color={m.avgScore>=80?'green':m.avgScore>=60?'orange':'red'} target="80/100" achievePct={m.avgScore/80*100} />
              <KPICard icon="📅" title="Closed Today" value={m.closedToday} color="indigo" />
              <KPICard icon="📅" title="Closed Week" value={m.closedWeek} color="indigo" />
              <KPICard icon="📅" title="Closed Month" value={m.closedMonth} color="indigo" />
            </>}
          </div>

          <div className="mb-2 text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
            <span>📈 Trends</span><div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="card p-4">
              <div className="font-semibold text-sm mb-3">Daily Ticket Volume</div>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="tickets" stroke="#6366f1" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="card p-4">
              <div className="font-semibold text-sm mb-3">Status Distribution</div>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value">
                    {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend iconSize={10} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mb-2 text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
            <span>🏆 Agent Leaderboard</span><div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
          </div>
          <div className="card overflow-hidden mb-6">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <span className="font-bold text-sm">Performance Rankings</span>
              <input className="input text-xs py-1.5 w-44" placeholder="Search agents..." value={search} onChange={e => { setSearch(e.target.value); setPage(0) }} />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/50">
                    {[['#','rank'],['Agent','agent'],['Assigned','assigned'],['Resolved','resolved'],['Res.Rate','resolutionRate'],['FRT(h)','avgFrt'],['RT(h)','avgRt'],['CSAT','avgCsat'],['SLA%','slaRate'],['Reopens','reopens'],['Escals.','escalations'],['Score','score']].map(([label, key]) => (
                      <th key={key} className="px-3 py-2.5 text-left font-semibold text-gray-400 uppercase tracking-wide cursor-pointer hover:text-brand-600 whitespace-nowrap" onClick={() => sort(key)}>
                        {label} {sortKey === key ? (sortDir > 0 ? '↑' : '↓') : ''}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageAgents.map((s, i) => {
                    const rank = page * PAGE + i + 1
                    const badge = getScoreBadgeClass(s.score, settings.thresholds)
                    const rating = getScoreRating(s.score, settings.thresholds)
                    const rankCls = rank===1?'bg-amber-100 text-amber-700':rank===2?'bg-gray-100 text-gray-600':rank===3?'bg-pink-100 text-pink-600':'bg-gray-50 text-gray-400'
                    const color = COLORS[(page*PAGE+i) % COLORS.length]
                    const initials = s.agent.split(' ').map((p: string) => p[0]).join('').slice(0,2).toUpperCase()
                    return (
                      <tr key={s.agent} className="border-t border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/40 cursor-pointer" onClick={() => setSelectedAgent(s.agent)}>
                        <td className="px-3 py-2.5"><div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${rankCls}`}>{rank}</div></td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0" style={{ background: color }}>{initials}</div>
                            <div>
                              <div className="font-semibold">{s.agent}</div>
                              <div className="text-gray-400 text-[10px]">{s.group || '—'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-center">{s.assigned}</td>
                        <td className="px-3 py-2.5 text-center">{s.resolved}</td>
                        <td className="px-3 py-2.5">{s.resolutionRate.toFixed(0)}%</td>
                        <td className="px-3 py-2.5 text-center">{s.avgFrt>0?s.avgFrt.toFixed(1):'—'}</td>
                        <td className="px-3 py-2.5 text-center">{s.avgRt>0?s.avgRt.toFixed(1):'—'}</td>
                        <td className="px-3 py-2.5 text-center">{s.avgCsat>0?`${s.avgCsat.toFixed(1)}%`:'—'}</td>
                        <td className="px-3 py-2.5 text-center">{s.slaRate>0?`${s.slaRate.toFixed(0)}%`:'—'}</td>
                        <td className="px-3 py-2.5 text-center">{s.reopens}</td>
                        <td className="px-3 py-2.5 text-center">{s.escalations}</td>
                        <td className="px-3 py-2.5"><span className={clsx('text-xs font-semibold px-2 py-0.5 rounded-full', badge)}>{s.score} · {rating}</span></td>
                      </tr>
                    )
                  })}
                  {pageAgents.length === 0 && <tr><td colSpan={12} className="text-center text-gray-400 py-8">No agents found</td></tr>}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center gap-1 px-4 py-3 border-t border-gray-100 dark:border-gray-800">
                {Array.from({ length: totalPages }, (_, i) => (
                  <button key={i} className={`w-7 h-7 rounded-lg text-xs font-medium ${i===page?'bg-brand-600 text-white':'bg-gray-100 dark:bg-gray-800 text-gray-600 hover:bg-gray-200'}`} onClick={() => setPage(i)}>{i+1}</button>
                ))}
                <span className="text-xs text-gray-400 ml-2">Showing {page*PAGE+1}–{Math.min((page+1)*PAGE,sorted.length)} of {sorted.length}</span>
              </div>
            )}
          </div>
          <AgentPanel agentName={selectedAgent} onClose={() => setSelectedAgent(null)} />
        </>
      )}
    </div>
  )
}
