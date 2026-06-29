import { motion } from 'framer-motion'
import { useApp } from '../context/AppContext'
import { MdOpenInNew } from 'react-icons/md'

const FD_BASE = 'https://razorpayx.freshdesk.com'

interface InsightCardProps {
  icon: string
  bg: string
  title: string
  text: string
  tickets?: number[]
  explanation?: string
}

function InsightCard({ icon, bg, title, text, tickets, explanation }: InsightCardProps) {
  const ticketUrl = (tid: number) => FD_BASE + '/a/tickets/' + String(tid)
  return (
    <motion.div
      style={{ background: '#0a1628', border: '1px solid #0d2147', borderRadius: 14, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
    >
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, background: bg }}>{icon}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#93c5fd', marginBottom: 4 }}>{title}</div>
          <p style={{ fontSize: 12, color: '#3b82f6', lineHeight: 1.5 }} dangerouslySetInnerHTML={{ __html: text }} />
        </div>
      </div>
      {explanation && (
        <div style={{ background: '#040a14', border: '1px solid #0d2147', borderRadius: 8, padding: '8px 12px', fontSize: 11, color: '#1e40af', lineHeight: 1.6 }}>
          <span style={{ color: '#3b82f6', fontWeight: 600 }}>How calculated: </span>{explanation}
        </div>
      )}
      {tickets && tickets.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 4 }}>
          <span style={{ fontSize: 11, color: '#1e40af', fontWeight: 600, width: '100%' }}>Impacted tickets:</span>
          {tickets.slice(0, 8).map(tid => (
            <a key={tid} href={ticketUrl(tid)} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, background: '#1e3a8a', color: '#60a5fa', border: '1px solid #1e40af', padding: '2px 8px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 3, textDecoration: 'none' }}>
              {'#' + String(tid)}
              <MdOpenInNew style={{ width: 10, height: 10 }} />
            </a>
          ))}
          {tickets.length > 8 && <span style={{ fontSize: 11, color: '#1e40af' }}>{'+ ' + String(tickets.length - 8) + ' more'}</span>}
        </div>
      )}
    </motion.div>
  )
}

