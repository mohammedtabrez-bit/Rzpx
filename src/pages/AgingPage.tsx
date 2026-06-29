import { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { MdFileDownload, MdClose, MdOpenInNew } from 'react-icons/md'
import * as XLSX from 'xlsx'

const BUCKETS = [
  { label: '01-02 Days', min: 0, max: 2 },
  { label: '03-05 Days', min: 3, max: 5 },
  { label: '06-10 Days', min: 6, max: 10 },
  { label: '11-15 Days', min: 11, max: 15 },
  { label: '16-20 Days', min: 16, max: 20 },
  { label: '21-30 Days', min: 21, max: 29 },
  { label: '30+ Days', min: 30, max: 9999 },
]

const ALLOWED_GROUPS = [
  'Enterprise Support', 'Operations', 'CXO Desk', 'Support',
  'X-Downtime', 'Banking Ops', 'XPayroll Enterprise', 'XPayroll Support', 'Xpayroll Operations',
]

const FD_BASE = 'https://razorpayx.freshdesk.com'

function getDayAge(createdAt: Date): number {
  const now = new Date()
  return Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
}

function getBucket(age: number): string {
  for (const b of BUCKETS) {
    if (age >= b.min && age <= b.max) return b.label
  }
  return '30+ Days'
}

function getBucketColor(label: string): string {
  const map: Record<string, string> = {
    '01-02 Days': '#22c55e',
    '03-05 Days': '#84cc16',
    '06-10 Days': '#eab308',
    '11-15 Days': '#f97316',
    '16-20 Days': '#ef4444',
    '21-30 Days': '#dc2626',
    '30+ Days':   '#991b1b',
  }
  return map[label] || '#94a3b8'
}

interface DrilldownTicket {
  id: string | number
  agent: string
  group: string
  status: string
  priority: string
  createdAt: Date | null
  age: number
}

interface DrilldownState {
  label: string
  bucket: string
  tickets: DrilldownTicket[]
}

export function AgingPage() {
  const { state } = useApp()
  const { filteredTickets } = state
  const [selectedGroups, setSelectedGroups] = useState<string[]>([])
  const [groupOpen, setGroupOpen] = useState(false)
  const [view, setView] = useState<'date' | 'group' | 'agent'>('date')
  const [drilldown, setDrilldown] = useState<DrilldownState | null>(null)

  const unresolvedTickets = useMemo(() => {
    return filteredTickets.filter(t => {
      const s = t.status.toLowerCase()
      return !s.includes('resolved') && !s.includes('closed')
    }).filter(t => {
      if (selectedGroups.length === 0) return true
      return selectedGroups.includes(t.group)
    })
  }, [filteredTickets, selectedGroups])

  const toggleGroup = (g: string) => {
    setSelectedGroups(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g])
  }

  const handleCellClick = (label: string, bucket: string) => {
    const tickets = unresolvedTickets.filter(t => {
      const age = getDayAge(t.createdAt || new Date())
      if (getBucket(age) !== bucket) return false
      if (view === 'date') {
        const dateKey = t.createdAt ? t.createdAt.toISOString().slice(0, 10) : ''
        return dateKey === label
      }
      if (view === 'group') return t.group === label
      if (view === 'agent') return t.agent === label
      return false
    }).map(t => ({
      id: t.id, agent: t.agent, group: t.group,
      status: t.status, priority: t.priority,
      createdAt: t.createdAt, age: getDayAge(t.createdAt || new Date()),
    }))
    if (tickets.length > 0) setDrilldown({ label, bucket, tickets })
  }

  const handleTotalClick = (label: string) => {
    const tickets = unresolvedTickets.filter(t => {
      if (view === 'date') {
        const dateKey = t.createdAt ? t.createdAt.toISOString().slice(0, 10) : ''
        return dateKey === label
      }
      if (view === 'group') return t.group === label
      if (view === 'agent') return t.agent === label
      return false
    }).map(t => ({
      id: t.id, agent: t.agent, group: t.group,
      status: t.status, priority: t.priority,
      createdAt: t.createdAt, age: getDayAge(t.createdAt || new Date()),
    }))
    if (tickets.length > 0) setDrilldown({ label: label + ' — All Buckets', bucket: 'All', tickets })
  }

  const dateAging = useMemo(() => {
    const map: Record<string, Record<string, number>> = {}
    unresolvedTickets.forEach(t => {
      if (!t.createdAt) return
      const dateKey = t.createdAt.toISOString().slice(0, 10)
      const bucket = getBucket(getDayAge(t.createdAt))
      if (!map[dateKey]) map[dateKey] = {}
      map[dateKey][bucket] = (map[dateKey][bucket] || 0) + 1
    })
    return Object.keys(map).sort().reverse().map(date => ({
      label: date, buckets: map[date],
      total: Object.values(map[date]).reduce((a, b) => a + b, 0),
    }))
  }, [unresolvedTickets])

  const groupAging = useMemo(() => {
    const map: Record<string, Record<string, number>> = {}
    unresolvedTickets.forEach(t => {
      const grp = t.group || 'Unknown'
      const bucket = getBucket(getDayAge(t.createdAt || new Date()))
      if (!map[grp]) map[grp] = {}
      map[grp][bucket] = (map[grp][bucket] || 0) + 1
    })
    return Object.entries(map).sort((a, b) =>
      Object.values(b[1]).reduce((x, y) => x + y, 0) - Object.values(a[1]).reduce((x, y) => x + y, 0)
    ).map(([group, buckets]) => ({
      label: group, buckets,
      total: Object.values(buckets).reduce((a, b) => a + b, 0),
    }))
  }, [unresolvedTickets])

  const agentAging = useMemo(() => {
    const map: Record<string, Record<string, number>> = {}
    unresolvedTickets.forEach(t => {
      const agent = t.agent || 'Unassigned'
      const bucket = getBucket(getDayAge(t.createdAt || new Date()))
      if (!map[agent]) map[agent] = {}
      map[agent][bucket] = (map[agent][bucket] || 0) + 1
    })
    return Object.entries(map).sort((a, b) =>
      Object.values(b[1]).reduce((x, y) => x + y, 0) - Object.values(a[1]).reduce((x, y) => x + y, 0)
    ).map(([agent, buckets]) => ({
      label: agent, buckets,
      total: Object.values(buckets).reduce((a, b) => a + b, 0),
    }))
  }, [unresolvedTickets])

  const totals = useMemo(() => {
    const t: Record<string, number> = {}
    unresolvedTickets.forEach(ticket => {
      const bucket = getBucket(getDayAge(ticket.createdAt || new Date()))
      t[bucket] = (t[bucket] || 0) + 1
    })
    return t
  }, [unresolvedTickets])

  const exportExcel = () => {
    const rows = dateAging.map(row => {
      const r: Record<string, string | number> = { Date: row.label }
      BUCKETS.forEach(b => { r[b.label] = row.buckets[b.label] || 0 })
      r['Total'] = row.total
      return r
    })
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Aging Report')
    XLSX.writeFile(wb, 'aging-report-' + new Date().toISOString().slice(0, 10) + '.xlsx')
  }

  const inputStyle = { background: '#040a14', border: '1px solid rgba(255,255,255,0.1)', color: '#93c5fd', fontSize: 12, padding: '6px 10px', borderRadius: 8, outline: 'none' }
  const cardStyle = { background: 'rgba(10,22,40,0.7)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 20 }
  const currentRows = view === 'date' ? dateAging : view === 'group' ? groupAging : agentAging

  if (!filteredTickets.length) {
    return (
      <div style={{ textAlign: 'center', padding: '64px 24px' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
        <div style={{ fontWeight: 600, fontSize: 18, color: '#60a5fa' }}>No data loaded</div>
        <div style={{ fontSize: 14, color: '#1e40af', marginTop: 8 }}>Click Sync Now to load tickets.</div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 4 }}>Ticket Aging</h1>
          <p style={{ fontSize: 14, color: '#3b82f6' }}>
            {unresolvedTickets.length.toLocaleString()} unresolved tickets
            {selectedGroups.length > 0 ? ' · ' + selectedGroups.join(', ') : ' · All groups'}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: 3, border: '1px solid rgba(255,255,255,0.08)' }}>
            {(['date', 'group', 'agent'] as const).map(v => (
              <button key={v} onClick={() => setView(v)} style={{ padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer', background: view === v ? '#1d4ed8' : 'transparent', color: view === v ? '#fff' : 'rgba(255,255,255,0.4)' }}>
                {v === 'date' ? 'By Date' : v === 'group' ? 'By Group' : 'By Agent'}
              </button>
            ))}
          </div>
          <div style={{ position: 'relative' }}>
            <button onClick={() => setGroupOpen(o => !o)} style={{ ...inputStyle, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <span style={{ color: selectedGroups.length ? '#60a5fa' : 'rgba(255,255,255,0.4)' }}>
                {selectedGroups.length === 0 ? 'All Groups' : selectedGroups.length + ' selected'}
              </span>
              <span style={{ color: '#3b82f6', fontSize: 10 }}>▼</span>
            </button>
            {groupOpen && (
              <div style={{ position: 'absolute', top: '100%', right: 0, zIndex: 100, background: '#040a14', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, width: 220, maxHeight: 240, overflowY: 'auto', marginTop: 4, boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}>
                <div style={{ padding: '6px 10px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, color: '#3b82f6' }}>{selectedGroups.length} selected</span>
                  <button onClick={() => setSelectedGroups([])} style={{ fontSize: 11, color: '#f97316', background: 'none', border: 'none', cursor: 'pointer' }}>Clear</button>
                </div>
                {ALLOWED_GROUPS.map(g => (
                  <label key={g} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <input type="checkbox" checked={selectedGroups.includes(g)} onChange={() => toggleGroup(g)} style={{ accentColor: '#2563eb' }} />
                    <span style={{ fontSize: 12, color: '#93c5fd' }}>{g}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
          <button onClick={exportExcel} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', background: 'rgba(30,58,138,0.8)', color: '#93c5fd', border: '1px solid rgba(147,197,253,0.2)', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            <MdFileDownload className="w-4 h-4" /> Export Excel
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10, marginBottom: 20 }}>
        {BUCKETS.map(b => (
          <div key={b.label} style={{ ...cardStyle, padding: '12px 14px', borderTop: '2px solid ' + getBucketColor(b.label), cursor: 'pointer', transition: 'transform 0.15s' }}
            onClick={() => {
              const tickets = unresolvedTickets.filter(t => getBucket(getDayAge(t.createdAt || new Date())) === b.label)
                .map(t => ({ id: t.id, agent: t.agent, group: t.group, status: t.status, priority: t.priority, createdAt: t.createdAt, age: getDayAge(t.createdAt || new Date()) }))
              if (tickets.length) setDrilldown({ label: b.label, bucket: b.label, tickets })
            }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <div style={{ fontSize: 10, fontWeight: 700, color: getBucketColor(b.label), textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{b.label}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#fff' }}>{totals[b.label] || 0}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
              {unresolvedTickets.length > 0 ? Math.round(((totals[b.label] || 0) / unresolvedTickets.length) * 100) + '%' : '0%'}
            </div>
          </div>
        ))}
      </div>

      {selectedGroups.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
          {selectedGroups.map(g => (
            <span key={g} style={{ fontSize: 11, background: 'rgba(30,58,138,0.5)', color: '#93c5fd', border: '1px solid rgba(147,197,253,0.2)', padding: '3px 10px', borderRadius: 999, display: 'flex', alignItems: 'center', gap: 5 }}>
              {g}
              <button onClick={() => toggleGroup(g)} style={{ background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer', fontSize: 13 }}>×</button>
            </span>
          ))}
        </div>
      )}

      <div style={cardStyle}>
        <div style={{ fontWeight: 700, fontSize: 14, color: '#93c5fd', marginBottom: 4 }}>
          {view === 'date' ? 'Date-wise Aging' : view === 'group' ? 'Group-wise Aging' : 'Agent-wise Aging'}
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 16 }}>Click any number to see ticket details</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: 'rgba(4,10,20,0.8)' }}>
                <th style={{ padding: '10px 14px', textAlign: 'left', color: '#1e40af', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                  {view === 'date' ? 'Date' : view === 'group' ? 'Group' : 'Agent'}
                </th>
                {BUCKETS.map(b => (
                  <th key={b.label} style={{ padding: '10px 10px', textAlign: 'center', color: getBucketColor(b.label), fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>{b.label}</th>
                ))}
                <th style={{ padding: '10px 14px', textAlign: 'center', color: '#60a5fa', fontSize: 11, fontWeight: 700 }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {currentRows.map((row, i) => (
                <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '9px 14px', color: '#93c5fd', fontWeight: 500, whiteSpace: 'nowrap' }}>{row.label}</td>
                  {BUCKETS.map(b => {
                    const val = row.buckets[b.label] || 0
                    const pct = row.total > 0 ? val / row.total : 0
                    return (
                      <td key={b.label} style={{ padding: '9px 10px', textAlign: 'center' }}>
                        {val > 0 ? (
                          <button
                            onClick={() => handleCellClick(row.label, b.label)}
                            style={{ display: 'inline-block', minWidth: 32, padding: '3px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', background: getBucketColor(b.label) + Math.round(pct * 40 + 20).toString(16).padStart(2, '0'), color: getBucketColor(b.label), fontWeight: 700, fontSize: 12, transition: 'transform 0.1s' }}
                            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.15)')}
                            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                          >
                            {val}
                          </button>
                        ) : (
                          <span style={{ color: 'rgba(255,255,255,0.15)' }}>—</span>
                        )}
                      </td>
                    )
                  })}
                  <td style={{ padding: '9px 14px', textAlign: 'center' }}>
                    <button
                      onClick={() => handleTotalClick(row.label)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#60a5fa', fontWeight: 700, fontSize: 13, textDecoration: 'underline', textDecorationStyle: 'dotted' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#93c5fd')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#60a5fa')}
                    >
                      {row.total}
                    </button>
                  </td>
                </tr>
              ))}
              <tr style={{ borderTop: '2px solid rgba(255,255,255,0.1)', background: 'rgba(4,10,20,0.5)' }}>
                <td style={{ padding: '10px 14px', color: '#fff', fontWeight: 800, fontSize: 12 }}>TOTAL</td>
                {BUCKETS.map(b => (
                  <td key={b.label} style={{ padding: '10px 10px', textAlign: 'center' }}>
                    <button
                      onClick={() => {
                        const tickets = unresolvedTickets.filter(t => getBucket(getDayAge(t.createdAt || new Date())) === b.label)
                          .map(t => ({ id: t.id, agent: t.agent, group: t.group, status: t.status, priority: t.priority, createdAt: t.createdAt, age: getDayAge(t.createdAt || new Date()) }))
                        if (tickets.length) setDrilldown({ label: 'All — ' + b.label, bucket: b.label, tickets })
                      }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: getBucketColor(b.label), fontWeight: 800, fontSize: 13 }}
                    >
                      {totals[b.label] || 0}
                    </button>
                  </td>
                ))}
                <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                  <button
                    onClick={() => {
                      const tickets = unresolvedTickets.map(t => ({ id: t.id, agent: t.agent, group: t.group, status: t.status, priority: t.priority, createdAt: t.createdAt, age: getDayAge(t.createdAt || new Date()) }))
                      if (tickets.length) setDrilldown({ label: 'All Unresolved Tickets', bucket: 'All', tickets })
                    }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', fontWeight: 800, fontSize: 14, textDecoration: 'underline', textDecorationStyle: 'dotted' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#93c5fd')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#fff')}
                  >
                    {unresolvedTickets.length}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {drilldown && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={() => setDrilldown(null)}
        >
          <div style={{ background: '#0a1628', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, width: '100%', maxWidth: 800, maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#fff' }}>
                  {drilldown.label}
                  <span style={{ marginLeft: 8, fontSize: 12, color: getBucketColor(drilldown.bucket) !== '#94a3b8' ? getBucketColor(drilldown.bucket) : '#60a5fa', background: 'rgba(96,165,250,0.1)', padding: '2px 8px', borderRadius: 999 }}>
                    {drilldown.bucket}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                  {drilldown.tickets.length} tickets — click ticket number to open in Freshdesk
                </div>
              </div>
              <button onClick={() => setDrilldown(null)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: 6, cursor: 'pointer', color: 'rgba(255,255,255,0.6)' }}>
                <MdClose className="w-4 h-4" />
              </button>
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead style={{ position: 'sticky', top: 0, background: '#040a14', zIndex: 1 }}>
                  <tr>
                    <th style={{ padding: '10px 16px', textAlign: 'left', color: '#1e40af', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Ticket #</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', color: '#1e40af', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Agent</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', color: '#1e40af', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Group</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', color: '#1e40af', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Status</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', color: '#1e40af', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Priority</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', color: '#1e40af', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Age</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', color: '#1e40af', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {drilldown.tickets.map((t, i) => (
                    <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '9px 16px' }}>
                        <a href={FD_BASE + '/a/tickets/' + String(t.id)} target="_blank" rel="noopener noreferrer"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#60a5fa', fontWeight: 700, textDecoration: 'none', background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.2)', padding: '3px 8px', borderRadius: 6 }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(96,165,250,0.2)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(96,165,250,0.1)')}
                        >
                          {'#' + String(t.id)}
                          <MdOpenInNew style={{ width: 10, height: 10 }} />
                        </a>
                      </td>
                      <td style={{ padding: '9px 12px', color: '#93c5fd' }}>{t.agent || 'Unassigned'}</td>
                      <td style={{ padding: '9px 12px', color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>{t.group}</td>
                      <td style={{ padding: '9px 12px' }}>
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: t.status.toLowerCase().includes('open') ? 'rgba(249,115,22,0.15)' : 'rgba(96,165,250,0.1)', color: t.status.toLowerCase().includes('open') ? '#f97316' : '#60a5fa' }}>
                          {t.status}
                        </span>
                      </td>
                      <td style={{ padding: '9px 12px' }}>
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: t.priority.toLowerCase() === 'urgent' ? 'rgba(239,68,68,0.15)' : t.priority.toLowerCase() === 'high' ? 'rgba(249,115,22,0.15)' : 'rgba(96,165,250,0.1)', color: t.priority.toLowerCase() === 'urgent' ? '#ef4444' : t.priority.toLowerCase() === 'high' ? '#f97316' : '#60a5fa' }}>
                          {t.priority}
                        </span>
                      </td>
                      <td style={{ padding: '9px 12px', textAlign: 'center' }}>
                        <span style={{ color: getBucketColor(getBucket(t.age)), fontWeight: 700 }}>{t.age}d</span>
                      </td>
                      <td style={{ padding: '9px 12px', color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>
                        {t.createdAt ? t.createdAt.toLocaleDateString('en-IN') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
