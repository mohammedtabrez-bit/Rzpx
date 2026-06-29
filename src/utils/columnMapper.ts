export const COLUMN_ALIASES: Record<string, string[]> = {
  agent: [
    'agent', 'responder', 'assigned to', 'owner', 'agent name', 'assignee',
    'handled by', 'support agent', 'assigned agent', 'rep', 'responsible party',
    'ticket owner', 'agent email',
  ],
  id: ['ticket id', 'id', '#', 'ticket #', 'case id', 'ref', 'reference', 'ticket number', 'case number'],
  status: ['status', 'ticket status', 'state', 'resolution state', 'current status'],
  priority: ['priority', 'ticket priority', 'urgency', 'severity', 'impact'],
  group: ['group', 'team', 'department', 'product', 'product area', 'category', 'queue', 'skill', 'division', 'pod'],
  product: ['product', 'product name', 'module', 'service', 'vertical'],
  tags: ['tags', 'tag', 'labels', 'label'],
  created: [
    'created at', 'created time', 'created', 'date created', 'open date',
    'creation date', 'opened at', 'created_at', 'created date', 'date opened',
    'ticket created', 'opened',
  ],
  resolved: [
    'resolved at', 'resolved', 'resolved time', 'resolution date', 'closed at',
    'closed', 'close date', 'resolved date', 'resolution_date', 'date resolved',
    'date closed',
  ],
  frt: [
    'first response time', 'frt', 'first_response_time', 'first response',
    'first reply time', 'first response time (in hrs)', 'frt (hrs)', 'first contact time',
    'initial response time', 'time to first response',
  ],
  resolutionTime: [
    'resolution time', 'handling time', 'time to resolve', 'resolution_time',
    'time to resolution', 'resolution time (in hrs)', 'rt (hrs)', 'avg resolution time',
    'handle time', 'total handle time',
  ],
  csat: [
    'csat', 'customer satisfaction', 'satisfaction', 'satisfaction score',
    'survey score', 'happiness', 'rating', 'csat score', 'customer rating',
    'nps', 'survey rating', 'feedback score',
  ],
  sla: [
    'sla', 'sla status', 'sla met', 'sla compliance', 'service level',
    'sla_status', 'within sla', 'sla breached', 'breach status', 'sla met?',
    'first response sla', 'resolution sla',
  ],
  reopened: ['reopened', 'reopen', 'is reopened', 'reopened count', 'reopen count', 'was reopened', 'reopen flag'],
  escalated: ['escalated', 'escalation', 'is escalated', 'escalation count', 'was escalated', 'escalation flag'],
  requester: ['requester', 'customer', 'contact', 'user', 'client', 'name', 'customer name', 'contact name'],
}

export function mapColumns(headers: string[], overrides: Record<string, string> = {}): Record<string, string> {
  const result: Record<string, string> = {}
  const lower = headers.map(h => ({ orig: h, lower: (h || '').toLowerCase().trim() }))

  for (const [key, aliases] of Object.entries(COLUMN_ALIASES)) {
    // Custom override takes priority
    if (overrides[key]) {
      const match = lower.find(h => h.lower === overrides[key].toLowerCase())
      if (match) { result[key] = match.orig; continue }
    }
    // Fuzzy auto-detection
    for (const alias of aliases) {
      const match = lower.find(h => h.lower.includes(alias) || alias.includes(h.lower))
      if (match) { result[key] = match.orig; break }
    }
  }
  return result
}
