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
    setGenerationStatus,
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
    setGenerationStatus('Thinking…')

    const localFiles: Record<string, string> = {}

    try {
      // 1 -- Plant boilerplate
      setGenerationStatus('Setting up project structure…')
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

      // 2 -- Call new zero-cost code generator
      setGenerationStatus('Generating code with AI...')
      const res = await fetch(`${API_BASE}/codegen`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ prompt }),
      })
      
      if (!res.ok) {
        throw new Error((await res.text()) || `HTTP ${res.status}`)
      }

      const data = await res.json()

      // Handle "refreshing keys" response
      if (data.isRefreshing) {
        setGenerationStatus(data.message || 'Please wait... processing your request')
        // Wait a bit and retry
        await new Promise(resolve => setTimeout(resolve, 3000))
        const retryRes = await fetch(`${API_BASE}/codegen`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ prompt }),
        })
        const retryData = await retryRes.json()
        if (retryData.isRefreshing) {
          throw new Error(retryData.message || 'Service is refreshing, please try again')
        }
        Object.assign(data, retryData)
      }

      if (!data.success || !data.files || data.files.length === 0) {
        throw new Error('No code generated')
      }

      // 3 -- Write generated files
      for (const file of data.files) {
        const { path, content } = file

        // Hard block -- AI must never touch config files
        if (PROTECTED_FILES.has(path)) {
          console.warn(`[VIAN] Blocked AI from overwriting: ${path}`)
          continue
        }

        setGenerationStatus(`Writing ${path}…`)
        const language = path.endsWith('.tsx') || path.endsWith('.ts') ? 'typescript' :
                        path.endsWith('.jsx') || path.endsWith('.js') ? 'javascript' :
                        path.endsWith('.css') ? 'css' : 'plaintext'
        
        setFile(path, { path, content, language, status: 'complete' })
        setActiveFile(path)
        localFiles[path] = content
        await writeFile(path, content)
      }

      // 4 -- Re-enforce correct config files (Vite blocker)
      setGenerationStatus('Enforcing config files…')
      await writeFile('package.json', CORRECT_PACKAGE_JSON)
      await writeFile('next.config.js', CORRECT_NEXT_CONFIG)
      console.log('[VIAN] Config files enforced.')

      // Focus main page in editor
      const mainFile = localFiles['app/page.tsx'] ? 'app/page.tsx'
        : localFiles['pages/index.tsx'] ? 'pages/index.tsx'
        : Object.keys(localFiles).find(f => f.endsWith('.tsx') || f.endsWith('.jsx'))
      if (mainFile) setActiveFile(mainFile)

      // 5 -- Install + boot (awaited install, then dev server)
      setGenerationStatus('Installing dependencies…')
      setIsGenerating(false)
      setGenerationStatus(null)
      installAndBoot() // don't await -- server-ready event handles preview

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Generation failed'
      console.error('[useGeneration] generate error:', err)
      
      // Show friendly message for quota errors
      if (msg.includes('429') || msg.includes('quota') || msg.includes('refreshing')) {
        setErrorMessage('⏳ Please wait... API keys refreshing. Try again in a moment.')
      } else {
        setErrorMessage(msg)
      }
      
      setGenerationStatus(null)
      setIsGenerating(false)
    }
  }, [model, reset, setFile, setActiveFile, setIsGenerating, setProjectId, setErrorMessage, setGenerationStatus, writeFile, installAndBoot])

  const editFile = useCallback(async (instruction: string, onSuccess?: (path: string) => void) => {
    setIsGenerating(true)
    setErrorMessage(null)
    setGenerationStatus('Analysing your code…')

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
      // Use codegen endpoint with edit prompt
      const editPrompt = `Edit this file: ${smartFile}

Current code:
\`\`\`
${currentContent}
\`\`\`

Instruction: ${instruction}

Return the updated file with the changes applied. Keep the same file name.`

      setGenerationStatus('Analyzing code...')
      const res = await fetch(`${API_BASE}/codegen`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ prompt: editPrompt }),
      })
      
      if (!res.ok) {
        throw new Error((await res.text()) || `HTTP ${res.status}`)
      }

      const data = await res.json()

      // Handle "refreshing keys" response
      if (data.isRefreshing) {
        setGenerationStatus(data.message || 'Please wait... processing your request')
        await new Promise(resolve => setTimeout(resolve, 3000))
        const retryRes = await fetch(`${API_BASE}/codegen`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ prompt: editPrompt }),
        })
        const retryData = await retryRes.json()
        if (retryData.isRefreshing) {
          throw new Error(retryData.message || 'Service is refreshing, please try again')
        }
        Object.assign(data, retryData)
      }

      if (!data.success || !data.files || data.files.length === 0) {
        throw new Error('No changes generated')
      }

      // Write edited files
      let firstSeen = false
      for (const file of data.files) {
        const { path, content } = file
        setGenerationStatus(`Rewriting ${path}…`)
        
        const language = path.endsWith('.tsx') || path.endsWith('.ts') ? 'typescript' :
                        path.endsWith('.jsx') || path.endsWith('.js') ? 'javascript' :
                        path.endsWith('.css') ? 'css' : 'plaintext'
        
        setFile(path, { path, content, language, status: 'complete' })
        
        if (!firstSeen) { 
          firstSeen = true
          firstEditedPath = path
          setActiveFile(path)
        }
        
        await writeFileRef.current(path, content)
      }

      onSuccess?.(firstEditedPath)

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Edit failed'
      console.error('[useGeneration] editFile error:', err)
      
      // Show friendly message for quota errors
      if (msg.includes('429') || msg.includes('quota') || msg.includes('refreshing')) {
        setErrorMessage('⏳ Please wait... API keys refreshing. Try again in a moment.')
      } else {
        setErrorMessage(msg)
      }
    } finally {
      setGenerationStatus(null)
      setIsGenerating(false)
    }
  }, [activeFile, files, model, setFile, setActiveFile, setIsGenerating, setErrorMessage, setGenerationStatus, writeFile])

  return { generate, editFile }
}
