'use client'

import { useEffect, useState } from 'react'
import { Check, X, RefreshCw, LogOut, Shield } from 'lucide-react'

interface BetaRequest {
  id: string
  name: string
  email: string
  reason: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: string
}

interface ProviderStatus {
  id: string
  name: string
  description: string
  keyCount: number
  configured: boolean
  color: 'green' | 'blue' | 'orange' | 'purple' | 'cyan'
}

interface KeyStatus {
  providers?: ProviderStatus[]
  configuredCount: number
  totalProviders: number
}

interface AdminUser { email: string; name: string; role: string }

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Inline Login Form
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function AdminLogin({ onSuccess }: { onSuccess: (user: AdminUser, token: string) => void }) {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res  = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: email.trim(), password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.message ?? data.error ?? 'Login failed')
        return
      }
      if (data.user.role !== 'ULTIMATE_ADMIN') {
        setError('This account does not have admin access.')
        return
      }
      const maxAge = `max-age=${7 * 86400}`
      document.cookie = `vian_admin_token=${data.token}; path=/; ${maxAge}; SameSite=Lax`
      document.cookie = `vian_token=${data.token}; path=/; ${maxAge}; SameSite=Lax`
      localStorage.setItem('vian_admin_token', data.token)
      localStorage.setItem('vian_admin_user', JSON.stringify(data.user))
      onSuccess(data.user, data.token)
    } catch {
      setError('Could not connect to server.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] relative flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-1">
          <div className="text-[#3b82f6] font-semibold text-lg">â—† VIAN</div>
          <h1 className="text-xl font-semibold text-[#ededed]">Admin access</h1>
          <p className="text-xs text-[#4a4a4a]">Restricted area â€” admin credentials required.</p>
        </div>

        {error && (
          <div className="bg-[#ef4444]/10 border border-[#ef4444]/20 text-[#ef4444] text-xs rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs text-[#888888] mb-1.5">Admin email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              className="w-full bg-[#111111] border border-[#1a1a1a] hover:border-[#262626] focus:border-[#3b82f6] rounded-lg px-3.5 py-2.5 text-sm text-[#ededed] placeholder-[#4a4a4a] outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs text-[#888888] mb-1.5">Password</label>
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
            className="w-full bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg px-4 py-2.5 transition-colors"
          >
            {loading ? 'Signing inâ€¦' : 'Sign in to dashboard'}
          </button>
        </form>
      </div>      <footer className="absolute bottom-0 left-0 right-0 border-t border-[#1a1a1a] px-6 py-6 text-center">
        <p className="text-xs text-[#555555]">Made with VIAN by Viren Pandeyy</p>
      </footer>    </div>
  )
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Dashboard
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function AdminPage() {
  const [adminUser,  setAdminUser]  = useState<AdminUser | null>(null)
  const [requests,   setRequests]   = useState<BetaRequest[]>([])
  const [keyStatus,  setKeyStatus]  = useState<KeyStatus | null>(null)
  const [loading,    setLoading]    = useState(false)
  const [tab,        setTab]        = useState<'requests' | 'keys'>('requests')
  const [authReady,  setAuthReady]  = useState(false)

  // Check existing session on mount
  useEffect(() => {
    const stored = localStorage.getItem('vian_admin_user')
    const token  = localStorage.getItem('vian_admin_token')
    if (stored && token) {
      try {
        const user = JSON.parse(stored) as AdminUser
        if (user.role === 'ULTIMATE_ADMIN') setAdminUser(user)
      } catch { /* invalid stored data */ }
    }
    setAuthReady(true)
  }, [])

  // Fetch data whenever adminUser is set
  useEffect(() => { if (adminUser) fetchData() }, [adminUser]) // eslint-disable-line

  async function fetchData() {
    setLoading(true)
    try {
      const token   = localStorage.getItem('vian_admin_token') ?? ''
      const headers = { Authorization: `Bearer ${token}` }
      const [reqRes, keyRes] = await Promise.all([
        fetch('/api/admin/requests', { headers }),
        fetch('/api/admin/keys',     { headers }),
      ])
      if (reqRes.ok) setRequests(await reqRes.json())
      if (keyRes.ok) setKeyStatus(await keyRes.json())
    } finally {
      setLoading(false)
    }
  }

  async function handleAction(id: string, action: 'approve' | 'reject' | 'revoke') {
    const token = localStorage.getItem('vian_admin_token') ?? ''
    await fetch(`/api/admin/${action}/${id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    })
    await fetchData()
  }

  function handleLogout() {
    localStorage.removeItem('vian_admin_token')
    localStorage.removeItem('vian_admin_user')
    document.cookie = 'vian_admin_token=; path=/; max-age=0'
    document.cookie = 'vian_token=; path=/; max-age=0'
    setAdminUser(null)
  }

  // Still checking session storage
  if (!authReady) return null

  // Not authenticated â†’ show inline login form
  if (!adminUser) {
    return <AdminLogin onSuccess={(user) => setAdminUser(user)} />
  }

  const pendingCount = requests.filter((r) => r.status === 'PENDING').length

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-[#f0f0f0]" style={{ fontFamily: "'Geist', sans-serif" }}>
      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-[#1a1a1a] px-6 py-3 flex items-center justify-between bg-[#0d0d0d]/90 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <span className="text-[#3b82f6] font-semibold text-sm">â—† VIAN</span>
          <span className="text-[#262626] text-xs">/</span>
          <div className="flex items-center gap-1.5 text-xs text-[#888888]">
            <Shield className="w-3 h-3 text-[#4a4a4a]" />
            Admin Dashboard
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
            <span className="text-xs text-[#888888] font-mono">{adminUser.email}</span>
          </div>
          {pendingCount > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/20 font-medium">
              {pendingCount} pending
            </span>
          )}
          <button
            onClick={fetchData}
            className="flex items-center gap-1.5 text-[#4a4a4a] text-xs hover:text-[#888888] transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-[#4a4a4a] text-xs hover:text-[#ef4444] transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign out
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-[#111111] border border-[#1a1a1a] rounded-lg p-1 w-fit">
          {(['requests', 'keys'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`text-xs px-4 py-2 rounded-md transition-colors flex items-center gap-1.5 ${
                tab === t ? 'bg-[#3b82f6] text-white' : 'text-[#4a4a4a] hover:text-[#888888]'
              }`}
            >
              {t === 'requests' ? 'Beta Requests' : 'API Keys'}
              {t === 'requests' && pendingCount > 0 && tab !== 'requests' && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-[#4a4a4a] text-sm">
            <div className="w-3 h-3 border border-[#3b82f6] border-t-transparent rounded-full animate-spin" />
            Loadingâ€¦
          </div>
        ) : tab === 'requests' ? (
          <div className="space-y-3">
            {requests.length === 0 ? (
              <div className="text-[#4a4a4a] text-sm bg-[#111111] border border-[#1a1a1a] rounded-xl p-8 text-center">
                No requests yet.
              </div>
            ) : requests.map((req) => (
              <div
                key={req.id}
                className="bg-[#111111] border border-[#1a1a1a] hover:border-[#262626] rounded-xl p-5 flex items-start justify-between gap-4 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-sm font-medium text-[#ededed]">{req.name}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${
                      req.status === 'APPROVED'
                        ? 'bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/20'
                        : req.status === 'REJECTED'
                        ? 'bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/20'
                        : 'bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/20'
                    }`}>
                      {req.status}
                    </span>
                  </div>
                  <div className="text-xs text-[#4a4a4a] font-mono mb-2">{req.email}</div>
                  <p className="text-xs text-[#888888] leading-relaxed line-clamp-2">{req.reason}</p>
                  <p className="text-[10px] text-[#4a4a4a] mt-2">
                    {new Date(req.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {req.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => handleAction(req.id, 'approve')}
                        className="flex items-center gap-1.5 bg-[#22c55e]/10 hover:bg-[#22c55e]/20 text-[#22c55e] text-xs px-3 py-1.5 rounded-lg transition-colors border border-[#22c55e]/20"
                      >
                        <Check className="w-3 h-3" /> Approve
                      </button>
                      <button
                        onClick={() => handleAction(req.id, 'reject')}
                        className="flex items-center gap-1.5 bg-[#ef4444]/10 hover:bg-[#ef4444]/20 text-[#ef4444] text-xs px-3 py-1.5 rounded-lg transition-colors border border-[#ef4444]/20"
                      >
                        <X className="w-3 h-3" /> Reject
                      </button>
                    </>
                  )}
                  {req.status === 'APPROVED' && (
                    <button
                      onClick={() => handleAction(req.id, 'revoke')}
                      className="flex items-center gap-1.5 bg-[#ef4444]/10 hover:bg-[#ef4444]/20 text-[#ef4444] text-xs px-3 py-1.5 rounded-lg transition-colors border border-[#ef4444]/20"
                    >
                      <X className="w-3 h-3" /> Revoke
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          keyStatus && (
            <>
              {/* Summary */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-5">
                  <div className="text-2xl font-semibold text-[#22c55e]">{keyStatus.configuredCount}</div>
                  <div className="text-xs text-[#555555] mt-1">Providers configured</div>
                </div>
                <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-5">
                  <div className="text-2xl font-semibold text-[#f0f0f0]">{keyStatus.totalProviders}</div>
                  <div className="text-xs text-[#555555] mt-1">Total providers</div>
                </div>
              </div>

              {/* Provider cards */}
              <div className="space-y-2">
                {(keyStatus.providers ?? []).map((p) => {
                  const colorMap: Record<string, { dot: string; badge: string; text: string }> = {
                    green:  { dot: 'bg-[#22c55e]', badge: 'bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/20', text: 'text-[#22c55e]' },
                    blue:   { dot: 'bg-[#3b82f6]', badge: 'bg-[#3b82f6]/10 text-[#3b82f6] border-[#3b82f6]/20', text: 'text-[#3b82f6]' },
                    orange: { dot: 'bg-[#f59e0b]', badge: 'bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/20', text: 'text-[#f59e0b]' },
                    purple: { dot: 'bg-[#a855f7]', badge: 'bg-[#a855f7]/10 text-[#a855f7] border-[#a855f7]/20', text: 'text-[#a855f7]' },
                    cyan:   { dot: 'bg-[#06b6d4]', badge: 'bg-[#06b6d4]/10 text-[#06b6d4] border-[#06b6d4]/20', text: 'text-[#06b6d4]' },
                  }
                  const c = colorMap[p.color] ?? colorMap.blue
                  return (
                    <div
                      key={p.id}
                      className="flex items-center justify-between bg-[#111111] border border-[#1a1a1a] hover:border-[#262626] rounded-xl px-5 py-4 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${p.configured ? c.dot : 'bg-[#333333]'}`} />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-[#f0f0f0]">{p.name}</span>
                            {p.id === 'groq' && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20 font-medium">default</span>
                            )}
                          </div>
                          <div className="text-xs text-[#555555] mt-0.5">{p.description}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-[#555555] font-mono">
                          {p.keyCount} key{p.keyCount !== 1 ? 's' : ''}
                        </span>
                        <span className={`text-[10px] px-2 py-1 rounded-full border font-medium ${
                          p.configured ? c.badge : 'bg-[#1a1a1a] text-[#555555] border-[#262626]'
                        }`}>
                          {p.configured ? 'Configured' : 'Not set'}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )
        )}
      </div>
      <footer className="border-t border-[#1a1a1a] px-6 py-6 text-center">
        <p className="text-xs text-[#555555]">Made with VIAN by Viren Pandeyy</p>
      </footer>
    </div>
  )
}
