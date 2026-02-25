import { Router, type IRouter, Request, Response } from 'express'
import { LLMService } from '../services/LLMService'

export const editRouter: IRouter = Router()

editRouter.post(
  '/',
  async (
    req: Request<Record<string, never>, unknown, { fileToEdit: string; instruction: string; model: string; currentContent?: string }>,
    res: Response
  ) => {
    const { fileToEdit, instruction, model, currentContent = '' } = req.body

    if (!instruction?.trim()) {
      res.status(400).json({ error: 'instruction is required' })
      return
    }
    if (!model) {
      res.status(400).json({ error: 'model is required' })
      return
    }

    // SSE headers — mirrors the generation route
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.flushHeaders()

    const send = (data: Record<string, unknown>) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`)
    }

    const llm = new LLMService()

    try {
      for await (const event of llm.editFile(instruction, currentContent, fileToEdit ?? '', model)) {
        if (event.type === 'file') {
          send({ type: 'file', path: event.path, content: event.content, language: event.language })
        } else if (event.type === 'complete') {
          send({ type: 'complete' })
        } else if (event.type === 'error') {
          send({ type: 'error', message: event.message })
        }
      }
    } catch (err: any) {
      console.error('[/api/edit] error:', err?.message ?? err)
      send({ type: 'error', message: err?.message ?? 'Edit failed' })
    } finally {
      res.end()
    }
  }
)
