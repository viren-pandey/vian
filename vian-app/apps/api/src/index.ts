import 'dotenv/config'
import express, { type Express } from 'express'
import cors from 'cors'
import path from 'path'
import { generationRouter } from './routes/generation'
import { editRouter } from './routes/edit'
import { projectsRouter } from './routes/projects'
import { exportRouter } from './routes/export'
import { adminRouter } from './routes/admin'
import { authRouter } from './routes/auth'
import blogRouter from './routes/blog'
import { errorHandler } from './middleware/errorHandler'

const app: Express = express()
const PORT = process.env.PORT ?? 4000

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({ origin: 'http://localhost:3000', credentials: true }))
app.use(express.json({ limit: '10mb' }))

// ─── Static uploads ──────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.resolve('uploads')))

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/generate', generationRouter)
app.use('/api/edit', editRouter)
app.use('/api/projects', projectsRouter)
app.use('/api/export', exportRouter)
app.use('/api/admin', adminRouter)
app.use('/api/auth', authRouter)
app.use('/api/blog', blogRouter)

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'vian-api', version: '1.0.0' }))

// ─── Error Handler ────────────────────────────────────────────────────────────
app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`◆ VIAN API running on http://localhost:${PORT}`)
})

export default app
