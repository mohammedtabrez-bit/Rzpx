import { useState } from 'react'
import { MdFilterList, MdClear, MdSearch } from 'react-icons/md'
import { useApp } from '../context/AppContext'

export function FilterBar() {
  const { state, dispatch, applyFilters } = useApp()
  const { tickets, filters } = state
  const [localFilters, setLocalFilters] = useState(filters)
  const [groupOpen, setGroupOpen] = useState(false)
  const [selectedGroups, setSelectedGroups] = useState<string[]>(
    filters.group ? filters.group.split('||') : []
  )

  const uniq = (key: keyof typeof tickets[0]) =>
    [...new Set(tickets.map(t => String(t[key])).filter(Boolean))].sort()

  const groups = uniq('group')

  const set = (payload: Partial<typeof localFilters>) => {
    setLocalFilters(prev => ({ ...prev, ...payload }))
  }

  const handleSearch = () => {
    const groupVal = selectedGroups.length > 0 ? selectedGroups.join('||') : ''
    const newFilters = { ...localFilters, group: groupVal }
    dispatch({ type: 'SET_FILTER', payload: newFilters })
    const from = newFilters.dateFrom ? new Date(newFilters.dateFrom) : null
    const to = newFilters.dateTo ? new Date(newFilters.dateTo + 'T23:59:59') : null
    const search = newFilters.search.toLowerCase()
    const filtered = state.tickets.filter(t => {
      if (newFilters.agent && t.agent !== newFilters.agent) return false
      if (selectedGroups.length > 0 && !selectedGroups.includes(t.group)) return false
      if (newFilters.status && t.status !== newFilters.status) return false
      if (newFilters.priority && t.priority !== newFilters.priority) return false
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

  const handleClear = () => {
    setLocalFilters({ dateFrom: '', dateTo: '', agent: '', group: '', status: '', priority: '', search: '' })
    setSelectedGroups([])
    dispatch({ type: 'CLEAR_FILTERS' })
    setTimeout(applyFilters, 50)
  }

  const toggleGroup = (g: string) => {
    setSelectedGroups(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g])
  }

  const inputStyle = { background: '#040a14', border: '1px solid #0d2147', color: '#93c5fd', fontSize: 12, padding: '6px 10px', borderRadius: 8, outline: 'none' }
  const labelStyle = { fontSize: 10, fontWeight: 700, color: '#1e40af', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 3, display: 'block' }

  return (
    <div style={{ background: '#0a1628', border: '1px solid #0d2147', borderRadius: 12, padding: '12px 16px', marginBottom: 20 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={labelStyle}>From</span>
          <input type="date" style={{ ...inputStyle, width: 140 }} value={localFilters.dateFrom} onChange={e => set({ dateFrom: e.target.value })} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={labelStyle}>To</span>
          <input type="date" style={{ ...inputStyle, width: 140 }} value={localFilters.dateTo} onChange={e => set({ dateTo: e.target.value })} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={labelStyle}>Agent</span>
          <select style={{ ...inputStyle, width: 140 }} value={localFilters.agent} onChange={e => set({ agent: e.target.value })}>
            <option value="">All Agents</option>
            {[...new Set(tickets.map(t => t.agent).filter(Boolean))].sort().map(v => <option key={v}>{v}</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
          <span style={labelStyle}>Group / Team</span>
          <button
            onClick={() => setGroupOpen(o => !o)}
            style={{ ...inputStyle, width: 160, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
          >
            <span style={{ fontSize: 12, color: selectedGroups.length ? '#60a5fa' : '#3b82f6' }}>
              {selectedGroups.length === 0 ? 'All Groups' : `${selectedGroups.length} selected`}
            </span>
            <span style={{ color: '#3b82f6', fontSize: 10 }}>▼</span>
          </button>
          {groupOpen && (
            <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 100, background: '#040a14', border: '1px solid #0d2147', borderRadius: 8, width: 220, maxHeight: 220, overflowY: 'auto', marginTop: 4, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
              <div style={{ padding: '6px 10px', borderBottom: '1px solid #0d2147', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, color: '#3b82f6' }}>{selectedGroups.length} selected</span>
                <button onClick={() => setSelectedGroups([])} style={{ fontSize: 11, color: '#f97316', background: 'none', border: 'none', cursor: 'pointer' }}>Clear all</button>
              </div>
              {groups.map(g => (
                <label key={g} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', cursor: 'pointer', borderBottom: '1px solid #0a1628' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#0d2147')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <input type="checkbox" checked={selectedGroups.includes(g)} onChange={() => toggleGroup(g)} style={{ accentColor: '#2563eb', width: 13, height: 13 }} />
                  <span style={{ fontSize: 12, color: '#93c5fd' }}>{g}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={labelStyle}>Status</span>
          <select style={{ ...inputStyle, width: 120 }} value={localFilters.status} onChange={e => set({ status: e.target.value })}>
            <option value="">All</option>
            {[...new Set(tickets.map(t => t.status).filter(Boolean))].sort().map(v => <option key={v}>{v}</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={labelStyle}>Priority</span>
          <select style={{ ...inputStyle, width: 110 }} value={localFilters.priority} onChange={e => set({ priority: e.target.value })}>
            <option value="">All</option>
            {[...new Set(tickets.map(t => t.priority).filter(Boolean))].sort().map(v => <option key={v}>{v}</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={labelStyle}>Search Agent</span>
          <input
            type="text"
            style={{ ...inputStyle, width: 150 }}
            placeholder="Agent name..."
            value={localFilters.search}
            onChange={e => set({ search: e.target.value })}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
        </div>

        <button
          onClick={handleSearch}
          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', marginTop: 14 }}
        >
          <MdSearch className="w-4 h-4" /> Search
        </button>

        <button
          onClick={handleClear}
          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: 'transparent', color: '#3b82f6', border: '1px solid #0d2147', borderRadius: 8, fontSize: 12, cursor: 'pointer', marginTop: 14 }}
        >
          <MdClear className="w-3.5 h-3.5" /> Clear
        </button>

        <div style={{ marginLeft: 'auto', fontSize: 12, color: '#1e40af', marginTop: 14 }}>
          {state.filteredTickets.length.toLocaleString()} of {state.tickets.length.toLocaleString()} tickets
        </div>
      </div>

      {selectedGroups.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
          {selectedGroups.map(g => (
            <span key={g} style={{ fontSize: 11, background: '#1e3a8a', color: '#93c5fd', border: '1px solid #1e40af', padding: '3px 10px', borderRadius: 999, display: 'flex', alignItems: 'center', gap: 5 }}>
              {g}
              <button onClick={() => toggleGroup(g)} style={{ background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer', fontSize: 13, lineHeight: 1 }}>×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
