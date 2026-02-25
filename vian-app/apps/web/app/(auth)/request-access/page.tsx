'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ChevronRight } from 'lucide-react'

export default function RequestAccessPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', reason: '' })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/request-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Something went wrong. Please try again.')
      }
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative bg-[#0d0d0d] text-[#f0f0f0] flex flex-col items-center justify-center px-6" style={{ fontFamily: "'Geist', sans-serif" }}>
      <button
        onClick={() => router.push('/')}
        className="absolute top-6 left-6 flex items-center gap-2 text-[#555555] text-sm hover:text-[#888888] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-10">
          <span className="text-[#3b82f6] text-lg font-semibold">◆</span>
          <span className="text-sm font-semibold tracking-tight">VIAN</span>
          <span className="text-[#333333] text-xs font-mono ml-1">by Viren</span>
        </div>

        {submitted ? (
          <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-8 text-center">
            <div className="w-10 h-10 rounded-full bg-[#1d3a6e]/40 flex items-center justify-center mx-auto mb-4">
              <span className="text-[#3b82f6] text-lg">◆</span>
            </div>
            <h2 className="text-lg font-semibold text-[#f0f0f0] mb-2">Request received</h2>
            <p className="text-[#555555] text-sm leading-relaxed">
              Thanks, <strong className="text-[#888888]">{form.name}</strong>! We'll review your request and
              reach out to <strong className="text-[#888888]">{form.email}</strong> within a few days.
            </p>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-semibold text-[#f0f0f0] mb-2">Request beta access</h1>
            <p className="text-[#555555] text-sm mb-8 leading-relaxed">
              VIAN is invite-only during beta. Tell us a bit about yourself and we'll be in touch.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-[#888888] mb-1.5" htmlFor="name">Full name</label>
                <input
                  id="name"
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Your name"
                  className="w-full bg-[#141414] border border-[#2a2a2a] hover:border-[#3a3a3a] focus:border-[#3b82f6] rounded-lg px-4 py-3 text-sm text-[#f0f0f0] placeholder:text-[#444444] focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs text-[#888888] mb-1.5" htmlFor="email">Work email</label>
                <input
                  id="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="you@company.com"
                  className="w-full bg-[#141414] border border-[#2a2a2a] hover:border-[#3a3a3a] focus:border-[#3b82f6] rounded-lg px-4 py-3 text-sm text-[#f0f0f0] placeholder:text-[#444444] focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs text-[#888888] mb-1.5" htmlFor="reason">Why do you want access?</label>
                <textarea
                  id="reason"
                  required
                  rows={4}
                  value={form.reason}
                  onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                  placeholder="What are you planning to build?"
                  className="w-full bg-[#141414] border border-[#2a2a2a] hover:border-[#3a3a3a] focus:border-[#3b82f6] rounded-lg px-4 py-3 text-sm text-[#f0f0f0] placeholder:text-[#444444] focus:outline-none transition-colors resize-none"
                />
              </div>

              {error && (
                <p className="text-xs text-[#ef4444] bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-lg px-4 py-3">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-6 py-3 rounded-lg transition-colors"
              >
                {loading ? 'Submitting…' : 'Request access'}
                {!loading && <ChevronRight className="w-4 h-4" />}
              </button>
            </form>
          </>
        )}
      </div>
      <footer className="absolute bottom-0 left-0 right-0 border-t border-[#1a1a1a] px-6 py-6 text-center">
        <p className="text-xs text-[#555555]">Made with VIAN by Viren Pandeyy</p>
      </footer>
    </div>
  )
}
