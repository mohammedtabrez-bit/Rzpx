import React, { createContext, useContext, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MdCheckCircle, MdError, MdInfo, MdClose } from 'react-icons/md'

type ToastType = 'success' | 'error' | 'info'
interface Toast { id: number; message: string; type: ToastType }
interface ToastContextValue { toast: (msg: string, type?: ToastType) => void }

const ToastContext = createContext<ToastContextValue>({ toast: () => {} })
export const useToast = () => useContext(ToastContext)

const ICONS = { success: MdCheckCircle, error: MdError, info: MdInfo }
const COLORS = {
  success: 'border-l-emerald-500 bg-white dark:bg-gray-900',
  error: 'border-l-red-500 bg-white dark:bg-gray-900',
  info: 'border-l-blue-500 bg-white dark:bg-gray-900',
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  let counter = 0

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++counter
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[999] flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map(t => {
            const Icon = ICONS[t.type]
            return (
              <motion.div
                key={t.id}
                initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 100, opacity: 0 }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-800 shadow-lg border-l-4 text-sm font-medium max-w-sm ${COLORS[t.type]}`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${t.type === 'success' ? 'text-emerald-500' : t.type === 'error' ? 'text-red-500' : 'text-blue-500'}`} />
                <span className="flex-1">{t.message}</span>
                <button onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))} className="ml-2 text-gray-400 hover:text-gray-600">
                  <MdClose className="w-4 h-4" />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
