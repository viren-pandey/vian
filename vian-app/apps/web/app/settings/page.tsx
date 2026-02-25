'use client'

import { useState, useEffect } from 'react'
import { useRouter }            from 'next/navigation'
import Link                     from 'next/link'
import { ArrowLeft, KeyRound, CheckCircle2 } from 'lucide-react'

type Status = 'idle' | 'loading' | 'success' | 'error'

export default function SettingsPage() {
  const router = useRouter()
  const [user,      setUser]      = useState<{ name: string; email: string } | null>(null)
  const [currentPw, setCurrentPw] = useState('')
  const [newPw,     setNewPw]     = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [status,    setStatus]    = useState<Status>('idle')
  const [errMsg,    setErrMsg]    = useState('')

  useEffect(() => {
    try {
      const raw = localStorage.getItem('vian_user')
      if (!raw) { router.push('/login'); return }
      setUser(JSON.parse(raw))
    } catch {
      router.push('/login')
    }
  }, [router])

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setErrMsg('')

    if (newPw !== confirmPw) {
      setStatus('error')
      setErrMsg('New passwords do not match.')
      return
    }
    if (newPw.length < 8) {
      setStatus('error')
      setErrMsg('New password must be at least 8 characters.')
      return
    }
    if (newPw === currentPw) {
      setStatus('error')
      setErrMsg('New password must be different from the current one.')
      return
    }

    setStatus('loading')
    try {
      const token = localStorage.getItem('vian_token')
      const res   = await fetch('/api/auth/change-password', {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      })
      const data = await res.json()

      if (res.ok) {
        setStatus('success')
        setCurrentPw('')
        setNewPw('')
        setConfirmPw('')
      } else {
        setStatus('error')
        setErrMsg(data.message ?? data.error ?? 'Failed to change password.')
      }
    } catch {
      setStatus('error')
      setErrMsg('Could not connect to server.')
    }
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-[#f0f0f0]" style={{ fontFamily: "'Geist', sans-serif" }}>
      {/* grid background */}
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: `linear-gradient(rgba(59,130,246,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.03) 1px, transparent 1px)`, backgroundSize: '48px 48px' }} />

      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-[52px] flex items-center justify-between px-6 border-b border-[#1a1a1a] bg-[#0d0d0d]/80 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="text-[#3b82f6] text-lg font-semibold tracking-tight">◆</span>
          <span className="text-[#f0f0f0] text-sm font-semibold tracking-tight">VIAN</span>
          <span className="text-[#333333] text-xs font-mono ml-1">by Viren</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-[#555555]">
          <span className="w-2 h-2 rounded-full bg-[#22c55e]" />
          <span>{user.email}</span>
        </div>
      </nav>

      {/* CONTENT */}
      <main className="relative pt-28 pb-20 px-6 max-w-lg mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-[#555555] hover:text-[#888888] text-sm mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to home
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-[#f0f0f0] mb-1">Account Settings</h1>
          <p className="text-[#555555] text-sm">Hello, <span className="text-[#888888]">{user.name}</span></p>
        </div>

        {/* Profile info card */}
        <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-6 mb-6">
          <p className="text-xs text-[#555555] uppercase tracking-wider mb-4">Profile</p>
          <div className="grid gap-3">
            <div>
              <p className="text-[10px] text-[#555555] mb-1">Name</p>
              <p className="text-sm text-[#f0f0f0]">{user.name}</p>
            </div>
            <div>
              <p className="text-[10px] text-[#555555] mb-1">Email</p>
              <p className="text-sm text-[#f0f0f0]">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Change password card */}
        <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <KeyRound className="w-4 h-4 text-[#3b82f6]" />
            <p className="text-sm font-medium text-[#f0f0f0]">Change Password</p>
          </div>

          {status === 'success' && (
            <div className="flex items-center gap-2 bg-[#14532d]/40 border border-[#22c55e]/30 rounded-lg px-4 py-3 mb-5 text-sm text-[#22c55e]">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              Password updated successfully.
            </div>
          )}

          {status === 'error' && (
            <div className="bg-[#450a0a]/40 border border-[#ef4444]/30 rounded-lg px-4 py-3 mb-5 text-sm text-[#ef4444]">
              {errMsg}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs text-[#555555] mb-1.5">Current password</label>
              <input
                type="password"
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full bg-[#0d0d0d] border border-[#2a2a2a] hover:border-[#3a3a3a] focus:border-[#3b82f6] rounded-lg px-3 py-2.5 text-sm text-[#f0f0f0] placeholder:text-[#333333] focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs text-[#555555] mb-1.5">New password</label>
              <input
                type="password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                required
                minLength={8}
                placeholder="Min 8 characters"
                className="w-full bg-[#0d0d0d] border border-[#2a2a2a] hover:border-[#3a3a3a] focus:border-[#3b82f6] rounded-lg px-3 py-2.5 text-sm text-[#f0f0f0] placeholder:text-[#333333] focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs text-[#555555] mb-1.5">Confirm new password</label>
              <input
                type="password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                required
                placeholder="Repeat new password"
                className="w-full bg-[#0d0d0d] border border-[#2a2a2a] hover:border-[#3a3a3a] focus:border-[#3b82f6] rounded-lg px-3 py-2.5 text-sm text-[#f0f0f0] placeholder:text-[#333333] focus:outline-none transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium py-2.5 rounded-lg transition-colors mt-2"
            >
              {status === 'loading' ? 'Saving…' : 'Update Password'}
            </button>
          </form>
        </div>

        {/* Danger zone */}
        <div className="mt-6 text-center">
          <button
            onClick={() => {
              localStorage.removeItem('vian_token')
              localStorage.removeItem('vian_user')
              document.cookie = 'vian_token=; path=/; max-age=0'
              router.push('/')
            }}
            className="text-xs text-[#555555] hover:text-[#ef4444] transition-colors"
          >
            Sign out
          </button>
        </div>
      </main>
      <footer className="border-t border-[#1a1a1a] px-6 py-6 text-center">
        <p className="text-xs text-[#555555]">Made with VIAN by Viren Pandeyy</p>
      </footer>
    </div>
  )
}
