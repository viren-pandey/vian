'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Check, X, RefreshCw, LogOut, Grid, Users, Database, FileText, Settings, BarChart,
  Plus, Pencil, Image as ImageIcon, Trash2, ExternalLink, CircleCheck, XCircle, LogIn,
} from 'lucide-react'

interface BetaRequest {
  id: string
  name: string
  email: string
  reason: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: string
}

interface User {
  id: string
  name: string
  email: string
  role: string
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

interface BlogPost {
  id: string
  title: string
  slug: string
  published: boolean
  publishedAt: string | null
  updatedAt: string
  readTime: number
  tags: { name: string }[]
}

interface MediaItem {
  id: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  url: string
  alt: string | null
  createdAt: string
}

interface AdminUser { email: string; name: string; role: string }

// ────────────────────────────────────────────────────────────────────────────
// Inline Login Form
// ────────────────────────────────────────────────────────────────────────────
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
          <div className="text-[#3b82f6] font-semibold text-lg">◆ VIAN</div>
          <h1 className="text-xl font-semibold text-[#ededed]">Admin access</h1>
          <p className="text-xs text-[#4a4a4a]">Restricted area – admin credentials required.</p>
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
              placeholder="••••••••"
              className="w-full bg-[#111111] border border-[#1a1a1a] hover:border-[#262626] focus:border-[#3b82f6] rounded-lg px-3.5 py-2.5 text-sm text-[#ededed] placeholder-[#4a4a4a] outline-none transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg px-4 py-2.5 transition-colors"
          >
            {loading ? 'Signing in…' : 'Sign in to dashboard'}
          </button>
        </form>
      </div>
      <footer className="absolute bottom-0 left-0 right-0 border-t border-[#1a1a1a] px-6 py-6 text-center">
        <p className="text-xs text-[#555555]">Made with VIAN by Viren Pandeyy</p>
      </footer>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Dashboard
// ────────────────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const router = useRouter()
  const [adminUser,        setAdminUser]        = useState<AdminUser | null>(null)
  const [impersonatedUser, setImpersonatedUser] = useState<User | null>(null)
  const [requests,         setRequests]         = useState<BetaRequest[]>([])
  const [users,            setUsers]            = useState<User[]>([])
  const [keyStatus,        setKeyStatus]        = useState<KeyStatus | null>(null)
  const [blogPosts,        setBlogPosts]        = useState<BlogPost[]>([])
  const [media,            setMedia]            = useState<MediaItem[]>([])
  const [loading,          setLoading]          = useState(false)
  const [tab,              setTab]              = useState<'requests' | 'users' | 'keys' | 'blog' | 'media'>('requests')
  const [authReady,        setAuthReady]        = useState(false)

