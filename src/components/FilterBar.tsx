import React from 'react'
import { MdFilterList, MdClear } from 'react-icons/md'
import { useApp } from '../context/AppContext'
import clsx from 'clsx'

export function FilterBar() {
  const { state, dispatch, applyFilters } = useApp()
  const { tickets, filters } = state

  const uniq = (key: keyof typeof tickets[0]) =>
    [...new Set(tickets.map(t => String(t[key])).filter(Boolean))].sort()

  const set = (payload: Partial<typeof filters>) => {
    dispatch({ type: 'SET_FILTER', payload })
    // Slight delay to batch the filter apply
    setTimeout(applyFilters, 50)
  }

  const hasFilters = Object.values(filters).some(v => !!v)

  const inputCls = 'input text-xs py-1.5'

  return (
    <div className="card p-3 mb-5 flex flex-wrap gap-2 items-center">
      <MdFilterList className="text-gray-400 w-4 h-4 flex-shrink-0" />

      <div className="flex flex-col gap-0.5">
        <span className="label">From</span>
        <input type="date" className={clsx(inputCls, 'w-36')} value={filters.dateFrom} onChange={e => set({ dateFrom: e.target.value })} />
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="label">To</span>
        <input type="date" className={clsx(inputCls, 'w-36')} value={filters.dateTo} onChange={e => set({ dateTo: e.target.value })} />
      </div>

      {(['agent', 'group', 'status', 'priority'] as const).map(field => (
        <div key={field} className="flex flex-col gap-0.5">
          <span className="label">{field.charAt(0).toUpperCase() + field.slice(1)}</span>
          <select
            className={clsx(inputCls, 'w-32')}
            value={filters[field]}
            onChange={e => set({ [field]: e.target.value })}
          >
            <option value="">All</option>
            {uniq(field).map(v => <option key={v}>{v}</option>)}
          </select>
        </div>
      ))}

      <div className="flex flex-col gap-0.5">
        <span className="label">Search</span>
        <input
          type="text"
          className={clsx(inputCls, 'w-36')}
          placeholder="Agent name..."
          value={filters.search}
          onChange={e => set({ search: e.target.value })}
        />
      </div>

      {hasFilters && (
        <button
          className="btn-ghost text-xs px-3 py-1.5 mt-3.5 flex items-center gap-1"
          onClick={() => { dispatch({ type: 'CLEAR_FILTERS' }); setTimeout(applyFilters, 50) }}
        >
          <MdClear className="w-3.5 h-3.5" />
          Clear
        </button>
      )}

      <div className="ml-auto text-xs text-gray-400 mt-3.5 font-medium">
        {state.filteredTickets.length.toLocaleString()} of {state.tickets.length.toLocaleString()} tickets
      </div>
    </div>
  )
}
