import React from 'react'
import clsx from 'clsx'
import { motion } from 'framer-motion'

interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  animate?: boolean
  onClick?: () => void
}

export function Card({ children, className, hover, animate, onClick }: CardProps) {
  const base = 'card'
  const cls = clsx(base, hover && 'card-hover cursor-pointer', className)
  if (animate) {
    return (
      <motion.div
        className={cls}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        onClick={onClick}
      >
        {children}
      </motion.div>
    )
  }
  return <div className={cls} onClick={onClick}>{children}</div>
}
