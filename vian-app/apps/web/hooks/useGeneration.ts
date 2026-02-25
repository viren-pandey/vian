import { useCallback, useRef } from 'react'
import { useProjectStore } from '@/stores/projectStore'
import { API_BASE } from '@/lib/constants'
import { BOILERPLATE_FILES } from '@/lib/boilerplate'

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

  // Refs to WebContainer functions registered by the studio page
  const writeFileRef = useRef<((path: string, content: string) => Promise<void>) | null>(null)
  const installRef   = useRef<(() => Promise<void>) | null>(null)
  const startDevRef  = useRef<(() => Promise<void>) | null>(null)

  const registerContainer = useCallback(
    (
      writeFile: (path: string, content: string) => Promise<void>,
      install:   () => Promise<void>,
      startDev:  () => Promise<void>,
    ) => {
      writeFileRef.current = writeFile
      installRef.current   = install
      startDevRef.current  = startDev
    },
    [],
  )

  // ── Generate: plant boilerplate -> install -> stream AI files -> startDev ──
  const generate = useCallback(
    async (prompt: string) => {
      reset()
      setIsGenerating(true)
      setErrorMessage(null)

      const localFiles: Record<string, string> = {}
      let devStarted = false

      try {
        // Step 1 -- plant all boilerplate files into WebContainer + store
        for (const file of BOILERPLATE_FILES) {
          await writeFileRef.current?.(file.path, file.content)
          setFile(file.path, {
            path:     file.path,
            content:  file.content,
            language: file.path.endsWith('.ts') || file.path.endsWith('.tsx') ? 'typescript' : 'plaintext',
            status:   'complete',
          })
          localFiles[file.path] = file.content
        }
        // Show the placeholder page in the editor while AI works
        setActiveFile('app/page.tsx')

        // Step 2 -- fire npm install in background (do NOT await)
        const installDone = installRef.current?.() ?? Promise.resolve()

        // Step 3 -- call AI generation SSE endpoint
        const res = await fetch(`${API_BASE}/generate`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ prompt, model }),
        })

        if (!res.ok || !res.body) {
          const text = await res.text()
          throw new Error(text || `HTTP ${res.status}`)
        }

        const reader  = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        const processLine = async (line: string) => {
          if (!line.startsWith('data: ')) return
          const raw = line.slice(6).trim()
          if (!raw) return

          let event: Record<string, unknown>
          try { event = JSON.parse(raw) } catch { return }

          if (event.type === 'meta') {
            if (event.projectId) setProjectId(event.projectId as string)

          } else if (event.type === 'file') {
            const { path, content, language } = event as {
              path: string; content: string; language?: string
            }
            // Update editor store
            setFile(path, {
              path,
              content,
              language: language ?? 'typescript',
              status:   'complete',
            })
            setActiveFile(path)
            localFiles[path] = content

            // Write to WebContainer filesystem
            await writeFileRef.current?.(path, content)

            // Step 4 -- when AI delivers app/page.tsx, wait for install then startDev
            if (
              (path === 'app/page.tsx' || path === 'pages/index.tsx') &&
              !devStarted
            ) {
              devStarted = true
              installDone
                .then(() => startDevRef.current?.())
                .catch(console.error)
            }

          } else if (event.type === 'complete') {
            // Ensure dev started even if AI never emitted app/page.tsx
            if (!devStarted) {
              devStarted = true
              installDone
                .then(() => startDevRef.current?.())
                .catch(console.error)
            }
            // Focus main page in editor
            const mainFile =
              localFiles['app/page.tsx']   ? 'app/page.tsx'
            : localFiles['pages/index.tsx'] ? 'pages/index.tsx'
            : null
            if (mainFile) setActiveFile(mainFile)

          } else if (event.type === 'error') {
            throw new Error((event.message as string) ?? 'Generation failed')
          }
        }

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const parts = buffer.split('\n')
          buffer = parts.pop() ?? ''
          for (const line of parts) {
            await processLine(line)
          }
        }

      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Generation failed'
        console.error('[useGeneration] generate error:', err)
        setErrorMessage(msg)
      } finally {
        setIsGenerating(false)
      }
    },
    [model, reset, setFile, setActiveFile, setIsGenerating, setProjectId, setErrorMessage],
  )

  // ── Edit: stream changed files -> write to container (Next.js HMR handles reloads) ──
  const editFile = useCallback(
    async (instruction: string, onSuccess?: (path: string) => void) => {
      setIsGenerating(true)
      setErrorMessage(null)

      // Prefer the main page over config files
      const PREFERRED = ['app/page.tsx', 'pages/index.tsx', 'app/page.jsx']
      const isComponent = (p: string) =>
        /\.(tsx|jsx|ts)$/.test(p) &&
        !['package.json', 'next.config.js', 'tsconfig.json', 'tailwind.config.ts', 'postcss.config.js'].includes(p)

      const smartFile =
        PREFERRED.find((f) => files[f]) ??
        Object.keys(files).find(isComponent) ??
        (activeFile && isComponent(activeFile) ? activeFile : null) ??
        activeFile ??
        ''

      const currentContent = smartFile ? (files[smartFile]?.content ?? '') : ''
      let firstEditedPath  = smartFile

      try {
        const res = await fetch(`${API_BASE}/edit`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            fileToEdit:     smartFile,
            instruction,
            model,
            currentContent,
          }),
        })

        if (!res.ok || !res.body) {
          const text = await res.text()
          throw new Error(text || `HTTP ${res.status}`)
        }

        const reader  = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer    = ''
        let firstSeen = false

        const processLine = async (line: string) => {
          if (!line.startsWith('data: ')) return
          const raw = line.slice(6).trim()
          if (!raw) return

          let event: Record<string, unknown>
          try { event = JSON.parse(raw) } catch { return }

          if (event.type === 'file') {
            const { path, content, language } = event as {
              path: string; content: string; language?: string
            }
            setFile(path, { path, content, language: language ?? 'typescript', status: 'complete' })
            if (!firstSeen) {
              firstSeen = true
              firstEditedPath = path
              setActiveFile(path)
            }
            // Write file -- Next.js HMR will hot-reload automatically
            await writeFileRef.current?.(path, content)

          } else if (event.type === 'error') {
            throw new Error((event.message as string) ?? 'Edit failed')
          }
        }

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const parts = buffer.split('\n')
          buffer = parts.pop() ?? ''
          for (const line of parts) {
            await processLine(line)
          }
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
    [activeFile, files, model, setFile, setActiveFile, setIsGenerating, setErrorMessage],
  )

  return { generate, editFile, registerContainer }
}
