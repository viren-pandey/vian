import { useCallback, useRef } from 'react'
import { useProjectStore } from '@/stores/projectStore'
import { API_BASE } from '@/lib/constants'

export function useGeneration() {
  const {
    model,
    activeFile,
    files,
    setFile,
    setActiveFile,
    setIsGenerating,
    setProjectId,
    setErrorMessage,
    reset,
  } = useProjectStore()

  const bootWebContainer = useRef<((files: Record<string, string>) => Promise<void>) | null>(null)

  const registerBoot = useCallback((fn: (files: Record<string, string>) => Promise<void>) => {
    bootWebContainer.current = fn
  }, [])

  // SSE-based generation: streams file-by-file from the API
  const generate = useCallback(
    async (prompt: string) => {
      reset()
      setIsGenerating(true)
      setErrorMessage(null)

      const firstFileSet = { current: false }
      const allFiles: Record<string, string> = {}

      // ── Shared SSE-line processor ─────────────────────────────────────────
      const processLine = (line: string) => {
        if (!line.startsWith('data: ')) return
        const raw = line.slice(6).trim()
        if (!raw) return
        let event: Record<string, unknown>
        try { event = JSON.parse(raw) } catch { return }

        if (event.type === 'meta') {
          if (event.projectId) setProjectId(event.projectId as string)
        } else if (event.type === 'file') {
          const { path, content, language } = event as { path: string; content: string; language?: string }
          setFile(path, { path, content, language: language ?? 'typescript', status: 'complete' })
          allFiles[path] = content
          if (!firstFileSet.current) { firstFileSet.current = true; setActiveFile(path) }
        } else if (event.type === 'complete') {
          // Focus the main app file in the editor
          const mainFile = allFiles['src/App.tsx'] ? 'src/App.tsx'
            : allFiles['src/app.tsx'] ? 'src/app.tsx'
            : allFiles['src/main.tsx'] ? 'src/main.tsx'
            : null
          if (mainFile) setActiveFile(mainFile)
          // Boot WebContainer only once, after ALL files are received
          if (bootWebContainer.current && Object.keys(allFiles).length > 0) {
            bootWebContainer.current({ ...allFiles }).catch(console.error)
          }
        } else if (event.type === 'error') {
          throw new Error((event.message as string) ?? 'Generation failed')
        }
      }

      try {
        // ── API path — goes through Express → LLM provider ──────────────────
        const res = await fetch(`${API_BASE}/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, model }),
        })

        if (!res.ok || !res.body) {
          const text = await res.text()
          throw new Error(text || `HTTP ${res.status}`)
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''
          for (const line of lines) processLine(line)
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Generation failed'
        console.error('[useGeneration] error:', err)
        setErrorMessage(msg)
      } finally {
        setIsGenerating(false)
      }
    },
    [model, reset, setFile, setActiveFile, setIsGenerating, setProjectId, setErrorMessage]
  )

  // Edit via SSE — streams changed + new files from the API
  const editFile = useCallback(
    async (instruction: string, onSuccess?: (editedPath: string) => void) => {
      setIsGenerating(true)
      setErrorMessage(null)

      // Prefer the main app component over config/package files that are first in the editor
      const PREFERRED = ['src/App.tsx', 'src/app.tsx', 'src/App.jsx', 'src/main.tsx']
      const isComponentFile = (p: string) =>
        /\.(tsx|jsx)$/.test(p) &&
        !['package.json', 'vite.config.ts', 'tsconfig.json', 'tailwind.config.js', 'postcss.config.js'].includes(p)

      const smartFile =
        PREFERRED.find((f) => files[f]) ??
        Object.keys(files).find(isComponentFile) ??
        (activeFile && isComponentFile(activeFile) ? activeFile : null) ??
        activeFile ??
        ''

      const currentFileToEdit = smartFile
      const currentContent = smartFile ? (files[smartFile]?.content ?? '') : ''
      let firstEditedPath = currentFileToEdit

      try {
        const res = await fetch(`${API_BASE}/edit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileToEdit: currentFileToEdit,
            instruction,
            model,
            currentContent,
          }),
        })

        if (!res.ok || !res.body) {
          const text = await res.text()
          throw new Error(text || `HTTP ${res.status}`)
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        let firstFileSeen = false
        const updatedFiles: Record<string, string> = {}

        const processLine = (line: string) => {
          if (!line.startsWith('data: ')) return
          const raw = line.slice(6).trim()
          if (!raw) return
          let event: Record<string, unknown>
          try { event = JSON.parse(raw) } catch { return }

          if (event.type === 'file') {
            const { path, content, language } = event as { path: string; content: string; language?: string }
            setFile(path, { path, content, language: language ?? 'typescript', status: 'complete' })
            updatedFiles[path] = content
            if (!firstFileSeen) {
              firstFileSeen = true
              firstEditedPath = path
              setActiveFile(path)
            }
          } else if (event.type === 'error') {
            throw new Error((event.message as string) ?? 'Edit failed')
          }
        }

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''
          for (const line of lines) processLine(line)
        }

        // Reboot preview with merged updated files so the live preview reflects the edit
        if (bootWebContainer.current && Object.keys(updatedFiles).length > 0) {
          // Merge: start from current store files, overlay what the LLM changed
          const allCurrent: Record<string, string> = {}
          for (const [p, f] of Object.entries(files as Record<string, { content: string }>)) {
            if (f && typeof f === 'object' && typeof f.content === 'string') {
              allCurrent[p] = f.content
            }
          }
          Object.assign(allCurrent, updatedFiles)
          bootWebContainer.current(allCurrent).catch(console.error)
        }

        onSuccess?.(firstEditedPath)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Edit failed'
        console.error('[useGeneration] editFile error:', err)
        setErrorMessage(msg)
      } finally {
        setIsGenerating(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeFile, files, model, setFile, setActiveFile, setIsGenerating, setErrorMessage]
  )

  return { generate, editFile, registerBoot }
}
