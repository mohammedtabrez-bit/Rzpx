import { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { MdFileDownload } from 'react-icons/md'
import * as XLSX from 'xlsx'

const BUCKETS = [
  { label: '01-02 Days', min: 0, max: 2 },
  { label: '03-05 Days', min: 3, max: 5 },
  { label: '06-10 Days', min: 6, max: 10 },
  { label: '11-15 Days', min: 11, max: 15 },
  { label: '16-20 Days', min: 16, max: 20 },
  { label: '21-30 Days', min: 21, max: 30 },
  { label: '30+ Days', min: 31, max: 9999 },
]

const ALLOWED_GROUPS = [
  'Enterprise Support', 'Operations', 'CXO Desk', 'Support',
  'X-Downtime', 'Banking Ops', 'XPayroll Enterprise', 'XPayroll Support', 'Xpayroll Operations',
]

function getDayAge(createdAt: Date): number {
  const now = new Date()
  const diff = now.getTime() - createdAt.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
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

export function AgingPage() {
  const { state } = useApp()
  const { filteredTickets } = state
  const [selectedGroups, setSelectedGroups] = useState<string[]>([])
  const [groupOpen, setGroupOpen] = useState(false)
  const [view, setView] = useState<'date' | 'group' | 'agent'>('date')

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

  // Date-wise aging
  const dateAging = useMemo(() => {
    const map: Record<string, Record<string, number>> = {}
    unresolvedTickets.forEach(t => {
      if (!t.createdAt) return
      const dateKey = t.createdAt.toISOString().slice(0, 10)
      const age = getDayAge(t.createdAt)
      const bucket = getBucket(age)
      if (!map[dateKey]) map[dateKey] = {}
      map[dateKey][bucket] = (map[dateKey][bucket] || 0) + 1
    })
    return Object.keys(map).sort().reverse().map(date => ({
      date,
      buckets: map[date],
      total: Object.values(map[date]).reduce((a, b) => a + b, 0),
    }))
  }, [unresolvedTickets])

  // Group-wise aging
  const groupAging = useMemo(() => {
    const map: Record<string, Record<string, number>> = {}
    unresolvedTickets.forEach(t => {
      const grp = t.group || 'Unknown'
      const age = getDayAge(t.createdAt || new Date())
      const bucket = getBucket(age)
      if (!map[grp]) map[grp] = {}
      map[grp][bucket] = (map[grp][bucket] || 0) + 1
    })
    return Object.entries(map).sort((a, b) => {
      const ta = Object.values(a[1]).reduce((x, y) => x + y, 0)
      const tb = Object.values(b[1]).reduce((x, y) => x + y, 0)
      return tb - ta
    }).map(([group, buckets]) => ({
      group,
      buckets,
      total: Object.values(buckets).reduce((a, b) => a + b, 0),
    }))
  }, [unresolvedTickets])

  // Agent-wise aging
  const agentAging = useMemo(() => {
    const map: Record<string, Record<string, number>> = {}
    unresolvedTickets.forEach(t => {
      const agent = t.agent || 'Unassigned'
      const age = getDayAge(t.createdAt || new Date())
      const bucket = getBucket(age)
      if (!map[agent]) map[agent] = {}
      map[agent][bucket] = (map[agent][bucket] || 0) + 1
    })
    return Object.entries(map).sort((a, b) => {
      const ta = Object.values(a[1]).reduce((x, y) => x + y, 0)
      const tb = Object.values(b[1]).reduce((x, y) => x + y, 0)
      return tb - ta
    }).map(([agent, buckets]) => ({
      agent,
      buckets,
      total: Object.values(buckets).reduce((a, b) => a + b, 0),
    }))
  }, [unresolvedTickets])

  // Totals
  const totals = useMemo(() => {
    const t: Record<string, number> = {}
    unresolvedTickets.forEach(ticket => {
      const age = getDayAge(ticket.createdAt || new Date())
      const bucket = getBucket(age)
      t[bucket] = (t[bucket] || 0) + 1
    })
    return t
  }, [unresolvedTickets])

  const exportExcel = () => {
    const rows = dateAging.map(row => {
      const r: Record<string, string | number> = { Date: row.date }
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

  if (!filteredTickets.length) {
    return (
      <div style={{ textAlign: 'center', padding: '64px 24px' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
        <div style={{ fontWeight: 600, fontSize: 18, color: '#60a5fa' }}>No data loaded</div>
        <div style={{ fontSize: 14, color: '#1e40af', marginTop: 8 }}>Click Sync Now to load tickets.</div>
      </div>
    )
  }

  const renderTable = (
    rows: { label: string; buckets: Record<string, number>; total: number }[]
  ) => (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ background: 'rgba(4,10,20,0.8)' }}>
            <th style={{ padding: '10px 14px', textAlign: 'left', color: '#1e40af', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
              {view === 'date' ? 'Date' : view === 'group' ? 'Group' : 'Agent'}
            </th>
            {BUCKETS.map(b => (
              <th key={b.label} style={{ padding: '10px 10px', textAlign: 'center', color: getBucketColor(b.label), fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>
                {b.label}
              </th>
            ))}
            <th style={{ padding: '10px 14px', textAlign: 'center', color: '#60a5fa', fontSize: 11, fontWeight: 700 }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
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
                      <span style={{
                        display: 'inline-block', minWidth: 28, padding: '2px 8px', borderRadius: 6,
                        background: getBucketColor(b.label) + Math.round(pct * 40 + 15).toString(16).padStart(2, '0'),
                        color: getBucketColor(b.label), fontWeight: 600, fontSize: 12,
                      }}>
                        {val}
                      </span>
                    ) : (
                      <span style={{ color: 'rgba(255,255,255,0.15)' }}>—</span>
                    )}
                  </td>
                )
              })}
              <td style={{ padding: '9px 14px', textAlign: 'center', color: '#60a5fa', fontWeight: 700 }}>{row.total}</td>
            </tr>
          ))}
          {/* Totals row */}
          <tr style={{ borderTop: '2px solid rgba(255,255,255,0.1)', background: 'rgba(4,10,20,0.5)' }}>
            <td style={{ padding: '10px 14px', color: '#fff', fontWeight: 800, fontSize: 12 }}>TOTAL</td>
            {BUCKETS.map(b => (
              <td key={b.label} style={{ padding: '10px 10px', textAlign: 'center' }}>
                <span style={{ color: getBucketColor(b.label), fontWeight: 800, fontSize: 13 }}>
                  {totals[b.label] || 0}
                </span>
              </td>
            ))}
            <td style={{ padding: '10px 14px', textAlign: 'center', color: '#fff', fontWeight: 800, fontSize: 14 }}>
              {unresolvedTickets.length}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )

  const currentRows = view === 'date'
    ? dateAging.map(r => ({ label: r.date, buckets: r.buckets, total: r.total }))
    : view === 'group'
    ? groupAging.map(r => ({ label: r.group, buckets: r.buckets, total: r.total }))
    : agentAging.map(r => ({ label: r.agent, buckets: r.buckets, total: r.total }))

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
          {/* View toggle */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: 3, border: '1px solid rgba(255,255,255,0.08)' }}>
            {(['date', 'group', 'agent'] as const).map(v => (
              <button key={v} onClick={() => setView(v)} style={{ padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer', background: view === v ? '#1d4ed8' : 'transparent', color: view === v ? '#fff' : 'rgba(255,255,255,0.4)', textTransform: 'capitalize' }}>
                {v === 'date' ? 'By Date' : v === 'group' ? 'By Group' : 'By Agent'}
              </button>
            ))}
          </div>

          {/* Group filter */}
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

      {/* Summary KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10, marginBottom: 20 }}>
        {BUCKETS.map(b => (
          <div key={b.label} style={{ ...cardStyle, padding: '12px 14px', borderTop: '2px solid ' + getBucketColor(b.label) }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: getBucketColor(b.label), textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{b.label}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#fff' }}>{totals[b.label] || 0}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
              {unresolvedTickets.length > 0 ? Math.round(((totals[b.label] || 0) / unresolvedTickets.length) * 100) + '%' : '0%'}
            </div>
          </div>
        ))}
      </div>

      {/* Selected group tags */}
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

      {/* Main table */}
      <div style={cardStyle}>
        <div style={{ fontWeight: 700, fontSize: 14, color: '#93c5fd', marginBottom: 16 }}>
          {view === 'date' ? 'Date-wise Aging' : view === 'group' ? 'Group-wise Aging' : 'Agent-wise Aging'}
        </div>
        {currentRows.length > 0 ? renderTable(currentRows) : (
          <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.3)' }}>No unresolved tickets found</div>
        )}
      </div>
    </div>
  )
}
