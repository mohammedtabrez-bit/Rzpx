import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MdDashboard, MdPeople, MdBarChart, MdLightbulb, MdSettings,
  MdClose,
} from 'react-icons/md'
import { useApp } from '../../context/AppContext'
import clsx from 'clsx'

const NAV = [
  { to: '/', label: 'Overview', icon: MdDashboard, section: 'Main' },
  { to: '/agents', label: 'Agents', icon: MdPeople },
  { to: '/analytics', label: 'Analytics', icon: MdBarChart },
  { to: '/insights', label: 'AI Insights', icon: MdLightbulb },
  { to: '/settings', label: 'Settings', icon: MdSettings, section: 'Config' },
]

export function Sidebar() {
  const { state, dispatch } = useApp()
  const { pathname } = useLocation()

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {state.sidebarOpen && (
          <motion.div
            className="fixed inset-0 bg-black/40 z-30 lg:hidden"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => dispatch({ type: 'SET_SIDEBAR', payload: false })}
          />
        )}
      </AnimatePresence>

      <motion.aside
        className={clsx(
          'fixed top-16 bottom-0 left-0 z-40 w-56 bg-white dark:bg-gray-900',
          'border-r border-gray-100 dark:border-gray-800',
          'flex flex-col py-4 px-3 transition-transform duration-200',
          'lg:translate-x-0',
          !state.sidebarOpen && '-translate-x-full'
        )}
      >
        <button
          className="lg:hidden absolute top-3 right-3 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
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
                  <div className="text-[11px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-600 px-3 pt-4 pb-1">
                    {item.section}
                  </div>
                )}
                <NavLink
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) => clsx(
                    'sidebar-item group',
                    isActive && 'active'
                  )}
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <motion.div
                          layoutId="sidebar-active"
                          className="absolute inset-0 rounded-xl bg-brand-50 dark:bg-brand-900/30"
                          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        />
                      )}
                      <item.icon className="w-4.5 h-4.5 relative z-10" />
                      <span className="relative z-10">{item.label}</span>
                    </>
                  )}
                </NavLink>
              </React.Fragment>
            )
          })}
        </nav>

        {/* Bottom info */}
        {state.lastUpload && (
          <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-800 px-2">
            <div className="text-xs text-gray-400 dark:text-gray-600">Last upload</div>
            <div className="text-xs font-medium text-gray-600 dark:text-gray-400 truncate">{state.lastUpload.name}</div>
            <div className="text-xs text-gray-400">{state.lastUpload.rows.toLocaleString()} tickets</div>
          </div>
        )}
        <div className="text-center text-[10px] text-gray-300 dark:text-gray-700 mt-3">v1.0 · Freshdesk Dashboard</div>
      </motion.aside>
    </>
  )
}
