import { Router, type IRouter, type Request, type Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { keyManager } from '../services/KeyManager'

const prisma = new PrismaClient()

export const adminRouter: IRouter = Router()

// GET /api/admin/keys — Monitor all provider key health
adminRouter.get('/keys', (_req: Request, res: Response) => {
  function countKeys(prefix: string): number {
    let i = 1, count = 0
    while (process.env[`${prefix}_${i}`]) { count++; i++ }
    // also check single key fallback
    if (count === 0 && process.env[prefix]) count = 1
    return count
  }

  const providers = [
    {
      id: 'groq',
      name: 'Groq',
      description: 'Free tier — Llama, Mixtral',
      keyCount: countKeys('GROQ_API_KEY'),
      configured: countKeys('GROQ_API_KEY') > 0,
      color: 'green',
    },
    {
      id: 'gemini',
      name: 'Gemini',
      description: 'Google AI — Flash & Pro',
      keyCount: countKeys('GEMINI_API_KEY'),
      configured: countKeys('GEMINI_API_KEY') > 0,
      color: 'blue',
    },
    {
      id: 'anthropic',
      name: 'Anthropic',
      description: 'Claude Sonnet & Opus',
      keyCount: countKeys('ANTHROPIC_API_KEY'),
      configured: countKeys('ANTHROPIC_API_KEY') > 0,
      color: 'orange',
    },
    {
      id: 'openai',
      name: 'OpenAI',
      description: 'GPT-4o — key rotation',
      keyCount: countKeys('OPENAI_API_KEY'),
      configured: countKeys('OPENAI_API_KEY') > 0,
      color: 'purple',
    },
    {
      id: 'deepseek',
      name: 'DeepSeek',
      description: 'DeepSeek V3 & R1',
      keyCount: countKeys('DEEPSEEK_API_KEY'),
      configured: countKeys('DEEPSEEK_API_KEY') > 0,
      color: 'cyan',
    },
  ]

  const configuredCount = providers.filter((p) => p.configured).length
  res.json({ providers, configuredCount, totalProviders: providers.length })
})

// GET /api/admin/requests — List all beta requests
adminRouter.get('/requests', async (_req: Request, res: Response) => {
  try {
    const requests = await prisma.betaRequest.findMany({ orderBy: { createdAt: 'desc' } })
    res.json(requests)
  } catch (err) {
    res.status(500).json({ error: 'Database error' })
  }
})

// GET /api/admin/users — List all users
adminRouter.get('/users', async (_req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    })
    res.json(users)
  } catch (err) {
    res.status(500).json({ error: 'Database error' })
  }
})

// PATCH /api/admin/approve/:id — Approve a beta request + create user
adminRouter.patch('/approve/:id', async (req: Request, res: Response) => {
  const { id } = req.params
  try {
    const betaReq = await prisma.betaRequest.update({
      where: { id },
      data: { status: 'APPROVED' },
    })
    // Upsert the user as APPROVED
    await prisma.user.upsert({
      where: { email: betaReq.email },
      update: { role: 'APPROVED' },
      create: { name: betaReq.name, email: betaReq.email, role: 'APPROVED' },
    })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Database error' })
  }
})

// PATCH /api/admin/reject/:id — Reject a beta request
adminRouter.patch('/reject/:id', async (req: Request, res: Response) => {
  const { id } = req.params
  try {
    const betaReq = await prisma.betaRequest.update({
      where: { id },
      data: { status: 'REJECTED' },
    })
    await prisma.user.updateMany({
      where: { email: betaReq.email },
      data: { role: 'REJECTED' },
    })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Database error' })
  }
})

// PATCH /api/admin/revoke/:id — Revoke an approved user's access
adminRouter.patch('/revoke/:id', async (req: Request, res: Response) => {
  const { id } = req.params
  try {
    await prisma.betaRequest.update({
      where: { id },
      data: { status: 'REJECTED' },
    })
    // Mark user as REJECTED too
    const betaReq = await prisma.betaRequest.findUnique({ where: { id } })
    if (betaReq) {
      await prisma.user.updateMany({
        where: { email: betaReq.email },
        data: { role: 'REJECTED' },
      })
    }
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Database error' })
  }
})
