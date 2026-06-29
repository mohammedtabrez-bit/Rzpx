import { useState, useEffect, useCallback } from 'react'
import { useApp } from '../context/AppContext'

const DOMAIN = (import.meta as any).env.VITE_FRESHDESK_DOMAIN
const API_KEY = (import.meta as any).env.VITE_FRESHDESK_API_KEY
const SYNC_TIMES = ['08:00', '14:00', '20:00']

const GROUP_MAP: Record<number, string> = {
  82000659804: 'Enterprise Support',
  82000494121: 'Operations',
  82000661633: 'CXO Desk',
  82000494119: 'Support',
  82000494122: 'X-Downtime',
  82000661205: 'Banking Ops',
  82000658304: 'XPayroll Enterprise',
  82000658305: 'XPayroll Support',
  82000660633: 'Xpayroll Operations',
}

const ALLOWED_GROUPS = new Set([
  'Enterprise Support',
  'Operations',
  'CXO Desk',
  'Support',
  'X-Downtime',
  'Banking Ops',
  'XPayroll Enterprise',
  'XPayroll Support',
  'Xpayroll Operations',
])

const AGENT_MAP: Record<number, string> = {}
const ACTIVE_AGENTS = new Set<number>()

export function useFreshdeskSync() {
  const { dispatch } = useApp()
  const [syncing, setSyncing] = useState(false)
  const [lastSync, setLastSync] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchAgents = useCallback(async (headers: Record<string, string>) => {
    try {
      let agentPage = 1
      while (agentPage <= 10) {
        const res = await fetch(
          'https://' + DOMAIN + '/api/v2/agents?per_page=100&page=' + agentPage,
          { headers }
        )
        if (!res.ok) break
        const agents = await res.json()
        if (!agents.length) break
        agents.forEach((a: any) => {
          const name = a.contact?.name || a.name || null
          if (name && a.id) {
            AGENT_MAP[a.id] = name
            if (a.active !== false) ACTIVE_AGENTS.add(a.id)
          }
        })
        if (agents.length < 100) break
        agentPage++
      }
    } catch { /* silent */ }
  }, [])

  const fetchCsat = useCallback(async (headers: Record<string, string>): Promise<Record<number, number>> => {
    const csatMap: Record<number, number> = {}
    try {
      let page = 1
      while (page <= 50) {
        const res = await fetch(
          'https://' + DOMAIN + '/api/v2/surveys/satisfaction_ratings?per_page=100&page=' + page,
          { headers }
        )
        if (!res.ok) break
        const data = await res.json()
        if (!data.length) break
        data.forEach((r: any) => {
          const rating = r.ratings?.default_question
          const ticketId = r.ticket_id
          if (ticketId && rating !== undefined) {
            csatMap[Number(ticketId)] = rating > 0 ? 100 : 0
          }
        })
        if (data.length < 100) break
        page++
      }
    } catch { /* silent */ }
    return csatMap
  }, [])

  const fetchTickets = useCallback(async () => {
    if (!DOMAIN || !API_KEY) return
    setSyncing(true)
    setError(null)
    try {
      const creds = btoa(API_KEY + ':X')
      const headers = { 'Authorization': 'Basic ' + creds }

      await fetchAgents(headers)
      const csatMap = await fetchCsat(headers)

      let page = 1
      let allTickets: Record<string, unknown>[] = []
      while (true) {
        const res = await fetch(
          'https://' + DOMAIN + '/api/v2/tickets?per_page=100&page=' + page + '&include=stats',
          { headers }
        )
        if (!res.ok) throw new Error('Freshdesk API error: ' + res.status)
        const data = await res.json()
        if (!data.length) break
        allTickets = [...allTickets, ...data]
        if (data.length < 100) break
        page++
        if (page > 100) break
      }

      if (allTickets.length) {
        const mapped = allTickets
          .map((t: any) => {
            const groupName = GROUP_MAP[t.group_id] || ''
            const agentName = AGENT_MAP[t.responder_id] || ''
            const isActive = ACTIVE_AGENTS.has(t.responder_id)
            const csatScore = csatMap[Number(t.id)]
            return {
              'Ticket ID': t.id,
              'Agent': agentName || (t.responder_id ? 'Agent_' + t.responder_id : 'Unassigned'),
              'Agent Active': isActive ? 'true' : 'false',
              'Status': getStatus(t.status),
              'Priority': getPriority(t.priority),
              'Group': groupName || 'Other',
              'Created At': t.created_at,
              'Resolved At': t.stats?.resolved_at || '',
              'First Response Time': t.stats?.first_responded_at || '',
              'CSAT': csatScore !== undefined ? csatScore : '',
              'SLA': t.nr_escalated === false ? 'Met' : t.nr_escalated === true ? 'Breached' : '',
              'Requester': t.requester_id,
              'Tags': Array.isArray(t.tags) ? t.tags.join(',') : '',
              'Is Escalated': t.nr_escalated ? 'true' : 'false',
              'Group ID': t.group_id,
            }
          })
          .filter((t: any) => ALLOWED_GROUPS.has(t['Group']))

        dispatch({
          type: 'SET_RAW_DATA',
          payload: {
            raw: mapped as any,
            name: 'freshdesk-sync-' + new Date().toISOString().slice(0, 10) + '.json'
          }
        })
        setLastSync(new Date())
        localStorage.setItem('fd_csat_last_upload', new Date().toISOString())
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed')
    } finally {
      setSyncing(false)
    }
  }, [dispatch, fetchAgents, fetchCsat])

  useEffect(() => {
    if (!DOMAIN || !API_KEY) return
    fetchTickets()
    const interval = setInterval(() => {
      const now = new Date()
      const timeStr = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0')
      if (SYNC_TIMES.includes(timeStr)) fetchTickets()
    }, 60000)
    return () => clearInterval(interval)
  }, [fetchTickets])

  return { syncing, lastSync, error, fetchTickets }
}

function getStatus(s: number) {
  const map: Record<number, string> = { 2: 'Open', 3: 'Pending', 4: 'Resolved', 5: 'Closed' }
  return map[s] || 'Open'
}

function getPriority(p: number) {
  const map: Record<number, string> = { 1: 'Low', 2: 'Medium', 3: 'High', 4: 'Urgent' }
  return map[p] || 'Medium'
}
