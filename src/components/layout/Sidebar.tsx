import React from 'react'
import { NavLink } from 'react-router-dom'
import { MdDashboard, MdPeople, MdBarChart, MdLightbulb, MdSettings, MdClose, MdSchedule } from 'react-icons/md'
import { useApp } from '../../context/AppContext'
import clsx from 'clsx'

const NAV = [
  { to: '/', label: 'Overview', icon: MdDashboard, section: 'Main' },
  { to: '/agents', label: 'Agents', icon: MdPeople },
  { to: '/analytics', label: 'Analytics', icon: MdBarChart },
  { to: '/aging', label: 'Ticket Aging', icon: MdSchedule },
  { to: '/insights', label: 'AI Insights', icon: MdLightbulb },
  { to: '/settings', label: 'Settings', icon: MdSettings, section: 'Config' },
]

export function Sidebar() {
  const { state, dispatch } = useApp()

  return (
    <>
      {state.sidebarOpen && (
        <div
          className="fixed inset-0 z-30 lg:hidden"
          style={{ background: 'rgba(1,1,8,0.8)' }}
          onClick={() => dispatch({ type: 'SET_SIDEBAR', payload: false })}
        />
      )}

      <aside
        className={clsx(
          'fixed top-16 bottom-0 left-0 z-40 w-56 flex flex-col py-4 px-3 transition-transform duration-200 lg:translate-x-0',
          !state.sidebarOpen && '-translate-x-full'
        )}
        style={{ background: 'rgba(1,1,8,0.85)', backdropFilter: 'blur(12px)', borderRight: '1px solid rgba(255,255,255,0.06)' }}
      >
        <button
          className="lg:hidden absolute top-3 right-3 p-1 rounded-lg"
          style={{ color: 'rgba(255,255,255,0.5)' }}
          onClick={() => dispatch({ type: 'SET_SIDEBAR', payload: false })}
        >
          <MdClose className="w-5 h-5" />
        </button>

        <nav className="flex flex-col gap-0.5 flex-1">
          {NAV.map((item, i) => {
            const prev = i > 0 ? NAV[i - 1] : null
            return (
              <React.Fragment key={item.to}>
                {item.section && item.section !== prev?.section && (
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '12px 12px 4px' }}>
                    {item.section}
                  </div>
                )}
                <NavLink
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) => clsx('sidebar-item group', isActive && 'active')}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              </React.Fragment>
            )
          })}
        </nav>

        {state.lastUpload && (
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12, paddingLeft: 8, paddingRight: 8, marginTop: 'auto' }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>Last upload</div>
            <div style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.5)' }} className="truncate">{state.lastUpload.name}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>{state.lastUpload.rows.toLocaleString()} tickets</div>
          </div>
        )}
        <div style={{ textAlign: 'center', fontSize: 10, color: 'rgba(255,255,255,0.15)', marginTop: 12 }}>
          RazorpayX Dashboard v2.0
        </div>
      </aside>
    </>
  )
}
