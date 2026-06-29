import { mapColumns } from './columnMapper'
import type { RawTicket, MappedTicket, AgentStats, DashboardSettings, GlobalMetrics } from '../types'

export function processTickets(
  rawData: RawTicket[],
  overrides: Record<string, string> = {}
): { tickets: MappedTicket[], colMap: Record<string, string> } {
  if (!rawData.length) return { tickets: [], colMap: {} }
  const colMap = mapColumns(Object.keys(rawData[0]), overrides)

  const tickets: MappedTicket[] = rawData.map((row, i) => ({
    id: String(row[colMap.id] ?? i),
    agent: String(row[colMap.agent] ?? 'Unknown').trim() || 'Unknown',
    status: String(row[colMap.status] ?? ''),
    priority: String(row[colMap.priority] ?? ''),
    group: String(row[colMap.group] ?? ''),
    product: String(row[colMap.product] ?? ''),
    tags: String(row[colMap.tags] ?? ''),
    createdAt: parseDate(row[colMap.created]),
    resolvedAt: parseDate(row[colMap.resolved]),
    frtHours: parseHours(row[colMap.frt]),
    resolutionHours: parseHours(row[colMap.resolutionTime]),
    csat: parseCsat(row[colMap.csat]),
    slaStatus: String(row[colMap.sla] ?? ''),
    isReopened: isTruthy(row[colMap.reopened]),
    isEscalated: isTruthy(row[colMap.escalated]),
    requester: String(row[colMap.requester] ?? ''),
  }))

  return { tickets, colMap }
}

export function buildAgentStats(tickets: MappedTicket[], settings: DashboardSettings): Record<string, AgentStats> {
  const stats: Record<string, AgentStats> = {}

  for (const t of tickets) {
    const agent = t.agent || 'Unknown'
    if (!stats[agent]) {
      stats[agent] = {
        agent, group: t.group, assigned: 0, resolved: 0, pending: 0, open: 0,
        avgFrt: 0, avgRt: 0, avgCsat: 0, slaRate: 0, resolutionRate: 0,
        reopens: 0, reopenRate: 0, escalations: 0, score: 0,
        dailyCounts: {}, monthlyCounts: {},
      }
    }
    const s = stats[agent]
    s.assigned++

    const status = t.status.toLowerCase()
    if (status.includes('resolved') || status.includes('closed')) s.resolved++
    else if (status.includes('pending')) s.pending++
    else s.open++

    if (t.isReopened) s.reopens++
    if (t.isEscalated) s.escalations++

    if (t.createdAt) {
      const dk = formatDate(t.createdAt)
      const mk = t.createdAt.getFullYear() + '-' + String(t.createdAt.getMonth() + 1).padStart(2, '0')
      s.dailyCounts[dk] = (s.dailyCounts[dk] || 0) + 1
      s.monthlyCounts[mk] = (s.monthlyCounts[mk] || 0) + 1
    }
  }

  // Compute averages using separate passes to avoid floating point accumulation issues
  const frtMap: Record<string, { sum: number; cnt: number }> = {}
  const rtMap: Record<string, { sum: number; cnt: number }> = {}
  const csatMap: Record<string, { sum: number; cnt: number }> = {}
  const slaMap: Record<string, { met: number; total: number }> = {}

  for (const t of tickets) {
    const ag = t.agent || 'Unknown'
    if (!frtMap[ag]) { frtMap[ag] = { sum: 0, cnt: 0 }; rtMap[ag] = { sum: 0, cnt: 0 }; csatMap[ag] = { sum: 0, cnt: 0 }; slaMap[ag] = { met: 0, total: 0 } }
    if (t.frtHours > 0) { frtMap[ag].sum += t.frtHours; frtMap[ag].cnt++ }
    if (t.resolutionHours > 0) { rtMap[ag].sum += t.resolutionHours; rtMap[ag].cnt++ }
    if (t.csat !== null) { csatMap[ag].sum += t.csat; csatMap[ag].cnt++ }
    const sl = t.slaStatus.toLowerCase()
    if (sl) { slaMap[ag].total++; if (sl.includes('met') || sl.includes('yes') || sl === 'true' || sl === '1' || sl.includes('within')) slaMap[ag].met++ }
  }

  for (const [agent, s] of Object.entries(stats)) {
    s.avgFrt = frtMap[agent]?.cnt ? frtMap[agent].sum / frtMap[agent].cnt : 0
    s.avgRt = rtMap[agent]?.cnt ? rtMap[agent].sum / rtMap[agent].cnt : 0
    s.avgCsat = csatMap[agent]?.cnt ? csatMap[agent].sum / csatMap[agent].cnt : 0
    s.slaRate = slaMap[agent]?.total ? slaMap[agent].met / slaMap[agent].total * 100 : 0
    s.resolutionRate = s.assigned ? s.resolved / s.assigned * 100 : 0
    s.reopenRate = s.assigned ? s.reopens / s.assigned * 100 : 0
    s.score = calcScore(s, settings)
  }

  return stats
}

export function calcScore(s: Pick<AgentStats, 'avgCsat' | 'slaRate' | 'avgFrt' | 'avgRt' | 'escalations' | 'assigned'>, cfg: DashboardSettings): number {
  const { weights, targets } = cfg
  const total = Object.values(weights).reduce((a, b) => a + b, 0) || 100
  const csatS = targets.csat > 0 ? Math.min(100, (s.avgCsat / targets.csat) * 100) : 0
  const slaS = s.slaRate
  const frtS = targets.frt > 0 && s.avgFrt > 0 ? Math.min(100, (targets.frt / s.avgFrt) * 100) : s.avgFrt === 0 ? 80 : 0
  const rtS = targets.rt > 0 && s.avgRt > 0 ? Math.min(100, (targets.rt / s.avgRt) * 100) : s.avgRt === 0 ? 80 : 0
  const escalS = Math.max(0, 100 - (s.escalations / Math.max(1, s.assigned) * 500))
  const qualS = (csatS + slaS) / 2
  return Math.round(Math.min(100, Math.max(0,
    (csatS * weights.csat + qualS * weights.quality + slaS * weights.sla +
     frtS * weights.frt + rtS * weights.rt + escalS * weights.escalations) / total
  )))
}

