'use client'

import { useState }    from 'react'
import { useRouter }   from 'next/navigation'
import Link            from 'next/link'

type Status = 'idle' | 'pending' | 'rejected' | 'no_account' | 'invalid_password' | 'error'
type View   = 'login' | 'forgot' | 'forgot_sent'

export default function LoginPage() {
  const router = useRouter()

  const [view,     setView]     = useState<View>('login')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [status,   setStatus]   = useState<Status>('idle')
  const [errMsg,   setErrMsg]   = useState('')
  const [loading,  setLoading]  = useState(false)
  const [resetEmail, setResetEmail] = useState('')

  // â”€â”€ Login â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setStatus('idle')
    setErrMsg('')
    try {
      const res  = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: email.trim(), password }),
      })
      const data = await res.json()

      if (res.ok) {
        const maxAge = `max-age=${7 * 86400}`
        document.cookie = `vian_token=${data.token}; path=/; ${maxAge}; SameSite=Lax`
        localStorage.setItem('vian_token', data.token)
        localStorage.setItem('vian_user', JSON.stringify(data.user))

        if (data.user.role === 'ULTIMATE_ADMIN') {
          document.cookie = `vian_admin_token=${data.token}; path=/; ${maxAge}; SameSite=Lax`
          localStorage.setItem('vian_admin_token', data.token)
          localStorage.setItem('vian_admin_user', JSON.stringify(data.user))
          router.push('/admin')
        } else {
          router.push('/')
        }
        return
      }

      const code = data.error as string
      if (code === 'pending')          { setStatus('pending');          return }
      if (code === 'rejected')         { setStatus('rejected');         return }
      if (code === 'no_account')       { setStatus('no_account');       return }
      if (code === 'invalid_password') { setStatus('invalid_password'); return }
      setStatus('error')
      setErrMsg(data.message ?? data.error ?? 'Something went wrong.')
    } catch {
      setStatus('error')
      setErrMsg('Could not connect to server.')
    } finally {
      setLoading(false)
    }
  }

  // â”€â”€ Forgot password â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  async function handleForgot(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: resetEmail.trim() }),
      })
      setView('forgot_sent')
    } finally {
      setLoading(false)
    }
  }

  // â”€â”€ Forgot sent â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (view === 'forgot_sent') {
    return (
      <div className="min-h-screen bg-[#0d0d0d] relative flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center space-y-5">
          <div className="w-12 h-12 rounded-full bg-[#3b82f6]/10 border border-[#3b82f6]/20 flex items-center justify-center mx-auto">
            <svg className="w-5 h-5 text-[#3b82f6]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#ededed] mb-1">Check your email</h2>
            <p className="text-sm text-[#888888]">
              If an account exists for <span className="text-[#ededed]">{resetEmail}</span>, a reset link has been sent.
            </p>
          </div>
          <button onClick={() => setView('login')} className="text-xs text-[#3b82f6] hover:text-[#60a5fa] transition-colors">
            â† Back to sign in
          </button>
        </div>      <footer className="absolute bottom-0 left-0 right-0 border-t border-[#1a1a1a] px-6 py-6 text-center">
        <p className="text-xs text-[#555555]">Made with VIAN by Viren Pandeyy</p>
      </footer>      </div>
    )
  }

  // â”€â”€ Forgot form â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (view === 'forgot') {
    return (
      <div className="min-h-screen bg-[#0d0d0d] relative flex items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center space-y-1">
            <div className="text-[#3b82f6] font-semibold text-lg">VIAN</div>
            <h1 className="text-xl font-semibold text-[#ededed]">Reset password</h1>
            <p className="text-xs text-[#4a4a4a]">Enter your email and we&apos;ll send a reset link.</p>
          </div>
          <form onSubmit={handleForgot} className="space-y-3">
            <div>
              <label className="block text-xs text-[#888888] mb-1.5">Email</label>
              <input
                type="email"
                required
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-[#111111] border border-[#1a1a1a] hover:border-[#262626] focus:border-[#3b82f6] rounded-lg px-3.5 py-2.5 text-sm text-[#ededed] placeholder-[#4a4a4a] outline-none transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-50 text-white text-sm font-medium rounded-lg px-4 py-2.5 transition-colors"
            >
              {loading ? 'Sendingâ€¦' : 'Send reset link'}
            </button>
          </form>
          <p className="text-center text-xs text-[#4a4a4a]">
            <button onClick={() => setView('login')} className="text-[#3b82f6] hover:text-[#60a5fa] transition-colors">
              Back to sign in
            </button>
          </p>
        </div>      <footer className="absolute bottom-0 left-0 right-0 border-t border-[#1a1a1a] px-6 py-6 text-center">
        <p className="text-xs text-[#555555]">Made with VIAN by Viren Pandey</p>
      </footer>      </div>
    )
  }

  // â”€â”€ Login form â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  return (
    <div className="min-h-screen bg-[#0d0d0d] relative flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="text-center space-y-1">
          <div className="text-[#3b82f6] font-semibold text-lg">VIAN</div>
          <h1 className="text-xl font-semibold text-[#ededed]">Welcome back</h1>
          <p className="text-xs text-[#4a4a4a]">Sign in to your account to continue building.</p>
        </div>

        {/* Status banners */}
        {status === 'pending' && (
          <div className="bg-[#f59e0b]/10 border border-[#f59e0b]/20 text-xs rounded-lg px-4 py-3 space-y-0.5">
            <p className="font-medium text-[#f59e0b]">Access pending review</p>
            <p className="text-[#888888]">Your request is under review. We&apos;ll email you when it&apos;s approved.</p>
          </div>
        )}
        {status === 'rejected' && (
          <div className="bg-[#ef4444]/10 border border-[#ef4444]/20 text-xs rounded-lg px-4 py-3 space-y-0.5">
            <p className="font-medium text-[#ef4444]">Access not approved</p>
            <p className="text-[#888888]">Your access request was not approved. Contact support for help.</p>
          </div>
        )}
        {status === 'no_account' && (
          <div className="bg-[#262626] border border-[#363636] text-xs rounded-lg px-4 py-3 space-y-0.5">
            <p className="font-medium text-[#ededed]">No account found</p>
            <p className="text-[#888888]">
              No account exists for this email.{' '}
              <Link href="/register" className="text-[#3b82f6] hover:text-[#60a5fa] transition-colors">
                Register â†’
              </Link>
            </p>
          </div>
        )}
        {status === 'invalid_password' && (
          <div className="bg-[#ef4444]/10 border border-[#ef4444]/20 text-xs rounded-lg px-4 py-3">
            <p className="text-[#ef4444]">Incorrect password. Check and try again.</p>
          </div>
        )}
        {status === 'error' && (
          <div className="bg-[#ef4444]/10 border border-[#ef4444]/20 text-xs rounded-lg px-4 py-3">
            <p className="text-[#ef4444]">{errMsg}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-3">
          <div>
            <label className="block text-xs text-[#888888] mb-1.5">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-[#111111] border border-[#1a1a1a] hover:border-[#262626] focus:border-[#3b82f6] rounded-lg px-3.5 py-2.5 text-sm text-[#ededed] placeholder-[#4a4a4a] outline-none transition-colors"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs text-[#888888]">Password</label>
              <button
                type="button"
                onClick={() => { setResetEmail(email); setView('forgot') }}
                className="text-[10px] text-[#4a4a4a] hover:text-[#888888] transition-colors"
              >
                Forgot password?
              </button>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
              className="w-full bg-[#111111] border border-[#1a1a1a] hover:border-[#262626] focus:border-[#3b82f6] rounded-lg px-3.5 py-2.5 text-sm text-[#ededed] placeholder-[#4a4a4a] outline-none transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg px-4 py-2.5 transition-colors mt-1"
          >
            {loading ? 'Signing inâ€¦' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-xs text-[#4a4a4a]">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-[#3b82f6] hover:text-[#60a5fa] transition-colors">
            Register
          </Link>
        </p>
      </div>
      <footer className="absolute bottom-0 left-0 right-0 border-t border-[#1a1a1a] px-6 py-6 text-center">
        <p className="text-xs text-[#555555]">Made with VIAN by Viren Pandeyy</p>
      </footer>
    </div>
  )
}
