import { Router, type IRouter, Request, Response } from 'express'
import { LLMService } from '../services/LLMService'
import { cacheService } from '../services/CacheService'
import { codeAuditService } from '../services/CodeAuditService'
import { openCodeService } from '../services/OpenCodeService'

export const editRouter: IRouter = Router()

editRouter.post(
  '/',
  async (
    req: Request<Record<string, never>, unknown, { fileToEdit: string; instruction: string; model: string; currentContent?: string; allFiles?: Record<string, string> }>,
    res: Response
  ) => {
    const { fileToEdit, instruction, model, currentContent = '', allFiles } = req.body

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
      // ── Check if this is an OpenCode command ─────────────────────
      if (codeAuditService.isOpenCodeCommand(instruction)) {
        const commandType = codeAuditService.getCommandType(instruction)

        // Handle npm install commands — run silently, return result
        if (commandType === 'run') {
          send({ type: 'status', message: 'Running command...' })

          const filesArray = allFiles 
            ? Object.entries(allFiles).map(([path, content]) => ({ path, content }))
            : [{ path: fileToEdit || 'index.tsx', content: currentContent }]

          const result = await openCodeService.runCommand(instruction, filesArray)

          // Send result back as a message
          send({
            type: 'message',
            content: result.success
              ? `Command completed successfully.`
              : `Command output:\n${result.output}`,
          })

          send({ type: 'complete' })
          res.end()
          return
        }

        // Handle fix/debug commands — run OpenCode on current files
        if (commandType === 'fix' || commandType === 'explain') {
          send({
            type: 'status',
            message: commandType === 'fix' ? 'Analyzing and fixing...' : 'Analyzing code...',
          })

          const filesArray = allFiles 
            ? Object.entries(allFiles).map(([path, content]) => ({ path, content }))
            : [{ path: fileToEdit || 'index.tsx', content: currentContent }]

          const result = await openCodeService.auditAndFix({
            type: commandType,
            files: filesArray,
            prompt: instruction,
            context: 'User requested fix/debug',
          })

          // Stream fixed files back
          for (const file of result.files) {
            const originalContent = allFiles?.[file.path] || (file.path === fileToEdit ? currentContent : '')
            if (file.content !== originalContent) {
              send({
                type: 'file',
                path: file.path,
                content: file.content,
                language: guessLanguage(file.path),
              })
            }
          }

          if (result.fixed) {
            send({
              type: 'message',
              content: `Fixed ${result.files.length} file(s).`,
            })
          } else {
            send({
              type: 'message',
              content: commandType === 'explain'
                ? result.errors.join('\n') || 'No issues found.'
                : 'No changes needed — code looks correct.',
            })
          }

          send({ type: 'complete' })
          res.end()
          return
        }
      }

      // ── Normal edit flow (Groq/Llama) ───────────────────────────
      // Create cache key from instruction + file path
      const cacheKey = `${instruction}|${fileToEdit}`
      const cached = cacheService.get(cacheKey, model)
      
      if (cached) {
        console.log('[edit] Cache hit! Streaming cached edit')
        const lines = cached.split('\n').filter(line => line.trim())
        for (const line of lines) {
          try {
            const event = JSON.parse(line)
            if (event.type === 'file') {
              send({ type: 'file', path: event.path, content: event.content, language: event.language })
            }
          } catch (parseErr) {
            console.warn('[edit] Failed to parse cached line:', parseErr)
          }
        }
        send({ type: 'complete' })
        return
      }

      // No cache — call LLM and cache response
      const eventBuffer: string[] = []
      const editedFiles: { path: string; content: string; language?: string }[] = []

      // Collect all edited files first
      for await (const event of llm.editFile(instruction, currentContent, fileToEdit ?? '', model, allFiles)) {
        if (event.type === 'file') {
          editedFiles.push({
            path: event.path,
            content: event.content,
            language: event.language,
          })
        } else if (event.type === 'error') {
          send({ type: 'error', message: event.message })
        }
      }

      // ── Silent OpenCode audit on edited files ──
      send({ type: 'status', message: 'Preparing files...' })

      const auditedFiles = await codeAuditService.silentAudit(
        editedFiles.map(f => ({ path: f.path, content: f.content })),
        `Edit: ${instruction}`
      )

      // Stream audited files to frontend
      for (const file of auditedFiles) {
        const originalFile = editedFiles.find(f => f.path === file.path)
        const fileEvent = {
          type: 'file',
          path: file.path,
          content: file.content,
          language: originalFile?.language ?? guessLanguage(file.path),
        }
        send(fileEvent)
        eventBuffer.push(JSON.stringify(fileEvent))
      }

      send({ type: 'complete' })
      
      // Cache the edit result
      if (eventBuffer.length > 0) {
        const cacheEntry = eventBuffer.join('\n')
        cacheService.set(cacheKey, model, cacheEntry)
        console.log(`[edit] Cached ${eventBuffer.length} events`)
      }
    } catch (err: any) {
      console.error('[/api/edit] error:', err?.message ?? err)
      send({ type: 'error', message: err?.message ?? 'Edit failed' })
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
