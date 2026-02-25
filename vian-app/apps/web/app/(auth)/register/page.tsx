'use client'

import { useState } from 'react'
import Link from 'next/link'

type Step = 'form' | 'success'

export default function RegisterPage() {
  const [step,    setStep]    = useState<Step>('form')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirm: '', reason: '',
  })

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) { setError('Passwords do not match'); return }
    if (form.password.length < 8)       { setError('Password must be at least 8 characters'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:     form.name.trim(),
          email:    form.email.trim(),
          password: form.password,
          reason:   form.reason.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Something went wrong'); return }
      setStep('success')
    } catch {
      setError('Network error — please try again')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-[#0d0d0d] relative flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center space-y-5">
          <div className="w-12 h-12 rounded-full bg-[#22c55e]/10 border border-[#22c55e]/20 flex items-center justify-center mx-auto">
            <svg className="w-5 h-5 text-[#22c55e]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#ededed] mb-1">Account created!</h2>
            <p className="text-sm text-[#888888] leading-relaxed">
              Your access request is under review. We&apos;ll let you know once it&apos;s approved — then you can sign in and start building.
            </p>
          </div>
          <Link
            href="/login"
            className="inline-block text-xs text-[#3b82f6] hover:text-[#60a5fa] transition-colors"
          >
            Go to sign in →
          </Link>
        </div>
      <footer className="absolute bottom-0 left-0 right-0 border-t border-[#1a1a1a] px-6 py-6 text-center">
        <p className="text-xs text-[#555555]">Made with VIAN by Viren Pandeyy</p>
      </footer>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] relative flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="text-center space-y-1">
          <div className="text-[#3b82f6] font-semibold text-lg">◆ VIAN</div>
          <h1 className="text-xl font-semibold text-[#ededed]">Create an account</h1>
          <p className="text-xs text-[#4a4a4a]">
            Register and request early access — we&apos;ll approve you shortly.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Name */}
          <div>
            <label className="block text-xs text-[#888888] mb-1.5">Full name</label>
            <input
              type="text"
              value={form.name}
              onChange={set('name')}
              placeholder="Alex Smith"
              required
              className="w-full bg-[#111111] border border-[#1a1a1a] hover:border-[#262626] focus:border-[#3b82f6] rounded-lg px-3.5 py-2.5 text-sm text-[#ededed] placeholder-[#4a4a4a] outline-none transition-colors"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs text-[#888888] mb-1.5">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={set('email')}
              placeholder="you@example.com"
              required
              className="w-full bg-[#111111] border border-[#1a1a1a] hover:border-[#262626] focus:border-[#3b82f6] rounded-lg px-3.5 py-2.5 text-sm text-[#ededed] placeholder-[#4a4a4a] outline-none transition-colors"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs text-[#888888] mb-1.5">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={set('password')}
              placeholder="Min. 8 characters"
              required
              className="w-full bg-[#111111] border border-[#1a1a1a] hover:border-[#262626] focus:border-[#3b82f6] rounded-lg px-3.5 py-2.5 text-sm text-[#ededed] placeholder-[#4a4a4a] outline-none transition-colors"
            />
          </div>

          {/* Confirm */}
          <div>
            <label className="block text-xs text-[#888888] mb-1.5">Confirm password</label>
            <input
              type="password"
              value={form.confirm}
              onChange={set('confirm')}
              placeholder="Re-enter password"
              required
              className="w-full bg-[#111111] border border-[#1a1a1a] hover:border-[#262626] focus:border-[#3b82f6] rounded-lg px-3.5 py-2.5 text-sm text-[#ededed] placeholder-[#4a4a4a] outline-none transition-colors"
            />
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs text-[#888888] mb-1.5">Why do you want access?</label>
            <textarea
              value={form.reason}
              onChange={set('reason')}
              placeholder="Briefly describe what you'd like to build…"
              required
              rows={3}
              className="w-full resize-none bg-[#111111] border border-[#1a1a1a] hover:border-[#262626] focus:border-[#3b82f6] rounded-lg px-3.5 py-2.5 text-sm text-[#ededed] placeholder-[#4a4a4a] outline-none transition-colors"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-[#ef4444]/10 border border-[#ef4444]/20 text-[#ef4444] text-xs rounded-lg px-3.5 py-2.5">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg px-4 py-2.5 transition-colors"
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-xs text-[#4a4a4a]">
          Already have an account?{' '}
          <Link href="/login" className="text-[#3b82f6] hover:text-[#60a5fa] transition-colors">
            Sign in
          </Link>
        </p>
      </div>
      <footer className="absolute bottom-0 left-0 right-0 border-t border-[#1a1a1a] px-6 py-6 text-center">
        <p className="text-xs text-[#555555]">Made with VIAN by Viren Pandeyy</p>
      </footer>
    </div>
  )
}
