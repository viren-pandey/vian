import { Router, type IRouter, Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { LLMService } from '../services/LLMService'
import { FileValidator } from '../services/FileValidator'
import { cacheService } from '../services/CacheService'
import { getTemplate } from '../services/TemplateService'
import { promptOptimizer } from '../services/PromptOptimizer'
import { codeAuditService } from '../services/CodeAuditService'

console.log('[generation.ts] Loading generation routes with optimization features...')

export const generationRouter: IRouter = Router()

generationRouter.post(
  '/',
  async (
    req: Request<Record<string, never>, unknown, { prompt: string; model: string }>,
    res: Response
  ) => {
    const { prompt, model } = req.body

    if (!prompt?.trim()) {
      res.status(400).json({ error: 'prompt is required' })
      return
    }
    if (!model) {
      res.status(400).json({ error: 'model is required' })
      return
    }

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.flushHeaders()

    const send = (data: Record<string, unknown>) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`)
    }

    const projectId = uuidv4()
    const sessionId = uuidv4()
    const llm = new LLMService()
    const validator = new FileValidator()

    try {
      // Emit metadata first so the client can track the projectId
      send({ type: 'meta', projectId, sessionId })

      // Optimize prompt to reduce token usage
      let optimizedPrompt = prompt
      if (!promptOptimizer.isOptimized(prompt)) {
        const result = promptOptimizer.optimize(prompt)
        optimizedPrompt = result.compressed
        console.log(`[generate] Prompt optimized: ${result.compressionRatio}% reduction`)
        console.log(`[generate] Keywords: ${result.keywords.join(', ')}`)
      }

      // 1. Check cache first (exact or similar match) - use ORIGINAL prompt for cache key
      const cached = cacheService.get(prompt, model)
      if (cached) {
        console.log('[generate] Cache hit! Streaming cached response')
        // Parse and stream cached events
        const lines = cached.split('\n').filter(line => line.trim())
        for (const line of lines) {
          try {
            const event = JSON.parse(line)
            if (event.type === 'file' && event.path && validator.isValidPath(event.path)) {
              send({
                type: 'file',
                path: event.path,
                content: event.content,
                language: event.language ?? guessLanguage(event.path),
              })
            }
          } catch (parseErr) {
            console.warn('[generate] Failed to parse cached line:', parseErr)
          }
        }
        send({ type: 'complete', projectId })
        return
      }

      // 2. Check template library (common patterns)
      const template = getTemplate(prompt)
      if (template) {
        console.log(`[generate] Template match: ${template.name}`)
        const fileEvent = {
          type: 'file',
          path: template.name,
          content: template.code,
          language: guessLanguage(template.name)
        }
        
        send(fileEvent)
        send({ type: 'complete', projectId })
        
        // Cache the template response for future
        const cacheEntry = JSON.stringify(fileEvent)
        cacheService.set(prompt, model, cacheEntry)
        return
      }

      // 3. No cache/template — call LLM and cache response
      console.log('[generate] Cache miss — calling LLM')
      console.log(`[generate] Using optimized prompt: "${optimizedPrompt}"`)
      const eventBuffer: string[] = []
      const generatedFiles: { path: string; content: string; language: string }[] = []

      // Collect all generated files first
      for await (const event of llm.generateFiles(optimizedPrompt, model)) {
        if (event.type === 'file') {
          // Validate path before processing
          if (!event.path || !validator.isValidPath(event.path)) {
            console.warn(`[generate] Skipping invalid path: ${event.path}`)
            continue
          }

          // Basic TypeScript syntax check
          if (event.path && !validator.isValidTypeScript(event.content ?? '', event.path)) {
            console.warn(`[generate] Syntax warning for: ${event.path}`)
          }

          generatedFiles.push({
            path: event.path,
            content: event.content ?? '',
            language: event.language ?? guessLanguage(event.path),
          })

        } else if (event.type === 'error') {
          send({ type: 'error', message: event.message })
        }
      }

      // ── Silent OpenCode audit ───────────────────────────
      // User sees nothing — this runs invisibly
      send({ type: 'status', message: 'Preparing files...' })

      const auditedFiles = await codeAuditService.silentAudit(
        generatedFiles.map(f => ({ path: f.path, content: f.content })),
        `User prompt: ${prompt}`
      )

      // ── Stream audited files to frontend ─────────────────
      for (const file of auditedFiles) {
        const originalFile = generatedFiles.find(f => f.path === file.path)
        const fileEvent = {
          type: 'file',
          path: file.path,
          content: file.content,
          language: originalFile?.language ?? guessLanguage(file.path),
        }

        send(fileEvent)
        
        // Buffer for caching
        eventBuffer.push(JSON.stringify(fileEvent))
      }

      send({ type: 'complete', projectId })
      
      // Cache the complete response
      if (eventBuffer.length > 0) {
        const cacheEntry = eventBuffer.join('\n')
        cacheService.set(prompt, model, cacheEntry)
        console.log(`[generate] Cached ${eventBuffer.length} events for future use`)
      }
    } catch (err: any) {
      console.error('[/api/generate] FATAL ERROR:', err?.message ?? err)
      console.error('[/api/generate] Status:', err?.status)
      console.error('[/api/generate] Stack:', err?.stack)
      send({ type: 'error', message: err?.message ?? 'Generation failed' })
    } finally {
      res.end()
    }
  }
)

// GET /api/generate/stats - Cache performance statistics
generationRouter.get('/stats', (req: Request, res: Response) => {
  console.log('[/api/generate/stats] Stats endpoint called!')
  const stats = cacheService.stats()
  res.json({
    cache: stats,
    timestamp: new Date().toISOString(),
    performance: {
      avgCostSavings: stats.totalHits > 0 
        ? `~${(stats.totalHits * 0.05).toFixed(2)} USD saved` 
        : '0 USD',
      hitRate: stats.size > 0 
        ? `${((stats.totalHits / stats.size) * 100).toFixed(1)}%` 
        : '0%'
    }
  })
})

console.log('[generation.ts] Stats route registered at GET /stats')

function guessLanguage(path: string): string {
  const ext = path.split('.').pop() ?? ''
  const map: Record<string, string> = {
    tsx: 'typescript', ts: 'typescript',
    jsx: 'javascript', js: 'javascript',
    css: 'css', json: 'json',
    md: 'markdown', html: 'html',
    prisma: 'graphql', yaml: 'yaml', yml: 'yaml',
  }
  return map[ext] ?? 'plaintext'
}
