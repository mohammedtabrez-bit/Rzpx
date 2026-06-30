import { useState, useMemo, useEffect } from 'react'
import { MdFileDownload, MdRefresh, MdOpenInNew } from 'react-icons/md'
import * as XLSX from 'xlsx'
import { useCsatData } from '../hooks/useCsatData'

const ALLOWED_GROUPS = [
  'Enterprise Support', 'Operations', 'CXO Desk', 'Support',
  'X-Downtime', 'Banking Ops', 'XPayroll Enterprise', 'XPayroll Support', 'Xpayroll Operations',
]

const FD_BASE = 'https://razorpayx.freshdesk.com'

export function SurveyPage() {
  const { records, loading, error, fetchSurveyData } = useCsatData()
  const [selectedGroups, setSelectedGroups] = useState<string[]>([])
  const [groupOpen, setGroupOpen] = useState(false)
  const [ratingFilter, setRatingFilter] = useState<'all' | 'satisfied' | 'dissatisfied'>('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (records.length === 0) fetchSurveyData()
  }, [])

  const toggleGroup = (g: string) => {
    setSelectedGroups(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g])
  }

  const filtered = useMemo(() => {
    return records.filter(r => {
      if (selectedGroups.length > 0 && !selectedGroups.includes(r.groupName)) return false
      if (ratingFilter === 'satisfied' && r.rating <= 0) return false
      if (ratingFilter === 'dissatisfied' && r.rating > 0) return false
      if (search && !r.agentName.toLowerCase().includes(search.toLowerCase()) && !String(r.ticketId).includes(search)) return false
      return true
    }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }, [records, selectedGroups, ratingFilter, search])

  const stats = useMemo(() => {
    const total = filtered.length
    const satisfied = filtered.filter(r => r.rating > 0).length
    const dissatisfied = total - satisfied
    const csatPct = total > 0 ? (satisfied / total) * 100 : 0
    return { total, satisfied, dissatisfied, csatPct }
  }, [filtered])

  const groupBreakdown = useMemo(() => {
    const map: Record<string, { satisfied: number; dissatisfied: number }> = {}
    filtered.forEach(r => {
      if (!map[r.groupName]) map[r.groupName] = { satisfied: 0, dissatisfied: 0 }
      if (r.rating > 0) map[r.groupName].satisfied++
      else map[r.groupName].dissatisfied++
    })
    return Object.entries(map).sort((a, b) => (b[1].satisfied + b[1].dissatisfied) - (a[1].satisfied + a[1].dissatisfied))
  }, [filtered])

  const exportExcel = () => {
    const rows = filtered.map(r => ({
      'Date': r.createdAt.toLocaleDateString('en-IN'),
      "Month'Year": r.createdAt.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
      'Rating': r.ratingLabel,
      'Group': r.groupName,
      'Ticket Id': r.ticketId,
      'Agent Name': r.agentName,
      'Merchant Dissatisfied Comment': r.rating <= 0 ? r.feedback : '',
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'CSAT Survey')
    XLSX.writeFile(wb, 'csat-survey-' + new Date().toISOString().slice(0, 10) + '.xlsx')
  }

  const inputStyle = { background: '#040a14', border: '1px solid rgba(255,255,255,0.1)', color: '#93c5fd', fontSize: 12, padding: '6px 10px', borderRadius: 8, outline: 'none' }
  const cardStyle = { background: 'rgba(10,22,40,0.7)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 20 }

  if (loading && records.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '64px 24px' }}>
        <div style={{ width: 40, height: 40, border: '4px solid rgba(59,130,246,0.3)', borderTopColor: '#3b82f6', borderRadius: '50%', margin: '0 auto 20px', animation: 'spin 1s linear infinite' }} />
        <div style={{ fontWeight: 600, fontSize: 16, color: '#60a5fa' }}>Loading survey data...</div>
      </div>
    )
  }

  if (!loading && records.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '64px 24px' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⭐</div>
        <div style={{ fontWeight: 600, fontSize: 18, color: '#60a5fa' }}>No survey data loaded</div>
        <button onClick={fetchSurveyData} style={{ marginTop: 16, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          <MdRefresh className="w-4 h-4" /> Fetch Survey Data
        </button>
        {error && <div style={{ marginTop: 12, color: '#f87171', fontSize: 12 }}>{error}</div>}
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 4 }}>CSAT / DSAT Survey</h1>
          <p style={{ fontSize: 14, color: '#3b82f6' }}>
            {filtered.length.toLocaleString()} responses
            {selectedGroups.length > 0 ? ' · ' + selectedGroups.join(', ') : ' · All groups'}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={fetchSurveyData} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', background: 'rgba(22,101,52,0.8)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.3)', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            <MdRefresh className={'w-4 h-4 ' + (loading ? 'animate-spin' : '')} /> {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          <button onClick={exportExcel} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', background: 'rgba(30,58,138,0.8)', color: '#93c5fd', border: '1px solid rgba(147,197,253,0.2)', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            <MdFileDownload className="w-4 h-4" /> Export Excel
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
        <div style={{ ...cardStyle, padding: '14px 16px', borderTop: '2px solid #3b82f6' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Total Responses</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#fff' }}>{stats.total}</div>
        </div>
        <div style={{ ...cardStyle, padding: '14px 16px', borderTop: '2px solid #22c55e' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Satisfied</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#4ade80' }}>{stats.satisfied}</div>
        </div>
        <div style={{ ...cardStyle, padding: '14px 16px', borderTop: '2px solid #ef4444' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Dissatisfied</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#f87171' }}>{stats.dissatisfied}</div>
        </div>
        <div style={{ ...cardStyle, padding: '14px 16px', borderTop: '2px solid #f59e0b' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>CSAT %</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#fbbf24' }}>{stats.csatPct.toFixed(1)}%</div>
        </div>
      </div>

      <div style={{ ...cardStyle, padding: '14px 18px', marginBottom: 20, display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', position: 'relative', zIndex: 50 }}>
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: 3, border: '1px solid rgba(255,255,255,0.08)' }}>
          {(['all', 'satisfied', 'dissatisfied'] as const).map(r => (
            <button key={r} onClick={() => setRatingFilter(r)} style={{ padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer', textTransform: 'capitalize', background: ratingFilter === r ? (r === 'satisfied' ? '#16a34a' : r === 'dissatisfied' ? '#dc2626' : '#1d4ed8') : 'transparent', color: ratingFilter === r ? '#fff' : 'rgba(255,255,255,0.4)' }}>
              {r}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', zIndex: 60 }}>
          <button onClick={() => setGroupOpen(o => !o)} style={{ ...inputStyle, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
            <span style={{ color: selectedGroups.length ? '#60a5fa' : 'rgba(255,255,255,0.4)' }}>
              {selectedGroups.length === 0 ? 'All Groups' : selectedGroups.length + ' selected'}
            </span>
            <span style={{ color: '#3b82f6', fontSize: 10 }}>▼</span>
          </button>
          {groupOpen && (
            <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 1000, background: '#040a14', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, width: 220, maxHeight: 240, overflowY: 'auto', marginTop: 4, boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}>
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

        <input
          type="text"
          placeholder="Search agent or ticket ID..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...inputStyle, width: 220 }}
        />

        <div style={{ marginLeft: 'auto', fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
          {filtered.length} of {records.length} responses
        </div>
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

      <div style={{ ...cardStyle, marginBottom: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: '#93c5fd', marginBottom: 14 }}>Group-wise Breakdown</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: 'rgba(4,10,20,0.8)' }}>
                <th style={{ padding: '8px 12px', textAlign: 'left', color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Group</th>
                <th style={{ padding: '8px 12px', textAlign: 'center', color: '#4ade80', fontSize: 11, fontWeight: 700 }}>Satisfied</th>
                <th style={{ padding: '8px 12px', textAlign: 'center', color: '#f87171', fontSize: 11, fontWeight: 700 }}>Dissatisfied</th>
                <th style={{ padding: '8px 12px', textAlign: 'center', color: '#fbbf24', fontSize: 11, fontWeight: 700 }}>CSAT %</th>
                <th style={{ padding: '8px 12px', textAlign: 'center', color: '#60a5fa', fontSize: 11, fontWeight: 700 }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {groupBreakdown.map(([group, d]) => {
                const total = d.satisfied + d.dissatisfied
                const pct = total > 0 ? (d.satisfied / total) * 100 : 0
                return (
                  <tr key={group} style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '8px 12px', color: '#93c5fd' }}>{group}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'center', color: '#4ade80', fontWeight: 600 }}>{d.satisfied}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'center', color: '#f87171', fontWeight: 600 }}>{d.dissatisfied}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'center', color: pct >= 85 ? '#4ade80' : pct >= 70 ? '#fbbf24' : '#f87171', fontWeight: 700 }}>{pct.toFixed(1)}%</td>
                    <td style={{ padding: '8px 12px', textAlign: 'center', color: '#fff', fontWeight: 700 }}>{total}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div style={cardStyle}>
        <div style={{ fontWeight: 700, fontSize: 14, color: '#93c5fd', marginBottom: 16 }}>Detailed Survey Responses</div>
        <div style={{ overflowX: 'auto', maxHeight: 500, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead style={{ position: 'sticky', top: 0, background: '#040a14', zIndex: 1 }}>
              <tr>
                {['Date', "Month'Year", 'Rating', 'Group', 'Ticket Id', 'Agent Name', 'Merchant Comment'].map(h => (
                  <th key={h} style={{ padding: '9px 12px', textAlign: 'left', color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 500).map(r => (
                <tr key={r.id} style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '8px 12px', color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap' }}>{r.createdAt.toLocaleDateString('en-IN')}</td>
                  <td style={{ padding: '8px 12px', color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap' }}>{r.createdAt.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</td>
                  <td style={{ padding: '8px 12px' }}>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: r.rating > 0 ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', color: r.rating > 0 ? '#4ade80' : '#f87171' }}>
                      {r.ratingLabel}
                    </span>
                  </td>
                  <td style={{ padding: '8px 12px', color: 'rgba(255,255,255,0.5)' }}>{r.groupName}</td>
                  <td style={{ padding: '8px 12px' }}>
                    <a href={FD_BASE + '/a/tickets/' + r.ticketId} target="_blank" rel="noopener noreferrer"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: '#60a5fa', fontWeight: 600, textDecoration: 'none' }}
                    >
                      {'#' + r.ticketId} <MdOpenInNew style={{ width: 9, height: 9 }} />
                    </a>
                  </td>
                  <td style={{ padding: '8px 12px', color: '#93c5fd' }}>{r.agentName}</td>
                  <td style={{ padding: '8px 12px', color: 'rgba(255,255,255,0.4)', maxWidth: 250 }}>
                    {r.rating <= 0 && r.feedback ? r.feedback : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length > 500 && (
            <div style={{ textAlign: 'center', padding: 16, color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>
              Showing first 500 of {filtered.length} — export to Excel for full data
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
