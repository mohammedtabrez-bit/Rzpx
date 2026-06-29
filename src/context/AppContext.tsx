import React, { createContext, useContext, useReducer, useEffect } from 'react'
import type { MappedTicket, AgentStats, GlobalMetrics, DashboardSettings, UserProfile, UploadRecord } from '../types'
import { buildAgentStats, calcGlobalMetrics, processTickets } from '../utils/dataProcessor'

const DEFAULT_SETTINGS: DashboardSettings = {
  weights: { csat: 30, quality: 25, sla: 20, frt: 10, rt: 10, escalations: 5 },
  targets: { csat: 85, sla: 90, fcr: 75, frt: 4, rt: 24, reopen: 5 },
  thresholds: { excellent: 85, good: 70, average: 50 },
  columnOverrides: {},
}

interface FilterState {
  dateFrom: string
  dateTo: string
  agent: string
  group: string
  status: string
  priority: string
  search: string
}

interface AppState {
  user: UserProfile | null
  authLoading: boolean
  tickets: MappedTicket[]
  filteredTickets: MappedTicket[]
  agentStats: Record<string, AgentStats>
  globalMetrics: GlobalMetrics | null
  settings: DashboardSettings
  rawData: Record<string, string | number | boolean | null>[]
  colMap: Record<string, string>
  uploadHistory: UploadRecord[]
  darkMode: boolean
  sidebarOpen: boolean
  filters: FilterState
  lastUpload: { name: string; rows: number } | null
}

type Action =
  | { type: 'SET_USER'; payload: UserProfile | null }
  | { type: 'SET_AUTH_LOADING'; payload: boolean }
  | { type: 'SET_RAW_DATA'; payload: { raw: Record<string, string | number | boolean | null>[]; name: string } }
  | { type: 'SET_FILTERED'; payload: MappedTicket[] }
  | { type: 'SET_SETTINGS'; payload: DashboardSettings }
  | { type: 'SET_UPLOAD_HISTORY'; payload: UploadRecord[] }
  | { type: 'TOGGLE_DARK' }
  | { type: 'SET_SIDEBAR'; payload: boolean }
  | { type: 'SET_FILTER'; payload: Partial<FilterState> }
  | { type: 'CLEAR_FILTERS' }

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_USER': return { ...state, user: action.payload }
    case 'SET_AUTH_LOADING': return { ...state, authLoading: action.payload }
    case 'SET_SETTINGS': return { ...state, settings: action.payload }
    case 'SET_UPLOAD_HISTORY': return { ...state, uploadHistory: action.payload }
    case 'TOGGLE_DARK': return { ...state, darkMode: !state.darkMode }
    case 'SET_SIDEBAR': return { ...state, sidebarOpen: action.payload }
    case 'SET_FILTER': return { ...state, filters: { ...state.filters, ...action.payload } }
    case 'CLEAR_FILTERS': return { ...state, filters: { dateFrom: '', dateTo: '', agent: '', group: '', status: '', priority: '', search: '' } }
    case 'SET_RAW_DATA': {
      const raw = action.payload.raw as Record<string, unknown>[]
      const { tickets, colMap } = processTickets(raw, state.settings.columnOverrides)
      const agentStats = buildAgentStats(tickets, state.settings)
      const globalMetrics = calcGlobalMetrics(tickets, agentStats)
      return {
        ...state,
        rawData: action.payload.raw,
        tickets, filteredTickets: tickets, colMap, agentStats, globalMetrics,
        lastUpload: { name: action.payload.name, rows: tickets.length }
      }
    }
    case 'SET_FILTERED': {
      const agentStats = buildAgentStats(action.payload, state.settings)
      const globalMetrics = calcGlobalMetrics(action.payload, agentStats)
      return { ...state, filteredTickets: action.payload, agentStats, globalMetrics }
    }
    default: return state
  }
}

const emptyMetrics: GlobalMetrics = {
  total: 0, resolved: 0, open: 0, pending: 0, backlog: 0,
  reopens: 0, escalations: 0, avgFrt: 0, avgRt: 0, avgCsat: 0,
  slaRate: 0, fcrRate: 0, reopenRate: 0, agentCount: 0, avgScore: 0,
  closedToday: 0, closedWeek: 0, closedMonth: 0,
}

const initialState: AppState = {
  user: null, authLoading: true,
  tickets: [], filteredTickets: [], agentStats: {}, globalMetrics: emptyMetrics,
  settings: DEFAULT_SETTINGS, rawData: [], colMap: {},
  uploadHistory: [], darkMode: false, sidebarOpen: true,
  filters: { dateFrom: '', dateTo: '', agent: '', group: '', status: '', priority: '', search: '' },
  lastUpload: null,
}

export const DEFAULT_SETTINGS_EXPORT = DEFAULT_SETTINGS

interface ContextValue {
  state: AppState
  dispatch: React.Dispatch<Action>
  applyFilters: () => void
}

const AppContext = createContext<ContextValue | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    ...initialState,
    darkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', state.darkMode)
  }, [state.darkMode])

  const applyFilters = () => {
    const { tickets, filters } = state
    const from = filters.dateFrom ? new Date(filters.dateFrom) : null
    const to = filters.dateTo ? new Date(filters.dateTo + 'T23:59:59') : null
    const search = filters.search.toLowerCase()
    const filtered = tickets.filter(t => {
      if (filters.agent && t.agent !== filters.agent) return false
      if (filters.group && t.group !== filters.group) return false
      if (filters.status && t.status !== filters.status) return false
      if (filters.priority && t.priority !== filters.priority) return false
      if (search && !t.agent.toLowerCase().includes(search)) return false
      if (from || to) {
        const d = t.createdAt
        if (d) {
          if (from && d < from) return false
          if (to && d > to) return false
        }
      }
      return true
    })
    dispatch({ type: 'SET_FILTERED', payload: filtered })
  }

  return <AppContext.Provider value={{ state, dispatch, applyFilters }}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
