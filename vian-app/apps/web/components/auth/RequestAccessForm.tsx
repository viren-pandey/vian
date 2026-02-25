'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export function RequestAccessForm() {
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

  if (submitted) {
    return (
      <div className="text-center space-y-3">
        <span className="text-success text-3xl">✓</span>
        <p className="text-sm text-text-primary font-ui">Request submitted!</p>
        <p className="text-xs text-text-muted font-ui">We&apos;ll be in touch soon.</p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md">
      <button
        onClick={() => router.push('/')}
        className="flex items-center gap-2 text-text-muted text-xs font-ui hover:text-text-secondary transition-colors mb-8"
      >
        <ArrowLeft size={14} /> Back
      </button>

      <div className="flex items-center gap-2 mb-8">
        <span className="text-accent font-semibold">◆</span>
        <span className="text-sm font-semibold font-ui">VIAN</span>
      </div>

      <h1 className="text-xl font-semibold text-text-primary font-ui mb-1">Request access</h1>
      <p className="text-xs text-text-muted font-ui mb-6">
        VIAN is currently in private beta. Tell us a bit about yourself.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Name"
          placeholder="Your name"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          required
        />
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          required
        />
        <div className="flex flex-col gap-1">
          <label className="text-xs text-text-secondary font-ui">Why do you want access?</label>
          <textarea
            rows={3}
            placeholder="Tell us what you want to build..."
            value={form.reason}
            onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
            required
            className="px-3 py-2 rounded bg-elevated border border-border-default text-sm text-text-primary placeholder-text-muted font-ui outline-none transition-colors focus:border-border-strong resize-none"
          />
        </div>

        {error && <p className="text-xs text-error font-ui">{error}</p>}

        <Button type="submit" loading={loading} className="w-full">
          Submit request
          <ChevronRight size={14} />
        </Button>
      </form>
    </div>
  )
}