export function calcGlobalMetrics(tickets: MappedTicket[], agentStats: Record<string, AgentStats>): GlobalMetrics {
  let resolved = 0, open = 0, pending = 0, reopens = 0, escalations = 0
  let frtSum = 0, frtCnt = 0, rtSum = 0, rtCnt = 0, csatSum = 0, csatCnt = 0, slaCount = 0, slaMet = 0
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const weekAgo = new Date(today); weekAgo.setDate(weekAgo.getDate() - 7)
  const monthStart = new Date(today); monthStart.setDate(1)
  let closedToday = 0, closedWeek = 0, closedMonth = 0

  for (const t of tickets) {
    const status = t.status.toLowerCase()
    if (status.includes('resolved') || status.includes('closed')) {
      resolved++
      const d = t.resolvedAt || t.createdAt
      if (d) {
        const dd = new Date(d); dd.setHours(0, 0, 0, 0)
        if (dd >= today) closedToday++
        if (dd >= weekAgo) closedWeek++
        if (dd >= monthStart) closedMonth++
      }
    } else if (status.includes('pending')) pending++
    else open++
    if (t.isReopened) reopens++
    if (t.isEscalated) escalations++
    if (t.frtHours > 0) { frtSum += t.frtHours; frtCnt++ }
    if (t.resolutionHours > 0) { rtSum += t.resolutionHours; rtCnt++ }
    if (t.csat !== null) { csatSum += t.csat; csatCnt++ }
    const sl = t.slaStatus.toLowerCase()
    if (sl) { slaCount++; if (sl.includes('met') || sl.includes('yes') || sl === 'true' || sl === '1' || sl.includes('within')) slaMet++ }
  }

  const agents = Object.values(agentStats)
  return {
    total: tickets.length, resolved, open, pending, backlog: open + pending,
    reopens, escalations,
    avgFrt: frtCnt ? frtSum / frtCnt : 0,
    avgRt: rtCnt ? rtSum / rtCnt : 0,
    avgCsat: csatCnt ? csatSum / csatCnt : 0,
    slaRate: slaCount ? slaMet / slaCount * 100 : 0,
    fcrRate: tickets.length ? resolved / tickets.length * 100 : 0,
    reopenRate: tickets.length ? reopens / tickets.length * 100 : 0,
    agentCount: agents.length,
    avgScore: agents.length ? agents.reduce((a, b) => a + b.score, 0) / agents.length : 0,
    closedToday, closedWeek, closedMonth,
  }
}

export function getScoreRating(score: number, thresholds: DashboardSettings['thresholds']): string {
  if (score >= thresholds.excellent) return 'Excellent'
  if (score >= thresholds.good) return 'Good'
  if (score >= thresholds.average) return 'Average'
  return 'Needs Improvement'
}

export function getScoreBadgeClass(score: number, thresholds: DashboardSettings['thresholds']): string {
  if (score >= thresholds.excellent) return 'score-excellent'
  if (score >= thresholds.good) return 'score-good'
  if (score >= thresholds.average) return 'score-average'
  return 'score-poor'
}

// ── Parsers ──────────────────────────────────────────────────────────────
export function parseDate(val: unknown): Date | null {
  if (!val) return null
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val
  const s = String(val).trim()
  if (!s) return null
  const d = new Date(s)
  return isNaN(d.getTime()) ? null : d
}

export function parseHours(val: unknown): number {
  if (val === null || val === undefined || val === '') return 0
  if (typeof val === 'number') return val
  const s = String(val).toLowerCase().trim()
  if (!s) return 0
  const hm = s.match(/(\d+)h\s*(\d*)m?/)
  if (hm) return parseInt(hm[1]) + (parseInt(hm[2] || '0') / 60)
  const col = s.match(/^(\d+):(\d+):?(\d*)$/)
  if (col) return parseInt(col[1]) + parseInt(col[2]) / 60 + (parseInt(col[3] || '0') / 3600)
  const n = parseFloat(s)
  if (!isNaN(n)) return n > 1000 ? n / 60 : n
  return 0
}

export function parseCsat(val: unknown): number | null {
  if (val === null || val === undefined || val === '') return null
  const s = String(val).toLowerCase().trim()
  if (!s || ['n/a', '-', 'nan', 'null', 'none'].includes(s)) return null
  if (s.includes('great') || s.includes('excellent') || s === '5' || s.includes('very satisfied')) return 100
  if (s.includes('good') || s.includes('satisfied') || s === '4') return 80
  if (s.includes('neutral') || s === '3' || s.includes('ok')) return 60
  if (s.includes('bad') || s.includes('dissatisfied') || s === '2' || s === '1') return 20
  const n = parseFloat(s.replace('%', ''))
  if (!isNaN(n)) { if (n >= 1 && n <= 5 && !s.includes('%')) return (n / 5) * 100; return n }
  return null
}

export function isTruthy(val: unknown): boolean {
  if (!val && val !== 0) return false
  const s = String(val).toLowerCase().trim()
  return s === '1' || s === 'true' || s === 'yes' || (typeof val === 'number' && val > 0)
}

export function formatDate(d: Date): string {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
}
