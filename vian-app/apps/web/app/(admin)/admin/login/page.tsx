'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield } from 'lucide-react'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      })
      const data = await res.json()
      if (!res.ok || data.user?.role !== 'ULTIMATE_ADMIN') {
        setError('Invalid admin credentials.')
        return
      }
      // Store admin token in both localStorage and cookie
      localStorage.setItem('vian_admin_token', data.token)
      localStorage.setItem('vian_admin_user', JSON.stringify(data.user))
      document.cookie = `vian_admin_token=${data.token}; path=/; max-age=${7 * 86400}; SameSite=Lax`
      document.cookie = `vian_token=${data.token}; path=/; max-age=${7 * 86400}; SameSite=Lax`
      router.push('/admin')
    } catch {
      setError('Could not connect to server.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-6" style={{ fontFamily: "'Geist', sans-serif" }}>
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-10">
          <span className="text-[#3b82f6] font-semibold">◆</span>
          <span className="text-sm font-semibold text-[#ededed]">VIAN</span>
          <span className="text-xs text-[#4a4a4a] ml-1">Admin</span>
        </div>

        <div className="flex items-center gap-2 mb-6">
          <Shield className="w-4 h-4 text-[#888888]" />
          <h1 className="text-lg font-semibold text-[#ededed]">Admin sign in</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[#888888]">Admin email</label>
            <input
              type="email"
              required
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-9 px-3 rounded bg-[#1a1a1a] border border-[#262626] text-sm text-[#ededed] placeholder-[#4a4a4a] outline-none focus:border-[#363636] transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[#888888]">Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-9 px-3 rounded bg-[#1a1a1a] border border-[#262626] text-sm text-[#ededed] placeholder-[#4a4a4a] outline-none focus:border-[#363636] transition-colors"
            />
          </div>

          {error && <p className="text-xs text-[#ef4444]">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-9 bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-50 text-white text-sm font-medium rounded transition-colors mt-1"
          >
            {loading ? 'Signing in…' : 'Sign in to admin panel'}
          </button>
        </form>
      </div>
    </div>
  )
}
