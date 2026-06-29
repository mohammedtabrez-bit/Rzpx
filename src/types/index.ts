export interface RawTicket {
  [key: string]: string | number | boolean | Date | null
}

export interface MappedTicket {
  id: string
  agent: string
  status: string
  priority: string
  group: string
  product: string
  tags: string
  createdAt: Date | null
  resolvedAt: Date | null
  frtHours: number
  resolutionHours: number
  csat: number | null
  slaStatus: string
  isReopened: boolean
  isEscalated: boolean
  requester: string
}

export interface AgentStats {
  agent: string
  group: string
  assigned: number
  resolved: number
  pending: number
  open: number
  avgFrt: number
  avgRt: number
  avgCsat: number
  slaRate: number
  resolutionRate: number
  reopens: number
  reopenRate: number
  escalations: number
  score: number
  dailyCounts: Record<string, number>
  monthlyCounts: Record<string, number>
}

export interface GlobalMetrics {
  total: number
  resolved: number
  open: number
  pending: number
  backlog: number
  reopens: number
  escalations: number
  avgFrt: number
  avgRt: number
  avgCsat: number
  slaRate: number
  fcrRate: number
  reopenRate: number
  agentCount: number
  avgScore: number
  closedToday: number
  closedWeek: number
  closedMonth: number
}

export interface ScoreWeights {
  csat: number
  quality: number
  sla: number
  frt: number
  rt: number
  escalations: number
}

export interface KPITargets {
  csat: number
  sla: number
  fcr: number
  frt: number
  rt: number
  reopen: number
}

export interface ScoreThresholds {
  excellent: number
  good: number
  average: number
}

export interface DashboardSettings {
  weights: ScoreWeights
  targets: KPITargets
  thresholds: ScoreThresholds
  columnOverrides: Record<string, string>
}

export interface UploadRecord {
  id: string
  fileName: string
  rowCount: number
  agentCount: number
  uploadedAt: Date
  uploadedBy: string
  storagePath: string
}

export interface UserProfile {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
  role: 'admin' | 'viewer'
  createdAt: Date
}

export type ScoreRating = 'Excellent' | 'Good' | 'Average' | 'Needs Improvement' | 'Poor'
