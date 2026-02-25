'use client'

import { useRef, useCallback } from 'react'
import { useWebContainer } from './useWebContainer'
import { BOILERPLATE_FILES } from '@/lib/boilerplate'
import { useProjectStore } from '@/stores/projectStore'
import { API_BASE } from '@/lib/constants'

// Config files the AI must NEVER overwrite
const PROTECTED_FILES = new Set([
  'package.json',
  'next.config.js',
  'tsconfig.json',
  'postcss.config.js',
])

// Correct package.json to re-enforce after AI stream ends
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

  const { writeFile, installAndBoot } = useWebContainer()

  // Refs so editFile can always access latest writeFile
  const writeFileRef    = useRef(writeFile)
  const installAndBootRef = useRef(installAndBoot)
  writeFileRef.current    = writeFile
  installAndBootRef.current = installAndBoot

  const generate = useCallback(async (prompt: string) => {
    reset()
    setIsGenerating(true)
    setErrorMessage(null)

    const localFiles: Record<string, string> = {}

    try {
      // 1 -- Plant boilerplate
      for (const file of BOILERPLATE_FILES) {
        await writeFile(file.path, file.content)
        setFile(file.path, {
          path:     file.path,
          content:  file.content,
          language: file.path.endsWith('.ts') || file.path.endsWith('.tsx') ? 'typescript' : 'plaintext',
          status:   'complete',
        })
        localFiles[file.path] = file.content
      }
      setActiveFile('app/page.tsx')

      // 2 -- Stream AI files
      const res = await fetch(`${API_BASE}/generate`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ prompt, model }),
      })
      if (!res.ok || !res.body) {
        throw new Error((await res.text()) || `HTTP ${res.status}`)
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

        if (event.type === 'meta' && event.projectId) {
          setProjectId(event.projectId as string)

        } else if (event.type === 'file') {
          const { path, content, language } = event as { path: string; content: string; language?: string }

          // Hard block -- AI must never touch config files
          if (PROTECTED_FILES.has(path)) {
            console.warn(`[VIAN] Blocked AI from overwriting: ${path}`)
            return
          }

          setFile(path, { path, content, language: language ?? 'typescript', status: 'complete' })
          setActiveFile(path)
          localFiles[path] = content
          await writeFile(path, content)

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
        for (const line of parts) { await processLine(line) }
      }

      // 3 -- Re-enforce correct config files (Vite blocker)
      await writeFile('package.json', CORRECT_PACKAGE_JSON)
      await writeFile('next.config.js', CORRECT_NEXT_CONFIG)
      console.log('[VIAN] Config files enforced.')

      // Focus main page in editor
      const mainFile = localFiles['app/page.tsx'] ? 'app/page.tsx'
        : localFiles['pages/index.tsx'] ? 'pages/index.tsx'
        : null
      if (mainFile) setActiveFile(mainFile)

      // 4 -- Install + boot (awaited install, then dev server)
      setIsGenerating(false)
      installAndBoot() // don't await -- server-ready event handles preview

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Generation failed'
      console.error('[useGeneration] generate error:', err)
      setErrorMessage(msg)
      setIsGenerating(false)
    }
  }, [model, reset, setFile, setActiveFile, setIsGenerating, setProjectId, setErrorMessage, writeFile, installAndBoot])

  const editFile = useCallback(async (instruction: string, onSuccess?: (path: string) => void) => {
    setIsGenerating(true)
    setErrorMessage(null)

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
        body:    JSON.stringify({ fileToEdit: smartFile, instruction, model, currentContent }),
      })
      if (!res.ok || !res.body) throw new Error((await res.text()) || `HTTP ${res.status}`)

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
          const { path, content, language } = event as { path: string; content: string; language?: string }
          setFile(path, { path, content, language: language ?? 'typescript', status: 'complete' })
          if (!firstSeen) { firstSeen = true; firstEditedPath = path; setActiveFile(path) }
          await writeFileRef.current(path, content)
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
        for (const line of parts) { await processLine(line) }
      }

      onSuccess?.(firstEditedPath)

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Edit failed'
      console.error('[useGeneration] editFile error:', err)
      setErrorMessage(msg)
    } finally {
      setIsGenerating(false)
    }
  }, [activeFile, files, model, setFile, setActiveFile, setIsGenerating, setErrorMessage, writeFile])

  return { generate, editFile }
}
