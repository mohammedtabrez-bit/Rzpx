import React, { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import clsx from 'clsx'

interface KPICardProps {
  icon: React.ReactNode
  title: string
  value: string | number
  unit?: string
  target?: string
  achievePct?: number
  color?: 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'indigo'
  trend?: { value: number; label: string }
  animate?: boolean
}

const COLOR_MAP = {
  blue: { bar: 'from-blue-400 to-blue-600', icon: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400', top: 'from-blue-400 to-blue-600' },
  green: { bar: 'from-emerald-400 to-emerald-600', icon: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400', top: 'from-emerald-400 to-emerald-600' },
  orange: { bar: 'from-amber-400 to-orange-500', icon: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400', top: 'from-amber-400 to-orange-500' },
  red: { bar: 'from-red-400 to-red-600', icon: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400', top: 'from-red-400 to-red-600' },
  purple: { bar: 'from-purple-400 to-purple-600', icon: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400', top: 'from-purple-400 to-purple-600' },
  indigo: { bar: 'from-indigo-400 to-indigo-600', icon: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400', top: 'from-indigo-400 to-indigo-600' },
}

export function KPICard({ icon, title, value, unit = '', target, achievePct, color = 'blue', trend, animate = true }: KPICardProps) {
  const c = COLOR_MAP[color]
  const pct = achievePct != null ? Math.min(100, Math.max(0, achievePct)) : null
  const badgeCls = pct == null ? '' : pct >= 100 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : pct >= 80 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'

  return (
    <motion.div
      className="card card-hover relative overflow-hidden"
      initial={animate ? { opacity: 0, y: 16 } : {}}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Top accent bar */}
      <div className={clsx('absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r', c.top)} />

      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className={clsx('p-2 rounded-xl text-xl', c.icon)}>{icon}</div>
          {pct != null && (
            <span className={clsx('text-xs font-semibold px-2 py-0.5 rounded-full', badgeCls)}>
              {Math.round(pct)}%
            </span>
          )}
        </div>
        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">{title}</div>
        <div className="text-2xl font-extrabold text-gray-900 dark:text-white leading-none mb-1">
          {value}<span className="text-sm font-medium text-gray-400 ml-0.5">{unit}</span>
        </div>
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>{target ? `Target: ${target}` : '\u00a0'}</span>
          {trend && (
            <span className={clsx('font-semibold', trend.value >= 0 ? 'text-emerald-500' : 'text-red-500')}>
              {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%
            </span>
          )}
        </div>
        {pct != null && (
          <div className="mt-2 h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              className={clsx('h-full rounded-full bg-gradient-to-r', c.bar)}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, delay: 0.2 }}
            />
          </div>
        )}
      </div>
    </motion.div>
  )
}
