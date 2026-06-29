import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { MdOpenInNew, MdClose } from 'react-icons/md'

const FD_BASE = 'https://razorpayx.freshdesk.com'

interface TicketModalProps {
  title: string
  tickets: number[]
  onClose: () => void
}

function TicketModal({ title, tickets, onClose }: TicketModalProps) {
  const { state } = useApp()
  const ticketDetails = tickets.map(id => {
    const t = state.filteredTickets.find(t => Number(t.id) === id)
    return { id, agent: t?.agent || '—', group: t?.group || '—', status: t?.status || '—', priority: t?.priority || '—', createdAt: t?.createdAt || null }
  })

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={onClose}
    >
      <div style={{ background: '#0a1628', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, width: '100%', maxWidth: 820, maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#fff' }}>{title}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{tickets.length} tickets — click ticket number to open in Freshdesk</div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: 6, cursor: 'pointer', color: 'rgba(255,255,255,0.6)' }}>
            <MdClose className="w-4 h-4" />
          </button>
        </div>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead style={{ position: 'sticky', top: 0, background: '#040a14', zIndex: 1 }}>
              <tr>
                {['Ticket #', 'Agent', 'Group', 'Status', 'Priority', 'Created'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ticketDetails.map((t, i) => (
                <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '9px 14px' }}>
                    <a href={FD_BASE + '/a/tickets/' + t.id} target="_blank" rel="noopener noreferrer"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#60a5fa', fontWeight: 700, textDecoration: 'none', background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.2)', padding: '3px 8px', borderRadius: 6 }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(96,165,250,0.2)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'rgba(96,165,250,0.1)')}
                    >
                      {'#' + t.id} <MdOpenInNew style={{ width: 10, height: 10 }} />
                    </a>
                  </td>
                  <td style={{ padding: '9px 14px', color: '#93c5fd' }}>{t.agent}</td>
                  <td style={{ padding: '9px 14px', color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>{t.group}</td>
                  <td style={{ padding: '9px 14px' }}>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: t.status.toLowerCase().includes('open') ? 'rgba(249,115,22,0.15)' : 'rgba(96,165,250,0.1)', color: t.status.toLowerCase().includes('open') ? '#f97316' : '#60a5fa' }}>
                      {t.status}
                    </span>
                  </td>
                  <td style={{ padding: '9px 14px' }}>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: t.priority.toLowerCase() === 'urgent' ? 'rgba(239,68,68,0.15)' : t.priority.toLowerCase() === 'high' ? 'rgba(249,115,22,0.15)' : 'rgba(96,165,250,0.1)', color: t.priority.toLowerCase() === 'urgent' ? '#ef4444' : t.priority.toLowerCase() === 'high' ? '#f97316' : '#60a5fa' }}>
                      {t.priority}
                    </span>
                  </td>
                  <td style={{ padding: '9px 14px', color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>
                    {t.createdAt ? t.createdAt.toLocaleDateString('en-IN') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

interface InsightCardProps {
  icon: string
  title: string
  text: string
  tickets?: number[]
  explanation?: string
  accent: string
}

function InsightCard({ icon, title, text, tickets, explanation, accent }: InsightCardProps) {
  const [showModal, setShowModal] = useState(false)
  const s = (val: string | number) => String(val)

  return (
    <>
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderLeft: '3px solid ' + accent, borderRadius: 12, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>{icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#fff', marginBottom: 5 }}>{title}</div>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6, margin: 0 }} dangerouslySetInnerHTML={{ __html: text }} />
          </div>
        </div>
        {explanation && (
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', lineHeight: 1.6, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 8 }}>
            <span style={{ color: accent, fontWeight: 600 }}>How calculated: </span>{explanation}
          </div>
        )}
        {tickets && tickets.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', width: '100%' }}>
              Impacted tickets: <span style={{ color: accent }}>{tickets.length} total</span>
            </span>
            {tickets.slice(0, 6).map(tid => (
              <a key={tid} href={FD_BASE + '/a/tickets/' + s(tid)} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 11, color: accent, border: '1px solid ' + accent + '44', padding: '2px 8px', borderRadius: 5, display: 'inline-flex', alignItems: 'center', gap: 3, textDecoration: 'none', background: accent + '11' }}
                onMouseEnter={e => (e.currentTarget.style.background = accent + '22')}
                onMouseLeave={e => (e.currentTarget.style.background = accent + '11')}
              >
                {'#' + s(tid)} <MdOpenInNew style={{ width: 10, height: 10 }} />
              </a>
            ))}
            {tickets.length > 6 && (
              <button
                onClick={() => setShowModal(true)}
                style={{ fontSize: 11, color: accent, border: '1px solid ' + accent + '44', padding: '2px 10px', borderRadius: 5, background: accent + '11', cursor: 'pointer', fontWeight: 600 }}
                onMouseEnter={e => (e.currentTarget.style.background = accent + '22')}
                onMouseLeave={e => (e.currentTarget.style.background = accent + '11')}
              >
                +{tickets.length - 6} more — view all
              </button>
            )}
          </div>
        )}
      </div>
      {showModal && tickets && (
        <TicketModal title={title} tickets={tickets} onClose={() => setShowModal(false)} />
      )}
    </>
  )
}

export function InsightsPage() {
  const { state } = useApp()
  const { agentStats, globalMetrics: m, settings, filteredTickets } = state
  const agents = Object.values(agentStats)
  const s = (val: string | number) => String(val)

  if (!agents.length || !m) {
    return (
      <div style={{ textAlign: 'center', padding: '64px 24px' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>💡</div>
        <div style={{ fontWeight: 600, fontSize: 18, color: '#60a5fa' }}>No insights yet</div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)', marginTop: 8 }}>Click Sync Now to generate insights.</div>
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

  const escalatedTickets = filteredTickets.filter(t => t.isEscalated).map(t => Number(t.id)).filter(Boolean)
  const slaBreachedTickets = filteredTickets.filter(t => t.slaStatus.toLowerCase().includes('breach') || t.slaStatus.toLowerCase() === 'false').map(t => Number(t.id)).filter(Boolean)
  const reopenedTickets = filteredTickets.filter(t => t.isReopened).map(t => Number(t.id)).filter(Boolean)

  const groupMap: Record<string, number> = {}
  filteredTickets.forEach(t => { if (t.group) groupMap[t.group] = (groupMap[t.group] || 0) + 1 })
  const topGroup = Object.entries(groupMap).sort((a, b) => b[1] - a[1])[0]

  const insights = [
    { icon: '🏆', accent: '#22c55e', title: 'Top Performer', text: '<strong style="color:#4ade80">' + top.agent + '</strong> leads with score <strong style="color:#4ade80">' + s(top.score) + '/100</strong> — ' + s(top.resolved) + ' tickets resolved.', explanation: 'Score = CSAT (30%) + Quality (25%) + SLA (20%) + FRT (10%) + Resolution Time (10%) + Escalations (5%).' },
    { icon: '📉', accent: '#ef4444', title: 'Needs Coaching', text: '<strong style="color:#f87171">' + bot.agent + '</strong> scored <strong style="color:#f87171">' + s(bot.score) + '/100</strong>. Schedule a coaching session.', explanation: 'CSAT ' + bot.avgCsat.toFixed(0) + '%, SLA ' + bot.slaRate.toFixed(0) + '%, Avg FRT ' + bot.avgFrt.toFixed(1) + 'h.' },
    { icon: '🎫', accent: '#3b82f6', title: 'Highest Volume', text: '<strong style="color:#60a5fa">' + byVol.agent + '</strong> handled <strong style="color:#60a5fa">' + s(byVol.assigned) + '</strong> tickets — monitor for burnout.', explanation: 'Total tickets assigned in selected date range.' },
    ...(topGroup ? [{ icon: '👥', accent: '#a78bfa', title: 'Busiest Group', text: '<strong style="color:#a78bfa">' + topGroup[0] + '</strong> handled <strong style="color:#a78bfa">' + s(topGroup[1]) + '</strong> tickets.', explanation: 'Total tickets assigned to this group.' }] : []),
    ...(bestCsat ? [{ icon: '😊', accent: '#22c55e', title: 'Best CSAT', text: '<strong style="color:#4ade80">' + bestCsat.agent + '</strong> achieved <strong style="color:#4ade80">' + bestCsat.avgCsat.toFixed(1) + '%</strong> CSAT.', explanation: 'Satisfied=100%, Neutral=60%, Dissatisfied=0%.' }] : []),
    ...(worstCsat && worstCsat !== bestCsat ? [{ icon: '😟', accent: '#f97316', title: 'Low CSAT Alert', text: '<strong style="color:#fb923c">' + worstCsat.agent + '</strong> CSAT: <strong style="color:#fb923c">' + worstCsat.avgCsat.toFixed(1) + '%</strong>. Initiate coaching.', explanation: 'Upload latest CSAT using the Upload CSAT button.' }] : []),
    ...(mostEscal?.escalations > 0 ? [{ icon: '🚨', accent: '#ef4444', title: 'Most Escalations', text: '<strong style="color:#f87171">' + mostEscal.agent + '</strong> — <strong style="color:#f87171">' + s(mostEscal.escalations) + '</strong> escalations.', explanation: 'Tickets marked is_escalated=true.', tickets: escalatedTickets }] : []),
    ...(fastFrt ? [{ icon: '⚡', accent: '#a78bfa', title: 'Fastest Responder', text: '<strong style="color:#c4b5fd">' + fastFrt.agent + '</strong> avg FRT: <strong style="color:#c4b5fd">' + fastFrt.avgFrt.toFixed(1) + 'h</strong>.', explanation: 'Time between ticket creation and first reply.' }] : []),
    ...(slowRt ? [{ icon: '⏳', accent: '#f59e0b', title: 'Slow Resolution', text: '<strong style="color:#fcd34d">' + slowRt.agent + '</strong> avg resolution: <strong style="color:#fcd34d">' + slowRt.avgRt.toFixed(1) + 'h</strong>.', explanation: 'Ticket creation to Resolved/Closed.' }] : []),
    ...(worstSla ? [{ icon: '📏', accent: '#f59e0b', title: 'SLA Risk', text: '<strong style="color:#fcd34d">' + worstSla.agent + '</strong> SLA: <strong style="color:#fcd34d">' + worstSla.slaRate.toFixed(0) + '%</strong>. Target: ' + s(targets.sla) + '%.', explanation: 'Tickets resolved within SLA deadline / total.', tickets: slaBreachedTickets }] : []),
  ]

  const recommendations = [
    ...(m.avgCsat < targets.csat ? [{ icon: '💬', accent: '#ef4444', title: 'Improve CSAT', text: 'Team CSAT (' + m.avgCsat.toFixed(1) + '%) below target (' + s(targets.csat) + '%). Run quality workshops.', explanation: 'Upload CSAT CSV using the Upload CSAT button.' }] : []),
    ...(m.slaRate < targets.sla ? [{ icon: '📋', accent: '#f59e0b', title: 'SLA Recovery', text: 'SLA (' + m.slaRate.toFixed(1) + '%) below target (' + s(targets.sla) + '%). Review workflows.', explanation: 'Check ticket routing per group.', tickets: slaBreachedTickets }] : []),
    ...(m.escalations > 0 ? [{ icon: '🚨', accent: '#ef4444', title: 'Escalation Review', text: s(m.escalations) + ' escalations detected. Add agent training.', explanation: '(1) SLA breach, (2) Agent escalates, (3) Supervisor escalates.', tickets: escalatedTickets }] : []),
    ...(m.reopenRate > targets.reopen ? [{ icon: '🔄', accent: '#ef4444', title: 'High Reopen Rate', text: 'Reopen rate (' + m.reopenRate.toFixed(1) + '%) exceeds target (' + s(targets.reopen) + '%).', explanation: 'Status changed from Resolved back to Open.', tickets: reopenedTickets }] : []),
    { icon: '🌟', accent: '#22c55e', title: 'Recognize Top Performer', text: 'Share ' + top.agent + ' best practices team-wide. Score: ' + s(top.score) + '/100.', explanation: 'Consider a Slack shoutout.' },
  ]

  const divider = (title: string) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '8px 0 16px' }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{title}</span>
      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
    </div>
  )

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 4 }}>AI Insights</h1>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginBottom: 24 }}>
        {s(agents.length) + ' agents · ' + m.total.toLocaleString() + ' tickets'}
      </p>
      {divider('Performance Insights')}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12, marginBottom: 28 }}>
        {insights.map((ins, i) => <InsightCard key={i} {...ins} />)}
      </div>
      {divider('Recommendations')}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
        {recommendations.map((r, i) => <InsightCard key={i} {...r} />)}
      </div>
    </div>
  )
}
