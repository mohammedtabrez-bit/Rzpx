import { useState } from 'react'
import { motion } from 'framer-motion'
import { MdTableChart } from 'react-icons/md'
import { FcGoogle } from 'react-icons/fc'
import { signInWithGoogle, signInWithEmail, registerWithEmail } from '../firebase/auth'
import { useToast } from '../components/ui/Toast'

export function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleGoogle = async () => {
    try { await signInWithGoogle() }
    catch (e: unknown) { toast((e instanceof Error ? e.message : 'Google sign-in failed'), 'error') }
  }

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (mode === 'login') await signInWithEmail(email, password)
      else await registerWithEmail(email, password, name)
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Auth failed', 'error')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-brand-950 p-4">
      <motion.div className="w-full max-w-md" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-brand-600 flex items-center justify-center shadow-glass mb-4">
            <MdTableChart className="text-white w-7 h-7" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Freshdesk Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Enterprise performance analytics</p>
        </div>
        <div className="card p-6 shadow-glass">
          <h2 className="font-bold text-lg mb-5">{mode === 'login' ? 'Sign in to your account' : 'Create an account'}</h2>
          <button onClick={handleGoogle} className="w-full flex items-center justify-center gap-3 border border-gray-200 dark:border-gray-700 rounded-xl py-2.5 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors mb-4">
            <FcGoogle className="w-5 h-5" />
            Continue with Google
          </button>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
            <span className="text-xs text-gray-400">or</span>
            <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
          </div>
          <form onSubmit={handleEmail} className="space-y-3">
            {mode === 'register' && (
              <div>
                <label className="label">Name</label>
                <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" required />
              </div>
            )}
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" required />
            </div>
            <div>
              <label className="label">Password</label>
              <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5 mt-1">
              {loading ? 'Loading...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
          <div className="mt-4 text-center text-sm text-gray-500">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button className="text-brand-600 dark:text-brand-400 font-semibold hover:underline" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
              {mode === 'login' ? 'Register' : 'Sign In'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
