import React from 'react'
import { Outlet } from 'react-router-dom'
import { TopNav } from './TopNav'
import { Sidebar } from './Sidebar'
import { useApp } from '../../context/AppContext'
import clsx from 'clsx'

export function Layout() {
  const { state } = useApp()
  return (
    <div id="dashboard-root" className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <TopNav />
      <Sidebar />
      <main className={clsx('pt-16 transition-all duration-200', state.sidebarOpen ? 'lg:pl-56' : '')}>
        <div className="p-4 md:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
