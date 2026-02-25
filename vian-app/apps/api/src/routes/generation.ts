import { Router, type IRouter, Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { LLMService } from '../services/LLMService'
import { FileValidator } from '../services/FileValidator'

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

      for await (const event of llm.generateFiles(prompt, model)) {
        if (event.type === 'file') {
          // Validate path before forwarding to client
          if (!event.path || !validator.isValidPath(event.path)) {
            console.warn(`[generate] Skipping invalid path: ${event.path}`)
            continue
          }

          // Basic TypeScript syntax check
          if (event.path && !validator.isValidTypeScript(event.content ?? '', event.path)) {
            console.warn(`[generate] Syntax warning for: ${event.path}`)
            // Still send it — partial content is better than nothing
          }

          send({
            type: 'file',
            path: event.path,
            content: event.content,
            language: event.language ?? guessLanguage(event.path),
          })

        } else if (event.type === 'complete') {
          send({ type: 'complete', projectId })

        } else if (event.type === 'error') {
          send({ type: 'error', message: event.message })
        }
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