  // Check existing session on mount
  useEffect(() => {
    const stored = localStorage.getItem('vian_admin_user')
    const token  = localStorage.getItem('vian_admin_token')
    const impersonating = localStorage.getItem('vian_impersonated_user')
    if (stored && token) {
      try {
        const user = JSON.parse(stored) as AdminUser
        if (user.role === 'ULTIMATE_ADMIN') setAdminUser(user)
      } catch { /* invalid stored data */ }
    }
    if (impersonating) {
      try {
        setImpersonatedUser(JSON.parse(impersonating))
      } catch {}
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
      const [reqRes, usersRes, keyRes, blogRes, mediaRes] = await Promise.all([
        fetch('/api/admin/requests',  { headers }),
        fetch('/api/admin/users',     { headers }),
        fetch('/api/admin/keys',      { headers }),
        fetch('/api/blog/admin/all',  { headers }),
        fetch('/api/media',           { headers }),
      ])
      if (reqRes.ok)    setRequests(await reqRes.json())
      if (usersRes.ok)  setUsers(await usersRes.json())
      if (keyRes.ok)    setKeyStatus(await keyRes.json())
      if (blogRes.ok)   setBlogPosts(await blogRes.json())
      if (mediaRes.ok)  setMedia(await mediaRes.json())
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

  async function handleImpersonate(userId: string) {
    const token = localStorage.getItem('vian_admin_token') ?? ''
    const res = await fetch(`/api/admin/impersonate/${userId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return alert('Impersonation failed')
    const data = await res.json()
    
    // Store original admin session
    localStorage.setItem('vian_original_admin_token', token)
    localStorage.setItem('vian_original_admin_user', JSON.stringify(adminUser))
    
    // Set impersonated session
    localStorage.setItem('vian_token', data.token)
    localStorage.setItem('vian_user', JSON.stringify(data.user))
    localStorage.setItem('vian_impersonated_user', JSON.stringify(data.user))
    document.cookie = `vian_token=${data.token}; path=/; max-age=${7 * 86400}; SameSite=Lax`
    
    setImpersonatedUser(data.user)
    
    // Redirect to landing page as that user
    router.push('/')
  }

  function handleExitImpersonation() {
    // Restore admin session
    const originalToken = localStorage.getItem('vian_original_admin_token')
    const originalUser = localStorage.getItem('vian_original_admin_user')
    
    if (originalToken && originalUser) {
      localStorage.setItem('vian_admin_token', originalToken)
      localStorage.setItem('vian_admin_user', originalUser)
      localStorage.setItem('vian_token', originalToken)
      localStorage.setItem('vian_user', originalUser)
      document.cookie = `vian_token=${originalToken}; path=/; max-age=${7 * 86400}; SameSite=Lax`
    }
    
    // Clear impersonation
    localStorage.removeItem('vian_impersonated_user')
    localStorage.removeItem('vian_original_admin_token')
    localStorage.removeItem('vian_original_admin_user')
    
    setImpersonatedUser(null)
    router.push('/admin')
  }

  async function deleteMedia(id: string) {
    if (!confirm('Delete this media item? This cannot be undone.')) return
    const token = localStorage.getItem('vian_admin_token') ?? ''
    await fetch(`/api/media/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    setMedia((prev) => prev.filter((m) => m.id !== id))
  }

  async function deleteBlogPost(id: string) {
    if (!confirm('Delete this post? This cannot be undone.')) return
    const token = localStorage.getItem('vian_admin_token') ?? ''
    await fetch(`/api/blog/admin/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    setBlogPosts((prev) => prev.filter((p) => p.id !== id))
  }

  function handleLogout() {
    localStorage.removeItem('vian_admin_token')
    localStorage.removeItem('vian_admin_user')
    localStorage.removeItem('vian_impersonated_user')
    localStorage.removeItem('vian_original_admin_token')
    localStorage.removeItem('vian_original_admin_user')
    document.cookie = 'vian_admin_token=; path=/; max-age=0'
    document.cookie = 'vian_token=; path=/; max-age=0'
    setAdminUser(null)
    setImpersonatedUser(null)
  }

  // Still checking session storage
  if (!authReady) return null

  // Not authenticated → show inline login form
  if (!adminUser) {
    return <AdminLogin onSuccess={(user) => setAdminUser(user)} />
  }

  const pendingCount = requests.filter((r) => r.status === 'PENDING').length

  const TABS: { id: 'requests' | 'users' | 'keys' | 'blog' | 'media'; label: string; icon: React.ReactNode }[] = [
    { id: 'requests', label: 'Beta Requests', icon: <FileText size={14} /> },
    { id: 'users',    label: 'Users',         icon: <Users size={14} /> },
    { id: 'keys',     label: 'API Keys',      icon: <Settings size={14} /> },
    { id: 'blog',     label: 'Blog Posts',    icon: <FileText size={14} /> },
    { id: 'media',    label: 'Media',         icon: <ImageIcon size={14} /> },
  ]

  const MOBILE_NAV = [
    { id: 'requests' as const, label: 'Dashboard', icon: <Grid size={20} /> },
    { id: 'users' as const,    label: 'Users',     icon: <Users size={20} /> },
    { id: 'keys' as const,     label: 'Settings',  icon: <Settings size={20} /> },
    { id: 'blog' as const,     label: 'Logs',      icon: <BarChart size={20} /> },
  ]

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-[#f0f0f0] pb-20 md:pb-0">
      {/* Impersonation Banner */}
      {impersonatedUser && (
        <div className="sticky top-0 z-50 bg-[#f59e0b] border-b border-[#ea580c] px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LogIn size={14} className="text-white" />
            <span className="text-white text-xs font-medium">
              Impersonating: {impersonatedUser.name} ({impersonatedUser.email})
            </span>
          </div>
          <button
            onClick={handleExitImpersonation}
            className="text-white text-xs font-medium hover:underline"
          >
            Exit Impersonation
          </button>
        </div>
      )}

      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-[#1a1a1a] bg-[#0d0d0d]/90 backdrop-blur-sm">
        <div className="h-14 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Grid size={22} className="text-[#3b82f6]" />
            <h1 className="text-[18px] font-bold text-white">Admin Dashboard</h1>
            <div className="hidden md:flex items-center gap-2 bg-[rgba(59,130,246,0.10)] border border-[rgba(59,130,246,0.25)] rounded-full px-2.5 py-1">
              <span className="text-[11px] font-mono text-[#3b82f6]">ULTIMATE ADMIN</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-4">
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

        {/* Desktop Tabs */}
        <div className="hidden md:flex gap-1 px-6 pb-3">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition-colors text-xs font-medium ${
                tab === t.id 
                  ? 'bg-[#1a1a1a] text-white' 
                  : 'text-[#666] hover:text-white hover:bg-[#111]'
              }`}
            >
              {t.icon}
              {t.label}
              {t.id === 'requests' && pendingCount > 0 && tab !== 'requests' && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center gap-2 text-[#4a4a4a] text-sm">
            <div className="w-3 h-3 border border-[#3b82f6] border-t-transparent rounded-full animate-spin" />
            Loading...
          </div>
        ) : tab === 'requests' ? (
          /* ── Beta Requests ─────────────────────────────────────────────── */
          <div className="space-y-3">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-white">Beta Access Requests</h2>
              <p className="text-xs text-[#555] mt-0.5">{requests.length} total · {pendingCount} pending</p>
            </div>
            {requests.length === 0 ? (
              <div className="text-[#4a4a4a] text-sm bg-[#111111] border border-[#1a1a1a] rounded-xl p-8 text-center">
                No requests yet.
              </div>
            ) : requests.map((req) => (
              <div
                key={req.id}
                className="bg-[#111111] border border-[#1a1a1a] hover:border-[#262626] rounded-xl px-5 py-4 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] uppercase tracking-wider text-[#555] mb-2">
                      REQUESTED {new Date(req.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}
                    </div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-[18px] font-bold text-white">{req.name}</span>
                    </div>
                    <div className="text-[14px] text-[#3b82f6] mb-3">{req.email}</div>
                    <p className="text-xs text-[#888] leading-relaxed">{req.reason}</p>
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    {req.status === 'PENDING' ? (
                      <>
                        <button 
                          onClick={() => handleAction(req.id, 'approve')}
                          className="h-11 px-4 bg-[#16a34a] hover:bg-[#15803d] text-white rounded-lg transition-colors flex items-center justify-center gap-2 text-xs font-semibold"
                        >
                          <CircleCheck size={16} />
                          Approve
                        </button>
                        <button 
                          onClick={() => handleAction(req.id, 'reject')}
                          className="h-11 px-4 bg-[#1f1f1f] hover:bg-[#2a2a2a] text-white rounded-lg transition-colors flex items-center justify-center gap-2 text-xs font-semibold"
                        >
                          <XCircle size={16} />
                          Reject
                        </button>
                      </>
                    ) : (
                      <div className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
                        req.status === 'APPROVED' 
                          ? 'bg-[#166534] border-[#16a34a] text-[#22c55e]'
                          : 'bg-[#7f1d1d] border-[#dc2626] text-[#ef4444]'
                      }`}>
                        {req.status}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

        ) : tab === 'users' ? (
          /* ── Users List with Impersonate ──────────────────────────────── */
          <div className="space-y-3">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-white">All Users</h2>
              <p className="text-xs text-[#555] mt-0.5">{users.length} total users</p>
            </div>
            {users.length === 0 ? (
              <div className="text-[#4a4a4a] text-sm bg-[#111111] border border-[#1a1a1a] rounded-xl p-8 text-center">
                No users yet.
              </div>
            ) : users.map((user) => (
              <div
                key={user.id}
                className="bg-[#111111] border border-[#1a1a1a] hover:border-[#262626] rounded-xl px-5 py-4 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] uppercase tracking-wider text-[#555] mb-2">
                      JOINED {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}
                    </div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-[18px] font-bold text-white">{user.name}</span>
                      <div className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                        user.role === 'ULTIMATE_ADMIN' 
                          ? 'bg-[rgba(59,130,246,0.10)] border-[rgba(59,130,246,0.25)] text-[#3b82f6]'
                          : user.role === 'APPROVED'
                          ? 'bg-[#166534] border-[#16a34a] text-[#22c55e]'
                          : 'bg-[#1f1f1f] border-[#2a2a2a] text-[#888]'
                      }`}>
                        {user.role}
                      </div>
                    </div>
                    <div className="text-[14px] text-[#3b82f6]">{user.email}</div>
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    {user.role !== 'ULTIMATE_ADMIN' && (
                      <button
                        onClick={() => handleImpersonate(user.id)}
                        className="h-11 px-4 bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-lg transition-colors flex items-center justify-center gap-2 text-xs font-semibold"
                      >
                        <LogIn size={16} />
                        Login as User
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

        ) : tab === 'keys' ? (
          /* ── API Keys ──────────────────────────────────────────────────── */
          keyStatus ? (
            <div>
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-white">API Key Management</h2>
                <p className="text-xs text-[#555] mt-0.5">{keyStatus.configuredCount} of {keyStatus.totalProviders} providers configured</p>
              </div>

              {/* Stats Cards */}
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

              {/* Provider List */}
              <div className="space-y-2">
                {(keyStatus.providers ?? []).map((p) => {
                  const colorMap: Record<string, { dot: string; badge: string }> = {
                    green:  { dot: 'bg-[#22c55e]', badge: 'bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/20' },
                    blue:   { dot: 'bg-[#3b82f6]', badge: 'bg-[#3b82f6]/10 text-[#3b82f6] border-[#3b82f6]/20' },
                    orange: { dot: 'bg-[#f59e0b]', badge: 'bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/20' },
                    purple: { dot: 'bg-[#a855f7]', badge: 'bg-[#a855f7]/10 text-[#a855f7] border-[#a855f7]/20' },
                    cyan:   { dot: 'bg-[#06b6d4]', badge: 'bg-[#06b6d4]/10 text-[#06b6d4] border-[#06b6d4]/20' },
                  }
                  const c = colorMap[p.color] ?? colorMap.blue
                  return (
                    <div key={p.id} className="flex items-center justify-between bg-[#111111] border border-[#1a1a1a] hover:border-[#262626] rounded-xl px-5 py-4 transition-colors">
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
                        <span className="text-xs text-[#555555] font-mono">{p.keyCount} key{p.keyCount !== 1 ? 's' : ''}</span>
                        <span className={`text-[10px] px-2 py-1 rounded-full border font-medium ${p.configured ? c.badge : 'bg-[#1a1a1a] text-[#555555] border-[#262626]'}`}>
                          {p.configured ? 'Configured' : 'Not set'}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Database Management Section */}
              <div className="mt-8">
                <h2 className="text-lg font-semibold text-white mb-4">Database Management</h2>
                
                {/* Database Schema */}
                <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6 mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-medium text-white">Database Schema</h3>
                      <p className="text-xs text-[#555] mt-1">Current Prisma schema</p>
                    </div>
                  </div>
                  <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg p-4 overflow-auto max-h-[400px]">
                    <pre className="text-[11px] font-mono text-[#ededed] leading-relaxed">
{`generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  ULTIMATE_ADMIN
  APPROVED
  PENDING
  REJECTED
}

model User {
  id           String    @id @default(cuid())
  email        String    @unique
  name         String
  role         UserRole  @default(PENDING)
  passwordHash String?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  projects     Project[]
}

model Project {
  id         String   @id @default(cuid())
  name       String
  prompt     String   @db.Text
  model      String   @default("gpt-4o")
  files      Json     @default("{}")
  shareToken String?  @unique @default(cuid())
  isPublic   Boolean  @default(false)
  userId     String
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}

model BetaRequest {
  id        String   @id @default(cuid())
  name      String
  email     String   @unique
  reason    String   @db.Text
  status    UserRole @default(PENDING)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model BlogPost {
  id          String     @id @default(cuid())
  title       String
  slug        String     @unique
  excerpt     String     @default("")
  content     String     @db.Text
  coverImage  String?
  published   Boolean    @default(false)
  publishedAt DateTime?
  readTime    Int        @default(0)
  tags        BlogTag[]  @relation("BlogPostTags")
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  @@map("blog_posts")
}

model BlogTag {
  id    String     @id @default(cuid())
  name  String     @unique
  slug  String     @unique
  posts BlogPost[] @relation("BlogPostTags")

  @@map("blog_tags")
}

model Media {
  id           String   @id @default(cuid())
  filename     String
  originalName String
  mimeType     String
  size         Int
  url          String
  alt          String?
  createdAt    DateTime @default(now())

  @@map("media")
}`}
                    </pre>
                  </div>
                </div>

                {/* Database Connections */}
                <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-medium text-white">Database Connections</h3>
                      <p className="text-xs text-[#555] mt-1">PostgreSQL: {process.env.DATABASE_URL ? 'Connected' : 'Not configured'}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-center justify-center py-8 text-[#4a4a4a]">
                    <div className="w-18 h-18 rounded-2xl bg-[rgba(59,130,246,0.10)] border border-[rgba(59,130,246,0.25)] flex items-center justify-center mb-4">
                      <Database size={32} className="text-[#3b82f6]" />
                    </div>
                    <p className="text-xs">Using DATABASE_URL from environment</p>
                  </div>
                </div>
              </div>
            </div>
          ) : null

        ) : tab === 'blog' ? (
          /* ── Blog Management ────────────────────────────────────────────── */
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-[#ededed]">Blog Posts</h2>
                <p className="text-xs text-[#555] mt-0.5">{blogPosts.length} total · {blogPosts.filter((p) => p.published).length} published</p>
              </div>
              <button
                onClick={() => router.push('/admin/blog/new')}
                className="flex items-center gap-2 bg-[#3b82f6] hover:bg-[#2563eb] text-white text-xs px-4 py-2 rounded-lg transition-colors font-medium"
              >
                <Plus className="w-3.5 h-3.5" /> New Post
              </button>
            </div>

            {blogPosts.length === 0 ? (
              <div className="text-center py-16 text-[#4a4a4a] bg-[#111111] border border-[#1a1a1a] rounded-xl">
                <FileText className="w-8 h-8 mx-auto mb-3 opacity-30" />
                <p>No posts yet. Click "New Post" to write your first one.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {blogPosts.map((post) => (
                  <div key={post.id}
                    className="flex items-center justify-between bg-[#111111] border border-[#1a1a1a] hover:border-[#262626] rounded-xl px-5 py-4 transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${
                          post.published
                            ? 'bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/20'
                            : 'bg-[#1a1a1a] text-[#4a4a4a] border-[#262626]'
                        }`}>{post.published ? 'Published' : 'Draft'}</span>
                        {post.tags.map((t) => (
                          <span key={t.name} className="text-[10px] text-[#3b82f6] bg-[#1d3a6e]/20 px-2 py-0.5 rounded-full">{t.name}</span>
                        ))}
                      </div>
                      <h3 className="text-sm font-medium text-[#f0f0f0] truncate">{post.title || 'Untitled'}</h3>
                      <p className="text-xs text-[#4a4a4a] mt-0.5 font-mono">
                        /blog/{post.slug} · {post.readTime} min · {new Date(post.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      {post.published && (
                        <a href={`/blog/${post.slug}`} target="_blank" rel="noreferrer"
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-[#888] hover:text-[#f0f0f0] hover:bg-[#1a1a1a] transition-colors">
                          <ExternalLink size={13} />
                        </a>
                      )}
                      <button onClick={() => router.push(`/admin/blog/${post.id}/edit`)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-[#888] hover:text-[#f0f0f0] hover:bg-[#1a1a1a] transition-colors">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => deleteBlogPost(post.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-[#888] hover:text-red-400 hover:bg-red-500/10 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        ) : (
          /* ── Media Library ──────────────────────────────────────────────── */
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-[#ededed]">Media Library</h2>
                <p className="text-xs text-[#555] mt-0.5">{media.length} files</p>
              </div>
              <label className="flex items-center gap-2 bg-[#3b82f6] hover:bg-[#2563eb] text-white text-xs px-4 py-2 rounded-lg transition-colors font-medium cursor-pointer">
                <Plus className="w-3.5 h-3.5" /> Upload
                <input
                  type="file"
                  accept="image/*,video/mp4,video/webm,application/pdf"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    const formData = new FormData()
                    formData.append('image', file)
                    const token = localStorage.getItem('vian_admin_token') ?? ''
                    const res = await fetch('/api/media/upload', {
                      method: 'POST',
                      body: formData,
                      headers: { Authorization: `Bearer ${token}` },
                    })
                    if (res.ok) fetchData()
                    else alert('Upload failed')
                    e.target.value = ''
                  }}
                />
              </label>
            </div>

            {media.length === 0 ? (
              <div className="text-center py-16 text-[#4a4a4a] bg-[#111111] border border-[#1a1a1a] rounded-xl">
                <ImageIcon className="w-8 h-8 mx-auto mb-3 opacity-30" />
                <p>No media uploaded yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {media.map((item) => (
                  <div key={item.id} className="group relative bg-[#111111] border border-[#1a1a1a] rounded-xl overflow-hidden hover:border-[#262626] transition-colors">
                    {item.mimeType.startsWith('image/') ? (
                      <img
                        src={item.url}
                        alt={item.alt ?? item.originalName}
                        className="w-full h-32 object-cover"
                      />
                    ) : (
                      <div className="w-full h-32 flex items-center justify-center bg-[#1a1a1a]">
                        <FileText className="w-8 h-8 text-[#4a4a4a]" />
                      </div>
                    )}
                    <div className="p-2">
                      <p className="text-[11px] text-[#888] truncate">{item.originalName}</p>
                      <p className="text-[10px] text-[#4a4a4a]">{(item.size / 1024).toFixed(0)} KB</p>
                    </div>
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors"
                        title="Open"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink size={13} className="text-white" />
                      </a>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(window.location.origin + item.url)
                          alert('URL copied!')
                        }}
                        className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors text-[11px] text-white font-mono"
                        title="Copy URL"
                      >
                        URL
                      </button>
                      <button
                        onClick={() => deleteMedia(item.id)}
                        className="w-8 h-8 bg-red-500/20 hover:bg-red-500/40 rounded-lg flex items-center justify-center transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={13} className="text-red-400" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-[#0d0d0d] border-t border-[#1a1a1a] flex items-center justify-around px-2 z-40">
        {MOBILE_NAV.map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={`flex flex-col items-center justify-center gap-1 h-full flex-1 transition-colors ${
              tab === item.id ? 'text-[#3b82f6]' : 'text-[#555] hover:text-[#888]'
            }`}
          >
            {item.icon}
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        ))}
      </div>

      <footer className="hidden md:block border-t border-[#1a1a1a] px-6 py-6 text-center">
        <p className="text-xs text-[#555555]">Made with VIAN by Viren Pandeyy</p>
      </footer>
    </div>
  )
}
