import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface JWTPayload {
  userId: string
  email: string
  role: string
}

function getToken(req: Request): string | null {
  const auth = req.headers.authorization
  if (auth?.startsWith('Bearer ')) return auth.slice(7)
  return null
}

async function resolveUser(req: Request): Promise<JWTPayload | null> {
  const token = getToken(req)
  if (!token) return null
  try {
    const secret = process.env.JWT_ACCESS_SECRET ?? 'default-secret'
    return jwt.verify(token, secret) as JWTPayload
  } catch {
    return null
  }
}

export async function requireApproved(req: Request, res: Response, next: NextFunction) {
  const payload = await resolveUser(req)
  if (!payload) {
    res.status(401).json({ error: 'Unauthorized — please sign in' })
    return
  }

  const user = await prisma.user.findUnique({ where: { id: payload.userId } })
  if (!user) {
    res.status(401).json({ error: 'User not found' })
    return
  }

  if (user.role !== 'APPROVED' && user.role !== 'ULTIMATE_ADMIN') {
    res.status(403).json({ error: 'Access requires beta approval' })
    return
  }

  // Attach user to request for downstream handlers
  ;(req as Request & { user: typeof user }).user = user
  next()
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const payload = await resolveUser(req)
  if (!payload) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  const user = await prisma.user.findUnique({ where: { id: payload.userId } })
  if (!user || user.role !== 'ULTIMATE_ADMIN') {
    res.status(403).json({ error: 'Admin access required' })
    return
  }

  ;(req as Request & { user: typeof user }).user = user
  next()
}
