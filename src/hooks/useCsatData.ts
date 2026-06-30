import { useState, useCallback } from 'react'

export interface SurveyRecord {
  id: number
  ticketId: number
  agentId: number
  groupId: number
  groupName: string
  agentName: string
  rating: number
  ratingLabel: string
  feedback: string
  createdAt: Date
}

const DOMAIN = (import.meta as any).env.VITE_FRESHDESK_DOMAIN
const API_KEY = (import.meta as any).env.VITE_FRESHDESK_API_KEY

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
  82000494122: 'X-Downtime',
  82000658304: 'XPayroll Enterprise',
  82000658305: 'XPayroll Support',
  82000660633: 'Xpayroll Operations',
}

export function useCsatData() {
  const [records, setRecords] = useState<SurveyRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSurveyData = useCallback(async () => {
    if (!DOMAIN || !API_KEY) return
    setLoading(true)
    setError(null)
    try {
      const creds = btoa(API_KEY + ':X')
      const headers = { 'Authorization': 'Basic ' + creds }

      const agentMap: Record<number, string> = {}
      let agentPage = 1
      while (agentPage <= 10) {
        const res = await fetch('https://' + DOMAIN + '/api/v2/agents?per_page=100&page=' + agentPage, { headers })
        if (!res.ok) break
        const agents = await res.json()
        if (!agents.length) break
        agents.forEach((a: any) => {
          const name = a.contact?.name || a.name || null
          if (name && a.id) agentMap[a.id] = name
        })
        if (agents.length < 100) break
        agentPage++
      }

      let page = 1
      let allRatings: any[] = []
      while (page <= 50) {
        const res = await fetch('https://' + DOMAIN + '/api/v2/surveys/satisfaction_ratings?per_page=100&page=' + page, { headers })
        if (!res.ok) break
        const data = await res.json()
        if (!data.length) break
        allRatings = [...allRatings, ...data]
        if (data.length < 100) break
        page++
      }

      const mapped: SurveyRecord[] = allRatings.map((r: any) => {
        const ratingVal = r.ratings?.default_question
        return {
          id: r.id,
          ticketId: r.ticket_id,
          agentId: r.agent_id,
          groupId: r.group_id,
          groupName: GROUP_MAP[r.group_id] || 'Unknown',
          agentName: agentMap[r.agent_id] || ('Agent_' + r.agent_id),
          rating: ratingVal,
          ratingLabel: ratingVal > 0 ? 'Satisfied' : 'Dissatisfied',
          feedback: r.feedback || '',
          createdAt: new Date(r.created_at),
        }
      })

      setRecords(mapped)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch survey data')
    } finally {
      setLoading(false)
    }
  }, [])

  return { records, loading, error, fetchSurveyData }
}
