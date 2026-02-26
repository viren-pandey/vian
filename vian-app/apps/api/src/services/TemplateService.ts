// Pre-built templates to avoid regenerating common patterns
export const TEMPLATES = {
  // Auth templates
  AUTH_LOGIN: `'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (!res.ok) throw new Error('Login failed')
      const { token } = await res.json()
      localStorage.setItem('token', token)
      router.push('/dashboard')
    } catch (err) {
      setError('Invalid credentials')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold mb-6">Login</h1>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full p-2 border rounded mb-4"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full p-2 border rounded mb-4"
        />
        <button className="w-full bg-blue-500 text-white p-2 rounded">Login</button>
      </form>
    </div>
  )
}`,

  // Dashboard template
  DASHBOARD: `'use client'
import { useEffect, useState } from 'react'

export default function DashboardPage() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then(data => { setData(data); setLoading(false) })
  }, [])

  if (loading) return <div>Loading...</div>

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-3 gap-4">
        {data.map((item: any) => (
          <div key={item.id} className="p-4 bg-white rounded shadow">
            <h2 className="font-semibold">{item.title}</h2>
            <p className="text-gray-600">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}`,

  // API CRUD template
  API_CRUD: `import { Router } from 'express'
import { PrismaClient } from '@prisma/client'

const router = Router()
const prisma = new PrismaClient()

// GET all
router.get('/', async (req, res) => {
  const items = await prisma.item.findMany()
  res.json(items)
})

// GET one
router.get('/:id', async (req, res) => {
  const item = await prisma.item.findUnique({ where: { id: req.params.id } })
  res.json(item)
})

// POST create
router.post('/', async (req, res) => {
  const item = await prisma.item.create({ data: req.body })
  res.json(item)
})

// PUT update
router.put('/:id', async (req, res) => {
  const item = await prisma.item.update({
    where: { id: req.params.id },
    data: req.body,
  })
  res.json(item)
})

// DELETE
router.delete('/:id', async (req, res) => {
  await prisma.item.delete({ where: { id: req.params.id } })
  res.json({ success: true })
})

export default router`,

  // Component patterns
  BUTTON: `export function Button({ children, onClick, variant = 'primary' }: any) {
  const styles = {
    primary: 'bg-blue-500 hover:bg-blue-600 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
  }
  return (
    <button onClick={onClick} className={\`px-4 py-2 rounded \${styles[variant]}\`}>
      {children}
    </button>
  )
}`,

  CARD: `export function Card({ title, children }: any) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-semibold mb-4">{title}</h3>
      {children}
    </div>
  )
}`,

  MODAL: `'use client'
import { useEffect } from 'react'

export function Modal({ isOpen, onClose, children }: any) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = 'auto'
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-lg p-6 max-w-lg w-full">
        {children}
      </div>
    </div>
  )
}`,
}

// Pattern matching for common requests
export function getTemplate(prompt: string): { name: string; code: string } | null {
  const lower = prompt.toLowerCase()

  if (lower.includes('login') || lower.includes('sign in')) {
    return { name: 'app/login/page.tsx', code: TEMPLATES.AUTH_LOGIN }
  }
  if (lower.includes('dashboard') && !lower.includes('api')) {
    return { name: 'app/dashboard/page.tsx', code: TEMPLATES.DASHBOARD }
  }
  if (lower.includes('crud') || (lower.includes('api') && lower.includes('route'))) {
    return { name: 'api/items/route.ts', code: TEMPLATES.API_CRUD }
  }
  if (lower.includes('button component')) {
    return { name: 'components/Button.tsx', code: TEMPLATES.BUTTON }
  }
  if (lower.includes('card component')) {
    return { name: 'components/Card.tsx', code: TEMPLATES.CARD }
  }
  if (lower.includes('modal')) {
    return { name: 'components/Modal.tsx', code: TEMPLATES.MODAL }
  }

  return null
}

// Suggest templates based on prompt
export function suggestTemplates(prompt: string): string[] {
  const suggestions: string[] = []
  const lower = prompt.toLowerCase()

  if (lower.includes('auth') || lower.includes('user')) {
    suggestions.push('auth-system')
  }
  if (lower.includes('todo') || lower.includes('task')) {
    suggestions.push('crud-pattern')
  }
  if (lower.includes('dashboard') || lower.includes('admin')) {
    suggestions.push('dashboard-layout')
  }

  return suggestions
}
