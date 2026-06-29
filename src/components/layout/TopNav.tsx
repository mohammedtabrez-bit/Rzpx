import { useRef } from 'react'
import {
  MdMenu, MdDarkMode, MdLightMode, MdUpload,
  MdFileDownload, MdLogout, MdSync, MdStar,
} from 'react-icons/md'
import { useApp } from '../../context/AppContext'
import { useFileUpload } from '../../hooks/useFileUpload'
import { useToast } from '../ui/Toast'
import { logout } from '../../firebase/auth'
import { exportAgentsToExcel } from '../../utils/export'
import { buildAgentStats } from '../../utils/dataProcessor'
import { useFreshdeskSync } from '../../hooks/useFreshdeskSync'

export function TopNav() {
  const { state, dispatch } = useApp()
  const { processFile, uploading } = useFileUpload()
  const { toast } = useToast()
  const { syncing, lastSync, fetchTickets } = useFreshdeskSync()
  const fileRef = useRef<HTMLInputElement>(null)
  const csatRef = useRef<HTMLInputElement>(null)

  const agents = Object.values(buildAgentStats(state.filteredTickets, state.settings))

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processFile(file).then(() => toast('Data loaded!', 'success')).catch(() => toast('Failed to process file', 'error'))
    }
    e.target.value = ''
  }

  const handleCsatUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string
        const newline = '\n'
        const lines = text.split(newline).map(l => l.replace(/\r$/, '')).filter(l => l.trim())
        if (lines.length < 2) { toast('CSAT file is empty', 'error'); return }
        const headers = parseCSVLine(lines[0])
        const ticketIdIdx = headers.findIndex(h => h.toLowerCase().includes('ticket'))
        const ratingIdx = headers.findIndex(h => h.toLowerCase().includes('rating'))
        if (ticketIdIdx === -1 || ratingIdx === -1) { toast('Cannot find Ticket Id or Rating columns', 'error'); return }
        const csatMap: Record<string, number> = {}
        lines.slice(1).forEach(line => {
          const vals = parseCSVLine(line)
          const ticketId = vals[ticketIdIdx]?.trim()
          const rating = vals[ratingIdx]?.trim().toLowerCase()
          if (ticketId && rating) {
            csatMap[ticketId] = rating === 'satisfied' ? 100 : rating === 'neutral' ? 60 : 0
          }
        })
        const updated = state.rawData.map((row: any) => {
          const tid = String(row['Ticket ID'] || row['ticket id'] || row['id'] || '')
          if (csatMap[tid] !== undefined) return { ...row, 'CSAT': csatMap[tid] }
          return row
        })
        dispatch({ type: 'SET_RAW_DATA', payload: { raw: updated as any, name: state.lastUpload?.name || 'data' } })
        localStorage.setItem('fd_csat_last_upload', new Date().toISOString())
        toast('CSAT mapped for ' + Object.keys(csatMap).length + ' tickets!', 'success')
      } catch { toast('Failed to process CSAT file', 'error') }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleSync = async () => {
    toast('Syncing from Freshdesk...', 'info')
    await fetchTickets()
    toast('Freshdesk data synced!', 'success')
  }

  const divider = ' | '

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 z-50 flex items-center px-4 gap-3"
      style={{ background: 'rgba(1,1,8,0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>

      <div className="flex items-center gap-2 mr-2">
        <div style={{ width: 4, height: 22, background: '#3b82f6', borderRadius: 3 }} />
        <span style={{ color: '#fff', fontWeight: 800, fontSize: 22, letterSpacing: '-1px', fontFamily: 'Space Grotesk, sans-serif' }}>Razorpay</span>
        <span style={{ color: '#f97316', fontWeight: 800, fontSize: 22, letterSpacing: '-1px', fontFamily: 'Space Grotesk, sans-serif' }}>X</span>
        <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 16, margin: '0 2px' }}>{divider}</span>
        <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, fontWeight: 500 }}>Dashboard</span>
      </div>

      <button
        className="p-2 rounded-xl lg:hidden"
        style={{ color: 'rgba(255,255,255,0.6)' }}
        onClick={() => dispatch({ type: 'SET_SIDEBAR', payload: !state.sidebarOpen })}
      >
        <MdMenu className="w-5 h-5" />
      </button>

      <div className="flex-1 flex items-center justify-center gap-3">
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', padding: '4px 12px', borderRadius: 999 }} className="hidden md:block">
          {new Date().toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
        </span>
        {lastSync && (
          <span style={{ fontSize: 12, color: '#4ade80', background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', padding: '4px 12px', borderRadius: 999 }} className="hidden lg:block">
            {'Last sync: ' + lastSync.toLocaleTimeString()}
          </span>
        )}
        {state.lastUpload && !lastSync && (
          <span style={{ fontSize: 12, color: '#60a5fa', background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.15)', padding: '4px 12px', borderRadius: 999 }} className="hidden lg:block">
            {state.lastUpload.rows.toLocaleString() + ' tickets'}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <input type="file" ref={fileRef} accept=".csv,.xlsx,.xls" className="hidden" onChange={handleUpload} />
        <input type="file" ref={csatRef} accept=".csv" className="hidden" onChange={handleCsatUpload} />

        <button
          style={{ background: 'rgba(22,101,52,0.8)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.3)', padding: '6px 12px', borderRadius: 10, fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5, backdropFilter: 'blur(8px)' }}
          onClick={handleSync} disabled={syncing}
        >
          <MdSync className={'w-3.5 h-3.5 ' + (syncing ? 'animate-spin' : '')} />
          <span className="hidden sm:block">{syncing ? 'Syncing...' : 'Sync Now'}</span>
        </button>

        <button
          style={{ background: 'rgba(120,53,15,0.8)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)', padding: '6px 12px', borderRadius: 10, fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5, backdropFilter: 'blur(8px)' }}
          onClick={() => csatRef.current?.click()}
        >
          <MdStar className="w-3.5 h-3.5" />
          <span className="hidden sm:block">Upload CSAT</span>
        </button>

        <button
          style={{ background: 'rgba(30,58,138,0.8)', color: '#93c5fd', border: '1px solid rgba(147,197,253,0.2)', padding: '6px 12px', borderRadius: 10, fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5, backdropFilter: 'blur(8px)' }}
          onClick={() => fileRef.current?.click()} disabled={uploading}
        >
          <MdUpload className="w-3.5 h-3.5" />
          <span className="hidden sm:block">Upload</span>
        </button>

        <button
          onClick={() => { exportAgentsToExcel(agents); toast('Excel exported!', 'success') }}
          style={{ padding: 7, borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}
        >
          <MdFileDownload className="w-4 h-4" />
        </button>

        <button
          onClick={() => dispatch({ type: 'TOGGLE_DARK' })}
          style={{ padding: 7, borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}
        >
          {state.darkMode ? <MdLightMode className="w-4 h-4" /> : <MdDarkMode className="w-4 h-4" />}
        </button>

        {state.user && (
          <div className="flex items-center gap-2 ml-1">
            {state.user.photoURL
              ? <img src={state.user.photoURL} alt="" className="w-7 h-7 rounded-full" style={{ border: '2px solid rgba(255,255,255,0.2)' }} />
              : <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(30,58,138,0.8)', border: '2px solid rgba(147,197,253,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#93c5fd', fontSize: 11, fontWeight: 700 }}>
                  {(state.user.displayName || state.user.email || 'U').charAt(0).toUpperCase()}
                </div>
            }
            <button onClick={() => logout()} style={{ padding: 7, borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}>
              <MdLogout className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let cur = '', inQ = false
  for (const ch of line) {
    if (ch === '"') inQ = !inQ
    else if (ch === ',' && !inQ) { result.push(cur.trim()); cur = '' }
    else cur += ch
  }
  result.push(cur.trim())
  return result
}
