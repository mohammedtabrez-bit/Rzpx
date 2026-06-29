import { useState, useEffect, useCallback } from 'react'
import { useApp } from '../context/AppContext'

const DOMAIN = (import.meta as any).env.VITE_FRESHDESK_DOMAIN
const API_KEY = (import.meta as any).env.VITE_FRESHDESK_API_KEY
const SYNC_TIMES = ['08:00', '14:00', '20:00']

const GROUP_MAP: Record<number, string> = {
  82000494118: 'Enterprise Support',
  82000494119: 'Operations',
  82000494120: 'Support',
  82000494121: 'Banking Ops',
  82000494122: 'X-Downtime',
  82000494126: 'CXO Desk',
  82000658304: 'XPayroll Enterprise',
  82000658305: 'XPayroll Support',
  82000658464: 'Xpayroll Operations',
}

export function useFreshdeskSync() {
  const { dispatch } = useApp()
  const [syncing, setSyncing] = useState(false)
  const [lastSync, setLastSync] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchTickets = useCallback(async () => {
    if (!DOMAIN || !API_KEY) return
    setSyncing(true)
    setError(null)
    try {
      const creds = btoa(`${API_KEY}:X`)
      const headers = { 'Authorization': `Basic ${creds}` }
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
        if (page > 10) break
      }
      if (allTickets.length) {
        const mapped = allTickets.map(t => ({
          'Ticket ID': t.id,
          'Agent': (t.responder_id as string) || '',
          'Status': getStatus(t.status as number),
          'Priority': getPriority(t.priority as number),
          'Group': GROUP_MAP[t.group_id as number] || String(t.group_id || 'Unknown'),
          'Created At': t.created_at,
          'Resolved At': t.stats ? (t.stats as any).resolved_at : '',
          'First Response Time': t.stats ? (t.stats as any).first_responded_at : '',
          'CSAT': '',
          'SLA': t.nr_due_by ? 'Met' : '',
          'Requester': t.requester_id,
          'Tags': Array.isArray(t.tags) ? (t.tags as string[]).join(',') : '',
        }))
        dispatch({
          type: 'SET_RAW_DATA',
          payload: { raw: mapped as any, name: `freshdesk-sync-${new Date().toISOString().slice(0,10)}.json` }
        })
        setLastSync(new Date())
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed')
    } finally {
      setSyncing(false)
    }
  }, [dispatch])

  useEffect(() => {
    if (!DOMAIN || !API_KEY) return
    fetchTickets()
    const interval = setInterval(() => {
      const now = new Date()
      const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`
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
