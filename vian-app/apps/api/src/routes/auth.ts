import { Router, type IRouter, type Request, type Response } from 'express'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export const authRouter: IRouter = Router()

const secret = () => process.env.JWT_ACCESS_SECRET ?? 'vian-dev-secret'

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/register — Create account + request access in one step
// ─────────────────────────────────────────────────────────────────────────────
authRouter.post('/register', async (req: Request, res: Response) => {
  const { name, email, password, reason } = req.body as {
    name?: string; email?: string; password?: string; reason?: string
  }

  if (!name?.trim() || !email?.trim() || !password?.trim() || !reason?.trim()) {
    res.status(400).json({ error: 'name, email, password, and reason are required' })
    return
  }
  if (!isValidEmail(email)) {
    res.status(400).json({ error: 'Invalid email address' })
    return
  }
  if (password.length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters' })
    return
  }

  const normalizedEmail = email.toLowerCase().trim()

  try {
    // Check for existing account
    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } })
    if (existingUser) {
      res.status(409).json({ error: 'An account with this email already exists. Please sign in.' })
      return
    }

    const passwordHash = await bcrypt.hash(password, 12)

    // Create user + beta request in a transaction
    await prisma.$transaction(async (tx) => {
      await tx.user.create({
        data: {
          name: name.trim(),
          email: normalizedEmail,
          passwordHash,
          role: 'PENDING',
        },
      })
      // Upsert BetaRequest (may already exist from old request-access flow)
      await tx.betaRequest.upsert({
        where: { email: normalizedEmail },
        update: { name: name.trim(), reason: reason.trim(), status: 'PENDING' },
        create: {
          name: name.trim(),
          email: normalizedEmail,
          reason: reason.trim(),
          status: 'PENDING',
        },
      })
    })

    res.status(201).json({ success: true, message: 'Account created! Your access request is under review.' })
  } catch (err) {
    console.error('[auth] register error:', err)
    res.status(500).json({ error: 'Registration failed — please try again later' })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/login — Sign in
// ─────────────────────────────────────────────────────────────────────────────
authRouter.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body as { email?: string; password?: string }

  if (!email?.trim() || !password?.trim()) {
    res.status(400).json({ error: 'Email and password are required' })
    return
  }

  const normalizedEmail = email.toLowerCase().trim()

  // ── Admin login (env-var credentials) ────────────────────────────────────
  const adminEmail    = (process.env.ADMIN_EMAIL    ?? '').toLowerCase()
  const adminPassword =  process.env.ADMIN_PASSWORD ?? ''

  if (normalizedEmail === adminEmail && password === adminPassword) {
    const admin = await prisma.user.upsert({
      where:  { email: adminEmail },
      update: { role: 'ULTIMATE_ADMIN' },
      create: { email: adminEmail, name: 'Admin', role: 'ULTIMATE_ADMIN' },
    })
    const token = jwt.sign(
      { userId: admin.id, email: adminEmail, role: 'ULTIMATE_ADMIN' },
      secret(), { expiresIn: '7d' },
    )
    res.json({ token, user: { id: admin.id, name: admin.name, email: adminEmail, role: 'ULTIMATE_ADMIN' } })
    return
  }

  // ── Regular user login ────────────────────────────────────────────────────
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } })
  if (!user) {
    res.status(404).json({ error: 'no_account', message: 'No account found with this email. Please register first.' })
    return
  }

  // Verify password (if set)
  if (user.passwordHash) {
    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      res.status(401).json({ error: 'invalid_password', message: 'Incorrect password.' })
      return
    }
  }

  // Check approval status
  if (user.role === 'PENDING') {
    res.status(403).json({ error: 'pending', message: "Your access request is still under review. We'll notify you when it's approved." })
    return
  }
  if (user.role === 'REJECTED') {
    res.status(403).json({ error: 'rejected', message: 'Your access request was not approved.' })
    return
  }

  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    secret(), { expiresIn: '7d' },
  )
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } })
})

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/forgot-password — Send password reset (stub with UI feedback)
// ─────────────────────────────────────────────────────────────────────────────
authRouter.post('/forgot-password', async (req: Request, res: Response) => {
  const { email } = req.body as { email?: string }
  if (!email?.trim() || !isValidEmail(email)) {
    res.status(400).json({ error: 'Valid email is required' })
    return
  }
  // Always return success so we don't leak whether an account exists
  // In production: send a reset link via email (nodemailer / Resend / SendGrid)
  res.json({ success: true, message: 'If an account exists for this email, a reset link has been sent.' })
})

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/auth/me — Validate token and return current user
// ─────────────────────────────────────────────────────────────────────────────
authRouter.get('/me', async (req: Request, res: Response) => {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) { res.status(401).json({ error: 'No token' }); return }
  const token = auth.slice(7)
  try {
    const payload = jwt.verify(token, secret()) as { userId: string; email: string; role: string }
    const user = await prisma.user.findUnique({ where: { id: payload.userId } })
    if (!user) { res.status(401).json({ error: 'User not found' }); return }
    res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } })
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/change-password — Change password for authenticated user
// ─────────────────────────────────────────────────────────────────────────────
authRouter.post('/change-password', async (req: Request, res: Response) => {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) { res.status(401).json({ error: 'No token' }); return }
  const token = auth.slice(7)

  const { currentPassword, newPassword } = req.body as { currentPassword?: string; newPassword?: string }
  if (!currentPassword?.trim() || !newPassword?.trim()) {
    res.status(400).json({ error: 'currentPassword and newPassword are required' })
    return
  }
  if (newPassword.length < 8) {
    res.status(400).json({ error: 'New password must be at least 8 characters' })
    return
  }

  try {
    const payload = jwt.verify(token, secret()) as { userId: string; email: string }
    const user = await prisma.user.findUnique({ where: { id: payload.userId } })
    if (!user || !user.passwordHash) { res.status(401).json({ error: 'User not found' }); return }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!valid) { res.status(401).json({ error: 'Current password is incorrect' }); return }

    const newHash = await bcrypt.hash(newPassword, 12)
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash: newHash } })
    res.json({ success: true, message: 'Password updated successfully' })
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/request-access — Legacy: kept for direct form submissions
// ─────────────────────────────────────────────────────────────────────────────
authRouter.post('/request-access', async (req: Request, res: Response) => {
  const { name, email, reason } = req.body as { name?: string; email?: string; reason?: string }

  if (!name?.trim() || !email?.trim() || !reason?.trim()) {
    res.status(400).json({ error: 'name, email, and reason are required' })
    return
  }
  if (!isValidEmail(email)) {
    res.status(400).json({ error: 'Invalid email address' })
    return
  }

  try {
    const existing = await prisma.betaRequest.findUnique({ where: { email: email.toLowerCase() } })
    if (existing) {
      res.status(409).json({ error: 'A request with this email already exists' })
      return
    }
    await prisma.betaRequest.create({
      data: { name: name.trim(), email: email.toLowerCase().trim(), reason: reason.trim(), status: 'PENDING' },
    })
    res.status(201).json({ success: true, message: 'Request received — we will be in touch!' })
  } catch (err) {
    console.error('[auth] request-access error:', err)
    res.status(500).json({ error: 'Database error — please try again later' })
  }
})
