import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import multer from 'multer'
import path from 'path'
import { requireAdmin } from '../middleware/requireAdmin'

const router = Router()
const prisma = new PrismaClient()
const upload = multer({
  dest: 'uploads/blog/',
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']
    cb(null, allowed.includes(file.mimetype))
  },
})

// ─── PUBLIC ROUTES ───────────────────────────────────────────────────────────

// GET /api/blog — all published posts
router.get('/', async (_req, res) => {
  try {
    const posts = await prisma.blogPost.findMany({
      where: { published: true },
      orderBy: { publishedAt: 'desc' },
      select: {
        id: true, title: true, slug: true,
        excerpt: true, coverImage: true,
        publishedAt: true, readTime: true,
        tags: { select: { name: true, slug: true } },
      },
    })
    res.json(posts)
  } catch {
    res.status(500).json({ error: 'Failed to fetch posts' })
  }
})

// GET /api/blog/latest?limit=3 — for landing page
router.get('/latest', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 3
    const posts = await prisma.blogPost.findMany({
      where: { published: true },
      orderBy: { publishedAt: 'desc' },
      take: limit,
      select: {
        id: true, title: true, slug: true,
        excerpt: true, coverImage: true,
        publishedAt: true, readTime: true,
        tags: { select: { name: true } },
      },
    })
    res.json(posts)
  } catch {
    res.status(500).json({ error: 'Failed to fetch posts' })
  }
})

// GET /api/blog/image/:filename — serve uploaded image
router.get('/image/:filename', (req, res) => {
  res.sendFile(path.resolve(`uploads/blog/${req.params.filename}`))
})

// GET /api/blog/:slug — single published post
router.get('/:slug', async (req, res) => {
  try {
    const post = await prisma.blogPost.findUnique({
      where: { slug: req.params.slug },
      include: { tags: true },
    })
    if (!post || !post.published) {
      return res.status(404).json({ error: 'Post not found' })
    }
    res.json(post)
  } catch {
    res.status(500).json({ error: 'Failed to fetch post' })
  }
})

// ─── ADMIN ROUTES ────────────────────────────────────────────────────────────

// GET /api/blog/admin/all — all posts (draft + published)
router.get('/admin/all', requireAdmin, async (_req, res) => {
  try {
    const posts = await prisma.blogPost.findMany({
      orderBy: { updatedAt: 'desc' },
      include: { tags: true },
    })
    res.json(posts)
  } catch {
    res.status(500).json({ error: 'Failed to fetch posts' })
  }
})

// GET /api/blog/admin/:id — single post by id (for editing)
router.get('/admin/:id', requireAdmin, async (req, res) => {
  try {
    const post = await prisma.blogPost.findUnique({
      where: { id: req.params.id },
      include: { tags: true },
    })
    if (!post) return res.status(404).json({ error: 'Post not found' })
    res.json(post)
  } catch {
    res.status(500).json({ error: 'Failed to fetch post' })
  }
})

// POST /api/blog/admin — create post
router.post('/admin', requireAdmin, async (req, res) => {
  try {
    const { title, slug, excerpt, content, coverImage, published, tags, readTime } = req.body

    const tagRecords = await Promise.all(
      ((tags as string[]) || []).map((name) =>
        prisma.blogTag.upsert({
          where: { name },
          update: {},
          create: { name, slug: name.toLowerCase().replace(/\s+/g, '-') },
        })
      )
    )

    const post = await prisma.blogPost.create({
      data: {
        title: title || 'Untitled',
        slug: slug || `draft-${Date.now()}`,
        excerpt: excerpt || '',
        content: content || '',
        coverImage: coverImage || null,
        readTime: readTime || 1,
        published: published || false,
        publishedAt: published ? new Date() : null,
        tags: { connect: tagRecords.map((t) => ({ id: t.id })) },
      },
      include: { tags: true },
    })
    res.json(post)
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create post' })
  }
})

// PUT /api/blog/admin/:id — update post
router.put('/admin/:id', requireAdmin, async (req, res) => {
  try {
    const { title, slug, excerpt, content, coverImage, published, tags, readTime } = req.body
    const existing = await prisma.blogPost.findUnique({ where: { id: req.params.id } })
    if (!existing) return res.status(404).json({ error: 'Post not found' })

    const tagRecords = await Promise.all(
      ((tags as string[]) || []).map((name) =>
        prisma.blogTag.upsert({
          where: { name },
          update: {},
          create: { name, slug: name.toLowerCase().replace(/\s+/g, '-') },
        })
      )
    )

    const post = await prisma.blogPost.update({
      where: { id: req.params.id },
      data: {
        title, slug, excerpt: excerpt || '', content: content || '',
        coverImage: coverImage || null, readTime: readTime || 1,
        published: published || false,
        publishedAt: published && !existing.publishedAt ? new Date() : existing.publishedAt,
        tags: { set: tagRecords.map((t) => ({ id: t.id })) },
      },
      include: { tags: true },
    })
    res.json(post)
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update post' })
  }
})

// DELETE /api/blog/admin/:id
router.delete('/admin/:id', requireAdmin, async (req, res) => {
  try {
    await prisma.blogPost.delete({ where: { id: req.params.id } })
    res.json({ success: true })
  } catch {
    res.status(500).json({ error: 'Failed to delete post' })
  }
})

// POST /api/blog/admin/cover — upload cover image
router.post('/admin/cover', requireAdmin, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
  res.json({ url: `/api/blog/image/${req.file.filename}` })
})

// POST /api/blog/admin/image — upload inline image (editor)
router.post('/admin/image', requireAdmin, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
  res.json({ url: `/api/blog/image/${req.file.filename}` })
})

export default router