export function InsightsPage() {
  const { state } = useApp()
  const { agentStats, globalMetrics: m, settings, filteredTickets } = state

  const agents = Object.values(agentStats)
  if (!agents.length || !m) {
    return (
      <div style={{ textAlign: 'center', padding: '64px 24px', color: '#1e40af' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>💡</div>
        <div style={{ fontWeight: 600, fontSize: 18, color: '#60a5fa' }}>No insights yet</div>
        <div style={{ fontSize: 14, marginTop: 8 }}>Upload data or click Sync Now to generate insights.</div>
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

  const escalatedTickets = filteredTickets.filter(t => t.isEscalated).map(t => Number(t.id)).filter(Boolean).slice(0, 20)
  const slaBreachedTickets = filteredTickets.filter(t => t.slaStatus.toLowerCase().includes('breach') || t.slaStatus.toLowerCase() === 'false' || t.slaStatus.toLowerCase() === 'no').map(t => Number(t.id)).filter(Boolean).slice(0, 20)
  const reopenedTickets = filteredTickets.filter(t => t.isReopened).map(t => Number(t.id)).filter(Boolean).slice(0, 20)

  const groupMap: Record<string, number> = {}
  filteredTickets.forEach(t => { if (t.group) groupMap[t.group] = (groupMap[t.group] || 0) + 1 })
  const topGroup = Object.entries(groupMap).sort((a, b) => b[1] - a[1])[0]

  const s = (val: string | number) => String(val)

  const insights = [
    { icon: '🏆', bg: '#1a3a0a', title: 'Top Performer', text: '<strong style="color:#4ade80">' + top.agent + '</strong> leads with score <strong style="color:#4ade80">' + s(top.score) + '/100</strong> and ' + s(top.resolved) + ' tickets resolved.', explanation: 'Score = CSAT (30%) + Quality (25%) + SLA (20%) + FRT (10%) + Resolution Time (10%) + Escalations (5%).' },
    { icon: '📉', bg: '#3a0a0a', title: 'Needs Coaching', text: '<strong style="color:#f87171">' + bot.agent + '</strong> scored <strong style="color:#f87171">' + s(bot.score) + '/100</strong>. Schedule a performance coaching session.', explanation: 'Key areas: CSAT ' + bot.avgCsat.toFixed(0) + '%, SLA ' + bot.slaRate.toFixed(0) + '%, Avg FRT ' + bot.avgFrt.toFixed(1) + 'h.' },
    { icon: '🎫', bg: '#0a1a3a', title: 'Highest Volume', text: '<strong style="color:#60a5fa">' + byVol.agent + '</strong> handled <strong style="color:#60a5fa">' + s(byVol.assigned) + '</strong> tickets — monitor for burnout.', explanation: 'Total tickets assigned to this agent in the selected date range.' },
    ...(topGroup ? [{ icon: '👥', bg: '#1a0a3a', title: 'Busiest Group', text: '<strong style="color:#a78bfa">' + topGroup[0] + '</strong> handled <strong style="color:#a78bfa">' + s(topGroup[1]) + '</strong> tickets.', explanation: 'Total tickets assigned to this group in the filtered date range.' }] : []),
    ...(bestCsat ? [{ icon: '😁', bg: '#0a3a1a', title: 'Best CSAT', text: '<strong style="color:#34d399">' + bestCsat.agent + '</strong> achieved <strong style="color:#34d399">' + bestCsat.avgCsat.toFixed(1) + '%</strong> CSAT.', explanation: 'CSAT = average of all survey scores. Satisfied=100%, Neutral=60%, Dissatisfied=0%.' }] : []),
    ...(worstCsat && worstCsat !== bestCsat ? [{ icon: '😟', bg: '#3a1a0a', title: 'Low CSAT Alert', text: '<strong style="color:#fb923c">' + worstCsat.agent + '</strong> CSAT: <strong style="color:#fb923c">' + worstCsat.avgCsat.toFixed(1) + '%</strong>. Initiate quality coaching.', explanation: 'Upload latest CSAT report using the Upload CSAT button for accurate scores.' }] : []),
    ...(mostEscal?.escalations > 0 ? [{ icon: '🚨', bg: '#3a0a0a', title: 'Most Escalations', text: '<strong style="color:#f87171">' + mostEscal.agent + '</strong> had <strong style="color:#f87171">' + s(mostEscal.escalations) + '</strong> escalations.', explanation: 'Escalations = tickets marked is_escalated=true in Freshdesk. Triggered by: (1) SLA breach, (2) Agent manually escalates, (3) Supervisor escalates.', tickets: escalatedTickets }] : []),
    ...(fastFrt ? [{ icon: '⚡', bg: '#1a0a3a', title: 'Fastest Responder', text: '<strong style="color:#a78bfa">' + fastFrt.agent + '</strong> avg FRT: <strong style="color:#a78bfa">' + fastFrt.avgFrt.toFixed(1) + 'h</strong>.', explanation: 'FRT = time between ticket creation and first agent reply.' }] : []),
    ...(slowRt ? [{ icon: '⏳', bg: '#3a2a0a', title: 'Slow Resolution', text: '<strong style="color:#fbbf24">' + slowRt.agent + '</strong> avg resolution: <strong style="color:#fbbf24">' + slowRt.avgRt.toFixed(1) + 'h</strong>.', explanation: 'Resolution time = ticket creation to Resolved/Closed status.' }] : []),
    ...(worstSla ? [{ icon: '📏', bg: '#3a2a0a', title: 'SLA Risk', text: '<strong style="color:#fbbf24">' + worstSla.agent + '</strong> SLA: <strong style="color:#fbbf24">' + worstSla.slaRate.toFixed(0) + '%</strong>. Target: ' + s(targets.sla) + '%.', explanation: 'SLA % = tickets resolved within SLA deadline / total tickets.', tickets: slaBreachedTickets }] : []),
  ]

  const recommendations = [
    ...(m.avgCsat < targets.csat ? [{ icon: '💬', bg: '#3a0a0a', title: 'Action: Improve CSAT', text: 'Team CSAT (' + m.avgCsat.toFixed(1) + '%) is below target (' + s(targets.csat) + '%). Run quality workshops.', explanation: 'Upload your CSAT CSV report using the Upload CSAT button to see accurate scores.' }] : []),
    ...(m.slaRate < targets.sla ? [{ icon: '📋', bg: '#3a2a0a', title: 'Action: SLA Recovery', text: 'SLA (' + m.slaRate.toFixed(1) + '%) is below target (' + s(targets.sla) + '%). Review workflows.', explanation: 'Check ticket routing rules and response time agreements per group.', tickets: slaBreachedTickets }] : []),
    ...(m.escalations > 0 ? [{ icon: '🚨', bg: '#3a0a0a', title: 'Escalation Review', text: s(m.escalations) + ' escalations detected. Add agent training and review escalation triggers.', explanation: 'Escalation Review fires when any ticket has is_escalated=true. This happens when: (1) SLA is breached, (2) Agent manually escalates via Freshdesk, (3) Supervisor escalates from ticket view. Click ticket links below to investigate each case directly in Freshdesk.', tickets: escalatedTickets }] : []),
    ...(m.reopenRate > targets.reopen ? [{ icon: '🔄', bg: '#3a0a0a', title: 'High Reopen Rate', text: 'Reopen rate (' + m.reopenRate.toFixed(1) + '%) exceeds target (' + s(targets.reopen) + '%). Focus on FCR.', explanation: 'A ticket is reopened when status changes from Resolved/Closed back to Open.', tickets: reopenedTickets }] : []),
    { icon: '🌟', bg: '#0a3a1a', title: 'Recognize Top Performer', text: 'Share ' + top.agent + ' best practices team-wide. Score: ' + s(top.score) + '/100.', explanation: 'Recognition boosts team morale. Consider a public shoutout in your team Slack channel.' },
  ]

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 4 }}>AI Insights</h1>
      <p style={{ fontSize: 14, color: '#3b82f6', marginBottom: 24 }}>
        {'Auto-generated from ' + s(agents.length) + ' agents · ' + m.total.toLocaleString() + ' tickets'}
      </p>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#1e40af', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <span>🔍 Performance Insights</span>
        <div style={{ flex: 1, height: 1, background: '#0d2147' }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14, marginBottom: 24 }}>
        {insights.map((ins, i) => <InsightCard key={i} {...ins} />)}
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#1e40af', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <span>💡 Recommendations</span>
        <div style={{ flex: 1, height: 1, background: '#0d2147' }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
        {recommendations.map((r, i) => <InsightCard key={i} {...r} />)}
      </div>
    </div>
  )
}
