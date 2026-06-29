import { useState, useEffect, useCallback } from 'react'
import { useApp } from '../context/AppContext'

const DOMAIN = (import.meta as any).env.VITE_FRESHDESK_DOMAIN
const API_KEY = (import.meta as any).env.VITE_FRESHDESK_API_KEY
const SYNC_TIMES = ['08:00', '14:00', '20:00']

const GROUP_MAP: Record<number, string> = {
  82000661205: 'Banking Ops',
  82000663640: 'Capital Cards',
  82000663714: 'Cards Onboarding',
  82000657001: 'CSM Helpdesk',
  82000661633: 'CXO Desk',
  82000659804: 'Enterprise Support',
  82000660871: 'Enterprise Tech Support',
  82000659558: 'Escalation Desk [Tickets]',
  82000656469: 'Escalations [Social]',
  82000658464: 'FinOps',
  82000661863: 'Form 16 clearance',
  82000660928: 'Incident Comm',
  82000662611: 'Integration-ICR',
  82000494120: 'Integrations',
  82000662930: 'NPS',
  82000494118: 'Onboarding',
  82000656606: 'Onboarding - Bank Facing Issues',
  82000659789: 'Onboarding_DWT',
  82000659790: 'Onboarding_SKIPDWT',
  82000660722: 'Onboarding_VA Requests',
  82000494121: 'Operations',
  82000660098: 'Partner Bank Communication',
  82000660340: 'PSE',
  82000662022: 'RZPL to RZPX Migration',
  82000494119: 'Support',
  82000494126: 'Tech Support',
  82000661187: 'Tech Support Finops',
  82000662212: 'Technical Account Management - Leaders',
  82000661029: 'Technical Account Management - X',
  82000661706: 'TS Banking',
}

const AGENT_MAP: Record<number, string> = {}

export function useFreshdeskSync() {
  const { dispatch } = useApp()
  const [syncing, setSyncing] = useState(false)
  const [lastSync, setLastSync] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchAgents = useCallback(async (headers: Record<string, string>) => {
    try {
      const res = await fetch(`https://${DOMAIN}/api/v2/agents?per_page=100`, { headers })
      if (!res.ok) return
      const agents = await res.json()
      agents.forEach((a: any) => {
        AGENT_MAP[a.id] = a.contact?.name || a.name || String(a.id)
      })
    } catch { /* silent */ }
  }, [])

  const fetchTickets = useCallback(async () => {
    if (!DOMAIN || !API_KEY) return
    setSyncing(true)
    setError(null)
    try {
      const creds = btoa(`${API_KEY}:X`)
      const headers = { 'Authorization': `Basic ${creds}` }

      await fetchAgents(headers)

      let page = 1
      let allTickets: Record<string, unknown>[] = []
      while (true) {
        const res = await fetch(
          `https://${DOMAIN}/api/v2/tickets?per_page=100&page=${page}&include=stats`,
          { headers }
        )
        if (!res.ok) throw new Error(`Freshdesk API error: ${res.status}`)
        const data = await res.json()
        if (!data.length) break
        allTickets = [...allTickets, ...data]
        if (data.length < 100) break
        page++
        if (page > 100) break
      }

      if (allTickets.length) {
        const mapped = allTickets.map((t: any) => ({
          'Ticket ID': t.id,
          'Agent': AGENT_MAP[t.responder_id] || String(t.responder_id || 'Unassigned'),
          'Status': getStatus(t.status),
          'Priority': getPriority(t.priority),
          'Group': GROUP_MAP[t.group_id] || String(t.group_id || 'Unknown'),
          'Created At': t.created_at,
          'Resolved At': t.stats?.resolved_at || '',
          'First Response Time': t.stats?.first_responded_at || '',
          'CSAT': t.satisfaction_ratings?.[0]?.rating || '',
          'SLA': t.nr_escalated === false ? 'Met' : t.nr_escalated === true ? 'Breached' : '',
          'Requester': t.requester_id,
          'Tags': Array.isArray(t.tags) ? t.tags.join(',') : '',
          'Is Escalated': t.nr_escalated ? 'true' : 'false',
        }))

        dispatch({
          type: 'SET_RAW_DATA',
          payload: {
            raw: mapped as any,
            name: `freshdesk-sync-${new Date().toISOString().slice(0, 10)}.json`
          }
        })
        setLastSync(new Date())
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed')
      console.error('Freshdesk sync error:', err)
    } finally {
      setSyncing(false)
    }
  }, [dispatch, fetchAgents])

  useEffect(() => {
    if (!DOMAIN || !API_KEY) return
    fetchTickets()
    const interval = setInterval(() => {
      const now = new Date()
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
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
