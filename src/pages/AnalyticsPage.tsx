import React from 'react'
import { useApp } from '../context/AppContext'
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, Legend, CartesianGrid,
} from 'recharts'

const COLORS = ['#6366f1','#10b981','#3b82f6','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899']

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="card p-5">
      <div className="mb-3">
        <div className="font-semibold text-sm">{title}</div>
        {subtitle && <div className="text-xs text-gray-400 mt-0.5">{subtitle}</div>}
      </div>
      {children}
    </div>
  )
}

export function AnalyticsPage() {
  const { state } = useApp()
  const { filteredTickets, agentStats } = state

  if (!filteredTickets.length) {
    return <div className="text-center py-24 text-gray-400"><div className="text-5xl mb-4">📊</div><div className="font-semibold">No data loaded</div></div>
  }

  // Agent bar chart
  const agentArr = Object.values(agentStats).sort((a, b) => b.assigned - a.assigned).slice(0, 20)

  // Monthly trend
  const monthMap: Record<string, number> = {}
  filteredTickets.forEach(t => {
    if (t.createdAt) {
      const k = `${t.createdAt.getFullYear()}-${String(t.createdAt.getMonth() + 1).padStart(2, '0')}`
      monthMap[k] = (monthMap[k] || 0) + 1
    }
  })
  const monthData = Object.keys(monthMap).sort().map(k => ({ month: k, tickets: monthMap[k] }))

  // Priority
  const prioMap: Record<string, number> = {}
  filteredTickets.forEach(t => { prioMap[t.priority || 'Unknown'] = (prioMap[t.priority || 'Unknown'] || 0) + 1 })
  const prioData = Object.entries(prioMap).map(([name, value]) => ({ name, value }))

  // Group
  const groupMap: Record<string, number> = {}
  filteredTickets.forEach(t => { groupMap[t.group || 'Unknown'] = (groupMap[t.group || 'Unknown'] || 0) + 1 })
  const groupData = Object.entries(groupMap).sort((a, b) => b[1] - a[1]).slice(0, 15).map(([name, value]) => ({ name, value }))

  // CSAT agents
  const csatData = agentArr.filter(a => a.avgCsat > 0).sort((a, b) => b.avgCsat - a.avgCsat).slice(0, 15).map(a => ({ name: a.agent.split(' ')[0], csat: +a.avgCsat.toFixed(1) }))

  // Top/bottom score
  const topData = [...Object.values(agentStats)].sort((a, b) => b.score - a.score).slice(0, 8).map(a => ({ name: a.agent.split(' ')[0], score: a.score }))
  const botData = [...Object.values(agentStats)].sort((a, b) => a.score - b.score).slice(0, 8).map(a => ({ name: a.agent.split(' ')[0], score: a.score }))

  // SLA
  let slaMet = 0, slaBreach = 0, slaNA = 0
  filteredTickets.forEach(t => {
    const sl = t.slaStatus.toLowerCase()
    if (!sl) slaNA++
    else if (sl.includes('met') || sl.includes('yes') || sl === 'true' || sl === '1' || sl.includes('within')) slaMet++
    else slaBreach++
  })
  const slaData = [{ name: 'SLA Met', value: slaMet }, { name: 'Breached', value: slaBreach }, ...(slaNA > 0 ? [{ name: 'N/A', value: slaNA }] : [])]

  return (
    <div>
      <h1 className="text-2xl font-extrabold mb-5">Analytics</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="lg:col-span-2">
          <ChartCard title="Tickets by Agent (Top 20)" subtitle="Assigned vs Resolved">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={agentArr.map(a => ({ name: a.agent.split(' ')[0], Assigned: a.assigned, Resolved: a.resolved }))} margin={{ bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Assigned" fill="#6366f1" radius={[3,3,0,0]} />
                <Bar dataKey="Resolved" fill="#10b981" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <ChartCard title="Monthly Ticket Trend">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={monthData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="tickets" stroke="#6366f1" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Priority Distribution">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={prioData} cx="50%" cy="50%" outerRadius={80} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {prioData.map((_, i) => <Cell key={i} fill={['#ef4444','#f59e0b','#3b82f6','#10b981','#8b5cf6'][i % 5]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="SLA Achievement">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={slaData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                {slaData.map((_, i) => <Cell key={i} fill={['#10b981','#ef4444','#94a3b8'][i]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="CSAT by Agent" subtitle="Agents with CSAT data">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={csatData} layout="vertical" margin={{ left: 30 }}>
              <XAxis type="number" tick={{ fontSize: 10 }} domain={[0, 100]} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={60} />
              <Tooltip />
              <Bar dataKey="csat" radius={[0,3,3,0]}>
                {csatData.map((d, i) => <Cell key={i} fill={d.csat >= 80 ? '#10b981' : d.csat >= 60 ? '#f59e0b' : '#ef4444'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Group-wise Tickets">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={groupData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="value" radius={[4,4,0,0]}>
                {groupData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="🥇 Top Performers">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topData} layout="vertical" margin={{ left: 30 }}>
              <XAxis type="number" tick={{ fontSize: 10 }} domain={[0, 100]} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={60} />
              <Tooltip />
              <Bar dataKey="score" fill="#10b981" radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="⚠️ Needs Improvement">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={botData} layout="vertical" margin={{ left: 30 }}>
              <XAxis type="number" tick={{ fontSize: 10 }} domain={[0, 100]} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={60} />
              <Tooltip />
              <Bar dataKey="score" fill="#ef4444" radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  )
}
