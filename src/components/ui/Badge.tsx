import React from 'react'
import clsx from 'clsx'

interface BadgeProps { children: React.ReactNode; color?: 'green' | 'blue' | 'orange' | 'red' | 'purple' | 'gray'; className?: string }

const COLORS = {
  green: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  orange: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  red: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  gray: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
}

export function Badge({ children, color = 'gray', className }: BadgeProps) {
  return <span className={clsx('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold', COLORS[color], className)}>{children}</span>
}
