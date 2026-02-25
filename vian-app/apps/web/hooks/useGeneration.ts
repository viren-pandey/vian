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

      // Config files the AI must NEVER overwrite
      const BLOCKED_PATHS = new Set([
        'package.json',
        'next.config.js',
        'tsconfig.json',
        'postcss.config.js',
      ])

      // Canonical configs re-enforced after AI stream ends
      const CORRECT_PACKAGE_JSON = `{
  "name": "vian-app",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "14.2.5",
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "clsx": "2.1.1",
    "lucide-react": "0.395.0"
  },
  "devDependencies": {
    "@types/node": "20.14.2",
    "@types/react": "18.3.3",
    "@types/react-dom": "18.3.0",
    "autoprefixer": "10.4.19",
    "postcss": "8.4.38",
    "tailwindcss": "3.4.4",
    "typescript": "5.4.5"
  }
}`

      const CORRECT_NEXT_CONFIG = `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
        ],
      },
    ]
  },
}
module.exports = nextConfig`

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

            // Fix 1: hard block — AI must never overwrite config files
            if (BLOCKED_PATHS.has(path)) {
              console.warn(`[VIAN] Blocked AI from overwriting: ${path}`)
              return
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

          } else if (event.type === 'complete') {
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

        // Fix 2+3: Re-enforce correct configs AFTER AI stream ends, then install + boot
        // This guarantees no Vite ever reaches npm run dev
        await writeFileRef.current?.('package.json', CORRECT_PACKAGE_JSON)
        await writeFileRef.current?.('next.config.js', CORRECT_NEXT_CONFIG)
        console.log('[VIAN] Config files enforced — Vite blocked.')

        // Fix 3: install and startDev AFTER generation (not before)
        await installRef.current?.()
        startDevRef.current?.()

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
