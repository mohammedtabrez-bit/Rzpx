import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { TopNav } from './TopNav'
import { Sidebar } from './Sidebar'
import { useApp } from '../../context/AppContext'
import { SpaceBackground } from '../SpaceBackground'
import clsx from 'clsx'
import { MdStar, MdClose, MdOpenInNew } from 'react-icons/md'

const CSAT_URL = 'https://razorpayx.freshdesk.com/a/reports/customer_satisfaction'
const CSAT_KEY = 'fd_csat_last_upload'

export function Layout() {
  const { state } = useApp()
  const [showBanner, setShowBanner] = useState(false)
  const [lastCsatUpload, setLastCsatUpload] = useState<string | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem(CSAT_KEY)
    setLastCsatUpload(stored)
    if (!stored) { setShowBanner(true); return }
    const last = new Date(stored)
    const hours = (Date.now() - last.getTime()) / 1000 / 3600
    if (hours > 24) setShowBanner(true)
  }, [])

  const handleCsatClick = () => {
    const now = new Date().toISOString()
    localStorage.setItem(CSAT_KEY, now)
    setLastCsatUpload(now)
    setShowBanner(false)
    window.open(CSAT_URL, '_blank')
  }

  const hoursAgo = lastCsatUpload
    ? Math.round((Date.now() - new Date(lastCsatUpload).getTime()) / 1000 / 3600)
    : null

  return (
    <div id="dashboard-root" style={{ minHeight: '100vh', background: '#010108', position: 'relative' }}>
      <SpaceBackground />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <TopNav />
        {showBanner && state.tickets.length > 0 && (
          <div style={{
            position: 'fixed', top: 64, left: 0, right: 0, zIndex: 80,
            background: 'rgba(120,53,15,0.95)',
            backdropFilter: 'blur(8px)',
            borderBottom: '1px solid #b45309',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '8px 16px', gap: 12, flexWrap: 'wrap',
          }}>
            <MdStar style={{ color: '#fbbf24', width: 16, height: 16, flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: '#fef3c7', fontWeight: 500 }}>
              {hoursAgo === null
                ? 'CSAT data has never been uploaded — upload now for accurate satisfaction scores'
                : 'CSAT data is ' + hoursAgo + 'h old — upload latest export for accurate scores'
              }
            </span>
            <button onClick={handleCsatClick} style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#fbbf24', color: '#78350f', border: 'none', borderRadius: 6, padding: '4px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              Open Freshdesk CSAT <MdOpenInNew style={{ width: 12, height: 12 }} />
            </button>
            <span style={{ fontSize: 11, color: '#fde68a' }}>Export CSV → come back → click Upload CSAT</span>
            <button onClick={() => setShowBanner(false)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#fbbf24', cursor: 'pointer', padding: 4 }}>
              <MdClose style={{ width: 16, height: 16 }} />
            </button>
          </div>
        )}
        <Sidebar />
        <main className={clsx(
          'transition-all duration-200 lg:pl-56',
          showBanner && state.tickets.length > 0 ? 'pt-[104px]' : 'pt-16'
        )}>
          <div className="p-4 md:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
