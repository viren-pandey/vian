import { Router, type IRouter } from 'express'
import { PrismaClient } from '@prisma/client'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { requireAdmin } from '../middleware/requireAdmin'
import { auth } from '../middleware/auth'

const router: IRouter = Router()
const prisma = new PrismaClient()

const upload = multer({
  dest: 'uploads/media/',
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'image/png', 'image/jpeg', 'image/webp',
      'image/gif', 'image/svg+xml', 'video/mp4',
      'video/webm', 'application/pdf',
    ]
    cb(null, allowed.includes(file.mimetype))
  },
})

// ─── PUBLIC: serve uploaded file ─────────────────────────────────────────────
router.get('/file/:filename', (req, res) => {
  const filePath = path.resolve(`uploads/media/${req.params.filename}`)
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found' })
  res.sendFile(filePath)
})

// ─── AUTH: upload (any authenticated user OR admin) ──────────────────────────
router.post('/upload', auth, upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
  try {
    const url = `/api/media/file/${req.file.filename}`
    const media = await prisma.media.create({
      data: {
        filename:     req.file.filename,
        originalName: req.file.originalname,
        mimeType:     req.file.mimetype,
        size:         req.file.size,
        url,
        alt:          (req.body.alt as string | undefined) ?? null,
      },
    })
    res.json({ id: media.id, url, originalName: media.originalName, mimeType: media.mimeType })
  } catch (err: any) {
    res.status(500).json({ error: err.message ?? 'Upload failed' })
  }
})

// ─── ADMIN: list all media ──────────────────────────────────────────────────
router.get('/', requireAdmin, async (_req, res) => {
  try {
    const items = await prisma.media.findMany({
      orderBy: { createdAt: 'desc' },
    })
    res.json(items)
  } catch {
    res.status(500).json({ error: 'Failed to fetch media' })
  }
})

// ─── ADMIN: delete media ────────────────────────────────────────────────────
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const media = await prisma.media.findUnique({ where: { id: req.params.id } })
    if (!media) return res.status(404).json({ error: 'Not found' })

    // Remove file from disk
    const filePath = path.resolve(`uploads/media/${media.filename}`)
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)

    await prisma.media.delete({ where: { id: req.params.id } })
    res.json({ success: true })
  } catch {
    res.status(500).json({ error: 'Failed to delete media' })
  }
})

export default router
