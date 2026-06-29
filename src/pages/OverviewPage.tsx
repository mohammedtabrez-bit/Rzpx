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

const COLORS = ['#2563eb','#10b981','#3b82f6','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899']

export function OverviewPage() {
  const { state } = useApp()
  const { globalMetrics: m, agentStats, settings, filteredTickets } = state
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState<string>('score')
  const [sortDir, setSortDir] = useState(-1)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const PAGE = 15
  const { targets } = settings

  const now = new Date()
  const unresolved = filteredTickets.filter(t => {
    const s = t.status.toLowerCase()
    return !s.includes('resolved') && !s.includes('closed')
  }).length
  const overdue = filteredTickets.filter(t => {
    const s = t.status.toLowerCase()
    return !s.includes('resolved') && !s.includes('closed') && t.createdAt && t.createdAt < now
  }).length
  const onHold = filteredTickets.filter(t => t.status.toLowerCase().includes('on hold') || t.status.toLowerCase().includes('hold')).length
  const unassigned = filteredTickets.filter(t => !t.agent || t.agent === 'Unassigned' || t.agent === '').length

  const dailyMap: Record<string, number> = {}
  filteredTickets.forEach(t => {
    if (t.createdAt) {
      const d = t.createdAt
      const k = String(d.getFullYear()) + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0')
      dailyMap[k] = (dailyMap[k] || 0) + 1
    }
  })
  const dailyData = Object.keys(dailyMap).sort().slice(-21).map(k => ({ date: k.slice(5), tickets: dailyMap[k] }))

  const statusMap: Record<string, number> = {}
  filteredTickets.forEach(t => { const s = t.status || 'Unknown'; statusMap[s] = (statusMap[s] || 0) + 1 })
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

  const sectionHeader = (title: string) => (
    <div style={{ fontSize: 11, fontWeight: 700, color: '#1e40af', textTransform: 'uppercase' as const, letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
      <span>{title}</span>
      <div style={{ flex: 1, height: 1, background: '#0d2147' }} />
    </div>
  )

  return (
    <div>
      <div className="mb-5">
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 4 }}>Performance Overview</h1>
        <p style={{ fontSize: 14, color: '#3b82f6' }}>
          {state.lastUpload ? state.filteredTickets.length.toLocaleString() + ' tickets · ' + agents.length + ' agents' : 'Upload a Freshdesk export to get started'}
        </p>
      </div>

      {empty && <UploadZone />}

      {!empty && (
        <>
          <FilterBar />

          {sectionHeader('📊 Key Metrics')}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(185px, 1fr))', gap: 12, marginBottom: 24 }}>
            {m && <>
              <KPICard icon="🔓" title="Unresolved" value={unresolved.toLocaleString()} color="orange" filterStatus="open" />
              <KPICard icon="⚠️" title="Overdue" value={overdue.toLocaleString()} color="red" />
              <KPICard icon="📌" title="Open" value={m.open.toLocaleString()} color="blue" filterStatus="open" />
              <KPICard icon="⏸️" title="On Hold" value={onHold.toLocaleString()} color="purple" />
              <KPICard icon="👤" title="Unassigned" value={unassigned.toLocaleString()} color="red" />
              <KPICard icon="✅" title="Resolved" value={m.resolved.toLocaleString()} color="green" achievePct={m.total > 0 ? m.resolved/m.total*100 : 0} filterStatus="resolved" />
              <KPICard icon="⏳" title="Pending" value={m.pending.toLocaleString()} color="purple" filterStatus="pending" />
              <KPICard icon="📋" title="Backlog" value={m.backlog.toLocaleString()} color="red" />
              <KPICard icon="⚡" title="Avg FRT" value={m.avgFrt.toFixed(1)} unit="h" color={m.avgFrt<=targets.frt?'green':'red'} target={targets.frt+'h'} achievePct={m.avgFrt>0?Math.min(100,targets.frt/m.avgFrt*100):0} />
              <KPICard icon="⏱️" title="Avg Resolution" value={m.avgRt.toFixed(1)} unit="h" color={m.avgRt<=targets.rt?'green':'red'} target={targets.rt+'h'} achievePct={m.avgRt>0?Math.min(100,targets.rt/m.avgRt*100):0} />
              <KPICard icon="😊" title="CSAT %" value={m.avgCsat.toFixed(1)} unit="%" color={m.avgCsat>=targets.csat?'green':m.avgCsat>=targets.csat*0.85?'orange':'red'} target={targets.csat+'%'} achievePct={targets.csat>0?m.avgCsat/targets.csat*100:0} />
              <KPICard icon="📏" title="SLA %" value={m.slaRate.toFixed(1)} unit="%" color={m.slaRate>=targets.sla?'green':'orange'} target={targets.sla+'%'} achievePct={targets.sla>0?m.slaRate/targets.sla*100:0} />
              <KPICard icon="🎯" title="FCR %" value={m.fcrRate.toFixed(1)} unit="%" color={m.fcrRate>=targets.fcr?'green':'orange'} target={targets.fcr+'%'} achievePct={targets.fcr>0?m.fcrRate/targets.fcr*100:0} />
              <KPICard icon="🔄" title="Reopen Rate" value={m.reopenRate.toFixed(1)} unit="%" color={m.reopenRate<=targets.reopen?'green':'red'} target={'≤'+targets.reopen+'%'} achievePct={Math.min(100,targets.reopen/Math.max(0.01,m.reopenRate)*100)} />
              <KPICard icon="⭐" title="Avg Score" value={m.avgScore.toFixed(0)} unit="/100" color={m.avgScore>=80?'green':m.avgScore>=60?'orange':'red'} target="80/100" achievePct={m.avgScore/80*100} />
              <KPICard icon="📅" title="Closed Today" value={m.closedToday} color="indigo" />
              <KPICard icon="📅" title="Closed Week" value={m.closedWeek} color="indigo" />
              <KPICard icon="📅" title="Closed Month" value={m.closedMonth} color="indigo" />
            </>}
          </div>

          {sectionHeader('📈 Trends')}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 16, marginBottom: 24 }}>
            <div style={{ background: '#0a1628', border: '1px solid #0d2147', borderRadius: 14, padding: 20 }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: '#93c5fd', marginBottom: 14 }}>Daily Ticket Volume</div>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#1e40af' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#1e40af' }} />
                  <Tooltip contentStyle={{ background: '#040a14', border: '1px solid #0d2147', borderRadius: 8 }} />
                  <Line type="monotone" dataKey="tickets" stroke="#2563eb" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: '#0a1628', border: '1px solid #0d2147', borderRadius: 14, padding: 20 }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: '#93c5fd', marginBottom: 14 }}>Status Distribution</div>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value">
                    {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#040a14', border: '1px solid #0d2147', borderRadius: 8 }} />
                  <Legend iconSize={10} wrapperStyle={{ color: '#3b82f6', fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {sectionHeader('🏆 Agent Leaderboard')}
          <div style={{ background: '#0a1628', border: '1px solid #0d2147', borderRadius: 14, overflow: 'hidden', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #0d2147' }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: '#93c5fd' }}>Performance Rankings</span>
              <input style={{ background: '#040a14', border: '1px solid #0d2147', color: '#93c5fd', padding: '6px 10px', borderRadius: 8, fontSize: 12, outline: 'none', width: 180 }} placeholder="Search agents..." value={search} onChange={e => { setSearch(e.target.value); setPage(0) }} />
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#040a14' }}>
                    {[['#','rank'],['Agent','agent'],['Assigned','assigned'],['Resolved','resolved'],['Res.Rate','resolutionRate'],['FRT(h)','avgFrt'],['RT(h)','avgRt'],['CSAT','avgCsat'],['SLA%','slaRate'],['Reopens','reopens'],['Escals.','escalations'],['Score','score']].map(([label, key]) => (
                      <th key={key} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#1e40af', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', cursor: 'pointer', whiteSpace: 'nowrap' }} onClick={() => sort(key)}>
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
                    const rankBg = rank===1?'#78350f':rank===2?'#1e3a8a':rank===3?'#4a1d96':'#0d2147'
                    const rankColor = rank===1?'#fbbf24':rank===2?'#60a5fa':rank===3?'#a78bfa':'#3b82f6'
                    const color = COLORS[(page*PAGE+i) % COLORS.length]
                    const initials = s.agent.split(' ').map((p: string) => p[0]).join('').slice(0,2).toUpperCase()
                    return (
                      <tr key={s.agent} style={{ borderTop: '1px solid #0d2147', cursor: 'pointer' }}
                        onClick={() => setSelectedAgent(s.agent)}
                        onMouseEnter={e => (e.currentTarget.style.background = '#040a14')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <td style={{ padding: '10px 12px' }}><div style={{ width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 11, background: rankBg, color: rankColor }}>{rank}</div></td>
                        <td style={{ padding: '10px 12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 11, flexShrink: 0, background: color }}>{initials}</div>
                            <div>
                              <div style={{ fontWeight: 600, color: '#93c5fd' }}>{s.agent}</div>
                              <div style={{ fontSize: 10, color: '#1e40af' }}>{s.group || '—'}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', color: '#60a5fa' }}>{s.assigned}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', color: '#34d399' }}>{s.resolved}</td>
                        <td style={{ padding: '10px 12px', color: '#93c5fd' }}>{s.resolutionRate.toFixed(0)}%</td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', color: '#93c5fd' }}>{s.avgFrt>0?s.avgFrt.toFixed(1):'—'}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', color: '#93c5fd' }}>{s.avgRt>0?s.avgRt.toFixed(1):'—'}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', color: '#93c5fd' }}>{s.avgCsat>0?s.avgCsat.toFixed(1)+'%':'—'}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', color: '#93c5fd' }}>{s.slaRate>0?s.slaRate.toFixed(0)+'%':'—'}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', color: '#f87171' }}>{s.reopens}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', color: '#f87171' }}>{s.escalations}</td>
                        <td style={{ padding: '10px 12px' }}><span className={clsx('text-xs font-semibold px-2 py-0.5 rounded-full', badge)}>{s.score} · {rating}</span></td>
                      </tr>
                    )
                  })}
                  {pageAgents.length === 0 && <tr><td colSpan={12} style={{ textAlign: 'center', color: '#1e40af', padding: 32 }}>No agents found</td></tr>}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '12px 16px', borderTop: '1px solid #0d2147' }}>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button key={i} style={{ width: 28, height: 28, borderRadius: 8, fontSize: 12, fontWeight: 500, border: 'none', cursor: 'pointer', background: i===page?'#1d4ed8':'#0d2147', color: i===page?'#fff':'#3b82f6' }} onClick={() => setPage(i)}>{i+1}</button>
                ))}
                <span style={{ fontSize: 12, color: '#1e40af', marginLeft: 8 }}>
                  {'Showing ' + (page*PAGE+1) + '–' + Math.min((page+1)*PAGE, sorted.length) + ' of ' + sorted.length}
                </span>
              </div>
            )}
          </div>
          <AgentPanel agentName={selectedAgent} onClose={() => setSelectedAgent(null)} />
        </>
      )}
    </div>
  )
}
