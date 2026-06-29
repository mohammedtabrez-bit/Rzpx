import { motion } from 'framer-motion'
import { useApp } from '../context/AppContext'

interface InsightCardProps { icon: string; bg: string; title: string; text: string }
function InsightCard({ icon, bg, title, text }: InsightCardProps) {
  return (
    <motion.div className="card p-4 flex gap-3 items-start" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${bg}`}>{icon}</div>
      <div>
        <div className="font-semibold text-sm mb-1">{title}</div>
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed" dangerouslySetInnerHTML={{ __html: text }} />
      </div>
    </motion.div>
  )
}

export function InsightsPage() {
  const { state } = useApp()
  const { agentStats, globalMetrics: m, settings } = state

  const agents = Object.values(agentStats)
  if (!agents.length || !m) {
    return (
      <div className="text-center py-24 text-gray-400">
        <div className="text-5xl mb-4">💡</div>
        <div className="font-semibold text-lg">No insights yet</div>
        <div className="text-sm mt-1">Upload data to generate AI-powered insights and recommendations.</div>
      </div>
    )
  }

  agents.sort((a, b) => b.score - a.score)
  const top = agents[0]
  const bot = agents[agents.length - 1]
  const byVol = [...agents].sort((a, b) => b.assigned - a.assigned)[0]
  const bestCsat = [...agents].filter(a => a.avgCsat > 0).sort((a, b) => b.avgCsat - a.avgCsat)[0]
  const worstCsat = [...agents].filter(a => a.avgCsat > 0).sort((a, b) => a.avgCsat - b.avgCsat)[0]
  const mostEscal = [...agents].sort((a, b) => b.escalations - a.escalations)[0]
  const fastFrt = [...agents].filter(a => a.avgFrt > 0).sort((a, b) => a.avgFrt - b.avgFrt)[0]
  const slowRt = [...agents].filter(a => a.avgRt > 0).sort((a, b) => b.avgRt - a.avgRt)[0]
  const worstSla = [...agents].filter(a => a.slaRate > 0).sort((a, b) => a.slaRate - b.slaRate)[0]
  const { targets } = settings

  const insights = [
    { icon: '🏆', bg: 'bg-amber-50 dark:bg-amber-900/20', title: 'Top Performer', text: `<strong>${top.agent}</strong> leads with a score of <strong>${top.score}/100</strong> and ${top.resolved} resolved tickets.` },
    { icon: '📉', bg: 'bg-red-50 dark:bg-red-900/20', title: 'Needs Coaching', text: `<strong>${bot.agent}</strong> scored <strong>${bot.score}/100</strong>. Schedule a performance coaching session.` },
    { icon: '🎫', bg: 'bg-blue-50 dark:bg-blue-900/20', title: 'Highest Volume', text: `<strong>${byVol.agent}</strong> handled the most tickets: <strong>${byVol.assigned}</strong>. Monitor for potential burnout.` },
    ...(bestCsat ? [{ icon: '😁', bg: 'bg-emerald-50 dark:bg-emerald-900/20', title: 'Best CSAT', text: `<strong>${bestCsat.agent}</strong> achieved <strong>${bestCsat.avgCsat.toFixed(1)}%</strong> customer satisfaction.` }] : []),
    ...(worstCsat && worstCsat !== bestCsat ? [{ icon: '😟', bg: 'bg-pink-50 dark:bg-pink-900/20', title: 'Low CSAT Alert', text: `<strong>${worstCsat.agent}</strong> CSAT: <strong>${worstCsat.avgCsat.toFixed(1)}%</strong>. Initiate quality coaching.` }] : []),
    ...(mostEscal?.escalations > 0 ? [{ icon: '🚨', bg: 'bg-red-50 dark:bg-red-900/20', title: 'Most Escalations', text: `<strong>${mostEscal.agent}</strong> — <strong>${mostEscal.escalations}</strong> escalations. Investigate root causes.` }] : []),
    ...(fastFrt ? [{ icon: '⚡', bg: 'bg-purple-50 dark:bg-purple-900/20', title: 'Fastest Responder', text: `<strong>${fastFrt.agent}</strong> avg FRT: <strong>${fastFrt.avgFrt.toFixed(1)}h</strong>.` }] : []),
    ...(slowRt ? [{ icon: '⏳', bg: 'bg-amber-50 dark:bg-amber-900/20', title: 'Slow Resolution', text: `<strong>${slowRt.agent}</strong> avg resolution: <strong>${slowRt.avgRt.toFixed(1)}h</strong>.` }] : []),
    ...(worstSla ? [{ icon: '📏', bg: 'bg-orange-50 dark:bg-orange-900/20', title: 'SLA Risk', text: `<strong>${worstSla.agent}</strong> SLA: <strong>${worstSla.slaRate.toFixed(0)}%</strong>. Target: ${targets.sla}%.` }] : []),
  ]

  const recommendations = []
  if (m.avgCsat < targets.csat) recommendations.push({ icon: '💬', bg: 'bg-red-50 dark:bg-red-900/20', title: 'Action: Improve CSAT', text: `Team CSAT (${m.avgCsat.toFixed(1)}%) is below target (${targets.csat}%). Run quality improvement workshops.` })
  if (m.slaRate < targets.sla) recommendations.push({ icon: '📋', bg: 'bg-amber-50 dark:bg-amber-900/20', title: 'Action: SLA Recovery', text: `SLA compliance (${m.slaRate.toFixed(1)}%) is below target (${targets.sla}%). Review ticket workflows.` })
  if (m.escalations > 5) recommendations.push({ icon: '🚨', bg: 'bg-red-50 dark:bg-red-900/20', title: 'Escalation Review', text: `${m.escalations} escalations detected. Add agent training and review escalation triggers.` })
  if (m.reopenRate > targets.reopen) recommendations.push({ icon: '🔄', bg: 'bg-pink-50 dark:bg-pink-900/20', title: 'High Reopen Rate', text: `Reopen rate (${m.reopenRate.toFixed(1)}%) exceeds target (${targets.reopen}%). Focus on first-contact resolution.` })
  recommendations.push({ icon: '🌟', bg: 'bg-emerald-50 dark:bg-emerald-900/20', title: 'Recognize Top Performer', text: `Share ${top.agent}'s best practices team-wide. Score: ${top.score}/100.` })

  return (
    <div>
      <h1 className="text-2xl font-extrabold mb-1">AI Insights</h1>
      <p className="text-gray-500 text-sm mb-6">Auto-generated from {agents.length} agents · {m.total.toLocaleString()} tickets</p>
      <div className="mb-2 text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
        <span>🔍 Performance Insights</span><div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {insights.map((ins, i) => <InsightCard key={i} {...ins} />)}
      </div>
      <div className="mb-2 text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
        <span>💡 Recommendations</span><div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {recommendations.map((r, i) => <InsightCard key={i} {...r} />)}
      </div>
    </div>
  )
}
