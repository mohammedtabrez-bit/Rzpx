import { useRef } from 'react'
import {
  MdMenu, MdDarkMode, MdLightMode, MdUpload,
  MdRefresh, MdFileDownload, MdLogout, MdTableChart, MdSync,
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

  const agents = Object.values(buildAgentStats(state.filteredTickets, state.settings))

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processFile(file).then(() => toast('Data loaded successfully!', 'success'))
        .catch(() => toast('Failed to process file', 'error'))
    }
    e.target.value = ''
  }

  const handleSync = async () => {
    toast('Syncing from Freshdesk...', 'info')
    await fetchTickets()
    toast('Freshdesk data synced!', 'success')
  }

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 flex items-center px-4 gap-3">
      <div className="flex items-center gap-2 mr-2">
        <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center">
          <MdTableChart className="text-white w-4 h-4" />
        </div>
        <span className="font-bold text-brand-700 dark:text-brand-400 hidden sm:block text-sm">FD Dashboard</span>
      </div>

      <button
        className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 lg:hidden"
        onClick={() => dispatch({ type: 'SET_SIDEBAR', payload: !state.sidebarOpen })}
      >
        <MdMenu className="w-5 h-5" />
      </button>

      <div className="flex-1 flex items-center justify-center gap-3">
        <span className="text-xs font-medium text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 rounded-full border border-gray-100 dark:border-gray-700 hidden md:block">
          {new Date().toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
        </span>
        {lastSync && (
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1.5 rounded-full border border-emerald-100 dark:border-emerald-900 hidden lg:block">
            Last sync: {lastSync.toLocaleTimeString()}
          </span>
        )}
        {state.lastUpload && !lastSync && (
          <span className="text-xs font-medium text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/30 px-3 py-1.5 rounded-full border border-brand-100 dark:border-brand-900 hidden lg:block">
            {state.lastUpload.rows.toLocaleString()} tickets · {state.lastUpload.name}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <input type="file" ref={fileRef} accept=".csv,.xlsx,.xls" className="hidden" onChange={handleUpload} />

        <button
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
          onClick={handleSync}
          disabled={syncing}
          title="Sync from Freshdesk"
        >
          <MdSync className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:block">{syncing ? 'Syncing...' : 'Sync Now'}</span>
        </button>

        <button
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-brand-600 text-white hover:bg-brand-700 transition-colors disabled:opacity-50"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
        >
          {uploading
            ? <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            : <MdUpload className="w-3.5 h-3.5" />
          }
          <span className="hidden sm:block">Upload</span>
        </button>

        <button onClick={() => { exportAgentsToExcel(agents); toast('Excel exported!', 'success') }} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hidden sm:block" title="Export Excel">
          <MdFileDownload className="w-4 h-4" />
        </button>

        <button
          onClick={() => dispatch({ type: 'TOGGLE_DARK' })}
          className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
        >
          {state.darkMode ? <MdLightMode className="w-4 h-4" /> : <MdDarkMode className="w-4 h-4" />}
        </button>

        {state.user && (
          <div className="flex items-center gap-2 ml-1">
            {state.user.photoURL
              ? <img src={state.user.photoURL} alt="" className="w-7 h-7 rounded-full" />
              : <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-bold">
                  {(state.user.displayName || state.user.email || 'U').charAt(0).toUpperCase()}
                </div>
            }
            <button onClick={() => logout()} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500" title="Logout">
              <MdLogout className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}
