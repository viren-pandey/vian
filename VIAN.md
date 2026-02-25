# VIAN System Architecture & Implementation Blueprint

> **Author:** Viren Pandey  
> **Purpose:** Complete system specification for GitHub Copilot / AI to build the VIAN codebase from scratch without errors.  
> **Stack:** Next.js 14 · Express · TypeScript · pnpm Workspaces · WebContainers · Prisma · Tailwind CSS

---

## 1. Project Overview

**VIAN by Viren** is an AI-powered full-stack application generator that allows users to:
- Generate complete Next.js applications via natural language prompts
- Preview live running applications in real-time (not HTML files — actual running servers via WebContainers)
- Edit generated code using AI chat with model selection (OpenAI / Anthropic)
- Share and export complete projects

**Core Principle:** `Generate → Stream → Execute → Preview → Edit → Share`

---

## 2. Monorepo Structure (STRICT — DO NOT DEVIATE)

```
vian-app/
├── apps/
│   ├── web/                          # Next.js 14 Frontend
│   │   ├── app/
│   │   │   ├── layout.tsx            # Root layout (metadata, providers)
│   │   │   ├── page.tsx              # Home page (renders immediately)
│   │   │   ├── globals.css           # Global Tailwind styles
│   │   │   └── api/                  # Next.js API routes (if needed)
│   │   ├── components/
│   │   │   ├── FileExplorer.tsx
│   │   │   ├── CodeEditor.tsx
│   │   │   ├── PreviewPanel.tsx
│   │   │   ├── ChatInput.tsx
│   │   │   └── ModelSelector.tsx
│   │   ├── hooks/
│   │   │   ├── useFileTree.ts
│   │   │   ├── useGeneration.ts
│   │   │   └── useWebContainer.ts
│   │   ├── lib/
│   │   │   ├── api-client.ts         # Axios wrapper for backend calls
│   │   │   ├── websocket.ts          # WebSocket streaming helper
│   │   │   ├── types.ts              # Frontend-only types
│   │   │   └── utils.ts
│   │   ├── public/
│   │   ├── next.config.js
│   │   ├── tailwind.config.js
│   │   ├── postcss.config.js
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── api/                          # Express Backend
│       ├── src/
│       │   ├── index.ts              # Main server entry point
│       │   ├── routes/
│       │   │   ├── generation.ts     # POST /api/generate
│       │   │   ├── edit.ts           # POST /api/edit
│       │   │   ├── projects.ts       # GET/POST /api/projects
│       │   │   └── export.ts         # POST /api/export
│       │   ├── services/
│       │   │   ├── LLMService.ts     # OpenAI / Anthropic API calls
│       │   │   ├── FileGenerator.ts  # Code generation + file assembly
│       │   │   ├── ProjectManager.ts # Project CRUD with Prisma
│       │   │   └── ValidationService.ts
│       │   ├── middleware/
│       │   │   ├── auth.ts
│       │   │   └── errorHandler.ts
│       │   └── types/
│       │       └── index.ts
│       ├── tsconfig.json
│       └── package.json
│
├── packages/
│   ├── shared-types/                 # Shared TypeScript types (both apps import this)
│   │   ├── src/
│   │   │   └── index.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   ├── prisma/                       # Database (Postgres via Prisma)
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── package.json
│   │
│   └── ui-lib/                       # Shared UI primitives
│       ├── src/
│       │   ├── Button.tsx
│       │   ├── Input.tsx
│       │   └── index.ts
│       ├── tsconfig.json
│       └── package.json
│
├── package.json                      # Workspace root
├── pnpm-workspace.yaml
├── tsconfig.json                     # Root TS config (base)
└── README.md
```

---

## 3. Root Configuration Files

### 3.1 `package.json` (Root Workspace)

```json
{
  "name": "@vian/monorepo",
  "version": "1.0.0",
  "description": "VIAN - AI-powered full-stack app generator by Viren",
  "private": true,
  "packageManager": "pnpm@8.0.0",
  "scripts": {
    "dev": "pnpm -r --parallel run dev",
    "build": "pnpm -r --filter './apps/**' --filter './packages/**' run build",
    "start": "pnpm -C apps/api start & pnpm -C apps/web start",
    "lint": "pnpm -r run lint",
    "type-check": "pnpm -r run type-check"
  },
  "devDependencies": {
    "typescript": "^5.3.3",
    "prettier": "^3.1.0",
    "eslint": "^8.55.0"
  },
  "pnpm": {
    "overrides": {
      "react": "^18.2.0",
      "react-dom": "^18.2.0"
    }
  }
}
```

### 3.2 `pnpm-workspace.yaml`

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

### 3.3 Root `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

---

## 4. `packages/shared-types`

### 4.1 `packages/shared-types/package.json`

```json
{
  "name": "@vian/shared-types",
  "version": "1.0.0",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch"
  },
  "devDependencies": {
    "typescript": "^5.3.3"
  }
}
```

### 4.2 `packages/shared-types/src/index.ts`

```typescript
// ─── Generation ───────────────────────────────────────────────────────────────

export interface GenerationRequest {
  prompt: string
  model: 'gpt-4o' | 'gpt-4-turbo' | 'claude-3-5-sonnet' | 'claude-3-opus'
  projectName?: string
  sessionId?: string
}

export interface GenerationResponse {
  sessionId: string
  projectId: string
  status: 'streaming' | 'complete' | 'error'
  files: GeneratedFile[]
  error?: string
}

// ─── Files ────────────────────────────────────────────────────────────────────

export interface GeneratedFile {
  path: string           // e.g. "src/app/page.tsx"
  name: string           // e.g. "page.tsx"
  content: string        // Raw file content
  language: string       // e.g. "typescript"
  isDirectory: boolean
}

export interface FileNode {
  path: string
  name: string
  isDirectory: boolean
  children?: FileNode[]
  status?: 'pending' | 'generating' | 'complete' | 'error'
}

// ─── Projects ─────────────────────────────────────────────────────────────────

export interface Project {
  id: string
  name: string
  prompt: string
  model: string
  files: GeneratedFile[]
  createdAt: Date
  updatedAt: Date
  userId?: string
}

// ─── Edit ─────────────────────────────────────────────────────────────────────

export interface EditRequest {
  projectId: string
  fileToEdit: string     // file path
  instruction: string    // user's natural language edit command
  model: 'gpt-4o' | 'claude-3-5-sonnet'
  currentContent: string
}

export interface EditResponse {
  updatedContent: string
  explanation: string
}

// ─── Streaming ────────────────────────────────────────────────────────────────

export interface StreamChunk {
  type: 'file_start' | 'file_content' | 'file_end' | 'done' | 'error'
  filePath?: string
  content?: string
  error?: string
}

// ─── Export ───────────────────────────────────────────────────────────────────

export interface ExportRequest {
  projectId: string
  format: 'zip' | 'github'
}
```

---

## 5. `apps/web` — Next.js 14 Frontend

### 5.1 `apps/web/package.json`

```json
{
  "name": "@vian/web",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3000",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "next": "^14.0.4",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@webcontainer/api": "^1.1.9",
    "zustand": "^4.4.7",
    "axios": "^1.6.2",
    "@monaco-editor/react": "^4.6.0",
    "react-resizable-panels": "^2.0.3",
    "tailwindcss": "^3.4.0",
    "clsx": "^2.0.0",
    "@vian/shared-types": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.3.3",
    "@types/node": "^20.10.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "eslint": "^8.55.0",
    "eslint-config-next": "^14.0.4"
  }
}
```

### 5.2 `apps/web/next.config.js`

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required for WebContainers
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
        { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
      ],
    },
  ],
  // Proxy API calls to Express backend
  rewrites: async () => [
    {
      source: '/api/:path*',
      destination: 'http://localhost:4000/api/:path*',
    },
  ],
}

module.exports = nextConfig
```

### 5.3 `apps/web/tailwind.config.js`

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0d0d0d',
        surface: '#161616',
        border: '#2a2a2a',
        accent: '#7c3aed',
        'accent-light': '#a78bfa',
        muted: '#6b7280',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}
```

### 5.4 `apps/web/app/globals.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: #0d0d0d;
  --foreground: #f5f5f5;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  background-color: var(--background);
  color: var(--foreground);
  font-family: 'Inter', sans-serif;
  height: 100vh;
  overflow: hidden;
}

/* Scrollbar */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: #161616; }
::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: #3a3a3a; }
```

### 5.5 `apps/web/app/layout.tsx`

```typescript
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'VIAN — AI App Generator',
  description: 'Generate full-stack Next.js applications with AI by Viren',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
```

### 5.6 `apps/web/app/page.tsx`

```typescript
'use client'

import { useState } from 'react'
import FileExplorer from '@/components/FileExplorer'
import CodeEditor from '@/components/CodeEditor'
import PreviewPanel from '@/components/PreviewPanel'
import ChatInput from '@/components/ChatInput'
import ModelSelector from '@/components/ModelSelector'
import { useGeneration } from '@/hooks/useGeneration'
import type { FileNode } from '@vian/shared-types'

export default function Home() {
  const {
    isGenerating,
    files,
    selectedFile,
    selectedFileContent,
    generatedAppUrl,
    generate,
    editFile,
    selectFile,
  } = useGeneration()

  const [model, setModel] = useState<'gpt-4o' | 'claude-3-5-sonnet'>('gpt-4o')

  return (
    <div className="flex flex-col h-screen bg-background text-white">

      {/* Top Bar */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold text-accent-light">VIAN</span>
          <span className="text-xs text-muted">by Viren</span>
        </div>
        <ModelSelector value={model} onChange={setModel} />
      </header>

      {/* Main 3-Panel Layout */}
      <div className="flex flex-1 overflow-hidden">

        {/* Panel 1: File Explorer */}
        <aside className="w-56 flex-shrink-0 border-r border-border overflow-y-auto">
          <FileExplorer files={files} onSelectFile={selectFile} />
        </aside>

        {/* Panel 2: Code Editor */}
        <main className="flex-1 overflow-hidden">
          <CodeEditor
            filePath={selectedFile}
            content={selectedFileContent}
            isLoading={isGenerating && !selectedFileContent}
          />
        </main>

        {/* Panel 3: Preview */}
        <section className="w-[45%] flex-shrink-0 border-l border-border">
          <PreviewPanel url={generatedAppUrl} isLoading={isGenerating} />
        </section>

      </div>

      {/* Bottom: Chat Input */}
      <div className="border-t border-border flex-shrink-0">
        <ChatInput
          onSubmit={(prompt) => generate(prompt, model)}
          onEdit={(instruction) => editFile(instruction, model)}
          isGenerating={isGenerating}
          hasProject={files.length > 0}
        />
      </div>

    </div>
  )
}
```

---

### 5.7 `apps/web/components/ModelSelector.tsx`

```typescript
'use client'

interface ModelSelectorProps {
  value: string
  onChange: (model: 'gpt-4o' | 'claude-3-5-sonnet') => void
}

const MODELS = [
  { id: 'gpt-4o', label: 'GPT-4o', provider: 'OpenAI' },
  { id: 'claude-3-5-sonnet', label: 'Claude 3.5 Sonnet', provider: 'Anthropic' },
] as const

export default function ModelSelector({ value, onChange }: ModelSelectorProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as 'gpt-4o' | 'claude-3-5-sonnet')}
      className="bg-surface border border-border text-sm text-white rounded-md px-3 py-1.5 focus:outline-none focus:border-accent cursor-pointer"
    >
      {MODELS.map((m) => (
        <option key={m.id} value={m.id}>
          {m.label} ({m.provider})
        </option>
      ))}
    </select>
  )
}
```

### 5.8 `apps/web/components/FileExplorer.tsx`

```typescript
'use client'

import { useState } from 'react'
import clsx from 'clsx'
import type { FileNode } from '@vian/shared-types'

interface FileExplorerProps {
  files: FileNode[]
  onSelectFile: (path: string) => void
}

const FILE_ICONS: Record<string, string> = {
  tsx: '⚛',
  ts: '🔷',
  js: '🟡',
  json: '📋',
  css: '🎨',
  md: '📄',
  default: '📄',
}

function getIcon(name: string): string {
  const ext = name.split('.').pop() ?? 'default'
  return FILE_ICONS[ext] ?? FILE_ICONS.default
}

function FileNodeItem({
  node,
  depth,
  onSelectFile,
}: {
  node: FileNode
  depth: number
  onSelectFile: (path: string) => void
}) {
  const [expanded, setExpanded] = useState(depth === 0)

  const handleClick = () => {
    if (node.isDirectory) {
      setExpanded((prev) => !prev)
    } else {
      onSelectFile(node.path)
    }
  }

  return (
    <div>
      <div
        onClick={handleClick}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        className={clsx(
          'flex items-center gap-1.5 py-0.5 pr-2 text-sm cursor-pointer rounded hover:bg-white/5 select-none',
          node.status === 'generating' && 'text-accent-light animate-pulse',
          node.status === 'error' && 'text-red-400',
          !node.isDirectory && 'text-gray-300',
          node.isDirectory && 'text-gray-100 font-medium'
        )}
      >
        <span className="text-xs">
          {node.isDirectory ? (expanded ? '▾' : '▸') : getIcon(node.name)}
        </span>
        <span className="truncate">{node.name}</span>
      </div>
      {node.isDirectory && expanded && node.children && (
        <div>
          {node.children.map((child) => (
            <FileNodeItem
              key={child.path}
              node={child}
              depth={depth + 1}
              onSelectFile={onSelectFile}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function FileExplorer({ files, onSelectFile }: FileExplorerProps) {
  if (files.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted text-xs p-4 text-center">
        Files will appear here after generation
      </div>
    )
  }

  return (
    <div className="py-2">
      <div className="px-3 py-1 text-xs font-semibold uppercase text-muted tracking-wider mb-1">
        Explorer
      </div>
      {files.map((node) => (
        <FileNodeItem key={node.path} node={node} depth={0} onSelectFile={onSelectFile} />
      ))}
    </div>
  )
}
```

### 5.9 `apps/web/components/CodeEditor.tsx`

```typescript
'use client'

import dynamic from 'next/dynamic'

// Monaco must be dynamically imported (no SSR)
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false })

interface CodeEditorProps {
  filePath: string | null
  content: string
  isLoading: boolean
  onChange?: (content: string) => void
}

function getLanguage(path: string | null): string {
  if (!path) return 'plaintext'
  const ext = path.split('.').pop() ?? ''
  const map: Record<string, string> = {
    tsx: 'typescript',
    ts: 'typescript',
    jsx: 'javascript',
    js: 'javascript',
    json: 'json',
    css: 'css',
    md: 'markdown',
    html: 'html',
    prisma: 'prisma',
  }
  return map[ext] ?? 'plaintext'
}

export default function CodeEditor({ filePath, content, isLoading, onChange }: CodeEditorProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-[#1e1e1e]">
        <div className="text-muted text-sm animate-pulse">Generating code...</div>
      </div>
    )
  }

  if (!filePath) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#1e1e1e] gap-2">
        <span className="text-4xl">✦</span>
        <p className="text-muted text-sm">Select a file or generate a project</p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* File Tab */}
      <div className="flex items-center px-4 py-2 bg-surface border-b border-border text-sm text-gray-400">
        <span>{filePath}</span>
      </div>
      <div className="flex-1">
        <MonacoEditor
          height="100%"
          language={getLanguage(filePath)}
          value={content}
          onChange={(val) => onChange?.(val ?? '')}
          theme="vs-dark"
          options={{
            fontSize: 13,
            fontFamily: 'JetBrains Mono, Fira Code, monospace',
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            padding: { top: 16 },
            lineNumbers: 'on',
            renderLineHighlight: 'gutter',
            automaticLayout: true,
          }}
        />
      </div>
    </div>
  )
}
```

### 5.10 `apps/web/components/PreviewPanel.tsx`

```typescript
'use client'

interface PreviewPanelProps {
  url: string | null
  isLoading: boolean
}

export default function PreviewPanel({ url, isLoading }: PreviewPanelProps) {
  return (
    <div className="flex flex-col h-full bg-surface">
      {/* Preview Header */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-surface flex-shrink-0">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/60" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
          <div className="w-3 h-3 rounded-full bg-green-500/60" />
        </div>
        <div className="flex-1 bg-background rounded px-2 py-0.5 text-xs text-muted truncate">
          {url ?? 'Preview loading...'}
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex-1 relative bg-white">
        {isLoading && !url && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface gap-3">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            <p className="text-muted text-sm">Building your application...</p>
          </div>
        )}
        {url && (
          <iframe
            src={url}
            className="w-full h-full border-0"
            title="VIAN Preview"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        )}
        {!isLoading && !url && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface gap-2">
            <span className="text-5xl opacity-20">◻</span>
            <p className="text-muted text-sm">Preview will load after generation</p>
          </div>
        )}
      </div>
    </div>
  )
}
```

### 5.11 `apps/web/components/ChatInput.tsx`

```typescript
'use client'

import { useState, useRef, KeyboardEvent } from 'react'

interface ChatInputProps {
  onSubmit: (prompt: string) => void
  onEdit: (instruction: string) => void
  isGenerating: boolean
  hasProject: boolean
}

export default function ChatInput({ onSubmit, onEdit, isGenerating, hasProject }: ChatInputProps) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = () => {
    const trimmed = value.trim()
    if (!trimmed || isGenerating) return
    if (hasProject) {
      onEdit(trimmed)
    } else {
      onSubmit(trimmed)
    }
    setValue('')
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="px-4 py-3 bg-background">
      <div className="max-w-4xl mx-auto flex items-end gap-2 bg-surface border border-border rounded-xl px-4 py-2">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            hasProject
              ? 'Describe an edit... (e.g. "Add a dark mode toggle")'
              : 'Describe your app... (e.g. "A todo app with auth and a dashboard")'
          }
          rows={1}
          disabled={isGenerating}
          className="flex-1 bg-transparent resize-none outline-none text-sm text-gray-200 placeholder-muted py-1 max-h-40 disabled:opacity-50"
          style={{ lineHeight: '1.5rem' }}
        />
        <button
          onClick={handleSubmit}
          disabled={isGenerating || !value.trim()}
          className="flex-shrink-0 bg-accent hover:bg-accent/80 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg px-4 py-1.5 text-sm font-medium transition-colors"
        >
          {isGenerating ? '...' : hasProject ? 'Edit' : 'Generate'}
        </button>
      </div>
      <p className="text-center text-xs text-muted mt-2">
        {hasProject ? 'Editing mode — changes apply to selected file' : 'Enter to generate · Shift+Enter for new line'}
      </p>
    </div>
  )
}
```

---

### 5.12 `apps/web/hooks/useGeneration.ts`

```typescript
import { useState, useCallback } from 'react'
import { generateProject, editFileAPI } from '@/lib/api-client'
import { buildFileTree } from '@/lib/utils'
import type { FileNode, GeneratedFile } from '@vian/shared-types'

interface GenerationState {
  isGenerating: boolean
  files: FileNode[]
  rawFiles: GeneratedFile[]
  selectedFile: string | null
  selectedFileContent: string
  generatedAppUrl: string | null
}

export function useGeneration() {
  const [state, setState] = useState<GenerationState>({
    isGenerating: false,
    files: [],
    rawFiles: [],
    selectedFile: null,
    selectedFileContent: '',
    generatedAppUrl: null,
  })

  const generate = useCallback(async (prompt: string, model: string) => {
    setState((prev) => ({ ...prev, isGenerating: true, files: [], rawFiles: [], generatedAppUrl: null }))
    try {
      const result = await generateProject({ prompt, model: model as any })
      const tree = buildFileTree(result.files)
      setState((prev) => ({
        ...prev,
        isGenerating: false,
        files: tree,
        rawFiles: result.files,
        // WebContainer URL would come from useWebContainer hook
        generatedAppUrl: null,
      }))
    } catch (err) {
      console.error('Generation error:', err)
      setState((prev) => ({ ...prev, isGenerating: false }))
    }
  }, [])

  const editFile = useCallback(async (instruction: string, model: string) => {
    if (!state.selectedFile) return
    setState((prev) => ({ ...prev, isGenerating: true }))
    try {
      const result = await editFileAPI({
        projectId: 'current',
        fileToEdit: state.selectedFile!,
        instruction,
        model: model as any,
        currentContent: state.selectedFileContent,
      })
      setState((prev) => ({
        ...prev,
        isGenerating: false,
        selectedFileContent: result.updatedContent,
      }))
    } catch (err) {
      console.error('Edit error:', err)
      setState((prev) => ({ ...prev, isGenerating: false }))
    }
  }, [state.selectedFile, state.selectedFileContent])

  const selectFile = useCallback((path: string) => {
    const file = state.rawFiles.find((f) => f.path === path)
    setState((prev) => ({
      ...prev,
      selectedFile: path,
      selectedFileContent: file?.content ?? '',
    }))
  }, [state.rawFiles])

  return {
    ...state,
    generate,
    editFile,
    selectFile,
  }
}
```

### 5.13 `apps/web/hooks/useWebContainer.ts`

```typescript
import { useEffect, useRef, useState } from 'react'
import type { WebContainer } from '@webcontainer/api'
import type { GeneratedFile } from '@vian/shared-types'

export function useWebContainer() {
  const containerRef = useRef<WebContainer | null>(null)
  const [url, setUrl] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'booting' | 'installing' | 'running' | 'error'>('idle')

  useEffect(() => {
    return () => {
      containerRef.current?.teardown()
    }
  }, [])

  const boot = async (files: GeneratedFile[]) => {
    setStatus('booting')
    try {
      // Lazy import — WebContainers only work in browser
      const { WebContainer } = await import('@webcontainer/api')
      const container = await WebContainer.boot()
      containerRef.current = container

      // Mount files
      const fileSystemTree: Record<string, any> = {}
      for (const file of files) {
        if (!file.isDirectory) {
          const parts = file.path.split('/')
          let node = fileSystemTree
          for (let i = 0; i < parts.length - 1; i++) {
            node[parts[i]] = node[parts[i]] ?? { directory: {} }
            node = node[parts[i]].directory
          }
          node[parts[parts.length - 1]] = { file: { contents: file.content } }
        }
      }
      await container.mount(fileSystemTree)

      // Install dependencies
      setStatus('installing')
      const installProcess = await container.spawn('npm', ['install'])
      await installProcess.exit

      // Run dev server
      setStatus('running')
      await container.spawn('npm', ['run', 'dev'])

      // Listen for server URL
      container.on('server-ready', (_port, serverUrl) => {
        setUrl(serverUrl)
      })
    } catch (err) {
      console.error('WebContainer error:', err)
      setStatus('error')
    }
  }

  return { url, status, boot }
}
```

### 5.14 `apps/web/lib/api-client.ts`

```typescript
import axios from 'axios'
import type {
  GenerationRequest,
  GenerationResponse,
  EditRequest,
  EditResponse,
  ExportRequest,
} from '@vian/shared-types'

const api = axios.create({
  baseURL: '/api',   // proxied by next.config.js to Express on :4000
  timeout: 120_000,  // 2 minutes for generation
})

export async function generateProject(req: GenerationRequest): Promise<GenerationResponse> {
  const { data } = await api.post<GenerationResponse>('/generate', req)
  return data
}

export async function editFileAPI(req: EditRequest): Promise<EditResponse> {
  const { data } = await api.post<EditResponse>('/edit', req)
  return data
}

export async function exportProject(req: ExportRequest): Promise<Blob> {
  const { data } = await api.post('/export', req, { responseType: 'blob' })
  return data
}

export async function fetchProjects() {
  const { data } = await api.get('/projects')
  return data
}
```

### 5.15 `apps/web/lib/utils.ts`

```typescript
import type { FileNode, GeneratedFile } from '@vian/shared-types'

/**
 * Converts a flat list of GeneratedFile into a nested FileNode tree
 * suitable for rendering in the FileExplorer component.
 */
export function buildFileTree(files: GeneratedFile[]): FileNode[] {
  const root: FileNode[] = []

  for (const file of files) {
    const parts = file.path.split('/')
    let currentLevel = root

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      const isLast = i === parts.length - 1
      const existingNode = currentLevel.find((n) => n.name === part)

      if (existingNode) {
        if (!isLast && existingNode.children) {
          currentLevel = existingNode.children
        }
      } else {
        const newNode: FileNode = {
          name: part,
          path: parts.slice(0, i + 1).join('/'),
          isDirectory: !isLast,
          status: 'complete',
          children: !isLast ? [] : undefined,
        }
        currentLevel.push(newNode)
        if (!isLast && newNode.children) {
          currentLevel = newNode.children
        }
      }
    }
  }

  return sortTree(root)
}

function sortTree(nodes: FileNode[]): FileNode[] {
  return nodes
    .sort((a, b) => {
      // Directories first
      if (a.isDirectory && !b.isDirectory) return -1
      if (!a.isDirectory && b.isDirectory) return 1
      return a.name.localeCompare(b.name)
    })
    .map((node) => ({
      ...node,
      children: node.children ? sortTree(node.children) : undefined,
    }))
}
```

---

## 6. `apps/api` — Express Backend

### 6.1 `apps/api/package.json`

```json
{
  "name": "@vian/api",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "openai": "^4.20.0",
    "@anthropic-ai/sdk": "^0.17.0",
    "uuid": "^9.0.0",
    "archiver": "^6.0.1",
    "@vian/shared-types": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.3.3",
    "@types/express": "^4.17.21",
    "@types/cors": "^2.8.17",
    "@types/uuid": "^9.0.7",
    "@types/archiver": "^6.0.2",
    "@types/node": "^20.10.0",
    "tsx": "^4.6.0"
  }
}
```

### 6.2 `apps/api/src/index.ts`

```typescript
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { generationRouter } from './routes/generation'
import { editRouter } from './routes/edit'
import { projectsRouter } from './routes/projects'
import { exportRouter } from './routes/export'
import { errorHandler } from './middleware/errorHandler'

dotenv.config()

const app = express()
const PORT = process.env.PORT ?? 4000

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({ origin: 'http://localhost:3000', credentials: true }))
app.use(express.json({ limit: '10mb' }))

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/generate', generationRouter)
app.use('/api/edit', editRouter)
app.use('/api/projects', projectsRouter)
app.use('/api/export', exportRouter)

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'vian-api' }))

// ─── Error Handler ────────────────────────────────────────────────────────────
app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`✦ VIAN API running on http://localhost:${PORT}`)
})

export default app
```

### 6.3 `apps/api/src/services/LLMService.ts`

```typescript
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export type SupportedModel = 'gpt-4o' | 'gpt-4-turbo' | 'claude-3-5-sonnet' | 'claude-3-opus'

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

/**
 * Single unified interface for calling any supported LLM.
 * Returns the full text response.
 */
export async function callLLM(
  model: SupportedModel,
  messages: LLMMessage[],
  maxTokens = 8192
): Promise<string> {
  if (model.startsWith('gpt')) {
    const response = await openai.chat.completions.create({
      model,
      messages,
      max_tokens: maxTokens,
      temperature: 0.2,
    })
    return response.choices[0]?.message?.content ?? ''
  }

  if (model.startsWith('claude')) {
    const [system, ...rest] = messages
    const response = await anthropic.messages.create({
      model: model === 'claude-3-5-sonnet' ? 'claude-3-5-sonnet-20241022' : 'claude-3-opus-20240229',
      max_tokens: maxTokens,
      system: system?.role === 'system' ? system.content : undefined,
      messages: rest.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    })
    const block = response.content[0]
    return block.type === 'text' ? block.text : ''
  }

  throw new Error(`Unsupported model: ${model}`)
}
```

### 6.4 `apps/api/src/services/FileGenerator.ts`

```typescript
import { callLLM, type SupportedModel } from './LLMService'
import type { GeneratedFile } from '@vian/shared-types'

const SYSTEM_PROMPT = `You are VIAN, an expert full-stack Next.js application generator.

When given a user prompt, generate a COMPLETE, production-ready Next.js 14 application.

RULES:
1. Always use the App Router (app/ directory)
2. Use TypeScript for ALL files  
3. Use Tailwind CSS for styling
4. Include package.json with all required dependencies
5. Include next.config.js and tailwind.config.js
6. Generate REAL, working code — not placeholders
7. Respond ONLY with valid JSON in this exact format:

{
  "files": [
    {
      "path": "relative/path/to/file.tsx",
      "name": "file.tsx",
      "content": "...full file content...",
      "language": "typescript",
      "isDirectory": false
    }
  ]
}

DO NOT include markdown, explanations, or any text outside the JSON.`

export async function generateFiles(
  prompt: string,
  model: SupportedModel
): Promise<GeneratedFile[]> {
  const raw = await callLLM(
    model,
    [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `Generate a Next.js application for: ${prompt}` },
    ],
    16384
  )

  // Strip markdown code fences if present
  const cleaned = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()

  let parsed: { files: GeneratedFile[] }
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    throw new Error('LLM returned invalid JSON. Raw response: ' + raw.slice(0, 500))
  }

  if (!Array.isArray(parsed.files)) {
    throw new Error('LLM response missing "files" array')
  }

  return parsed.files
}
```

### 6.5 `apps/api/src/routes/generation.ts`

```typescript
import { Router, Request, Response, NextFunction } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { generateFiles } from '../services/FileGenerator'
import type { GenerationRequest, GenerationResponse } from '@vian/shared-types'

export const generationRouter = Router()

generationRouter.post('/', async (
  req: Request<{}, {}, GenerationRequest>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { prompt, model, projectName } = req.body

    if (!prompt?.trim()) {
      return res.status(400).json({ error: 'prompt is required' })
    }
    if (!model) {
      return res.status(400).json({ error: 'model is required' })
    }

    const sessionId = uuidv4()
    const projectId = uuidv4()

    const files = await generateFiles(prompt, model as any)

    const response: GenerationResponse = {
      sessionId,
      projectId,
      status: 'complete',
      files,
    }

    return res.json(response)
  } catch (err) {
    next(err)
  }
})
```

### 6.6 `apps/api/src/routes/edit.ts`

```typescript
import { Router, Request, Response, NextFunction } from 'express'
import { callLLM } from '../services/LLMService'
import type { EditRequest, EditResponse } from '@vian/shared-types'

export const editRouter = Router()

editRouter.post('/', async (
  req: Request<{}, {}, EditRequest>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { fileToEdit, instruction, model, currentContent } = req.body

    if (!instruction?.trim()) {
      return res.status(400).json({ error: 'instruction is required' })
    }

    const raw = await callLLM(
      model as any,
      [
        {
          role: 'system',
          content: `You are VIAN, an expert code editor. The user wants to modify a specific file.
Return ONLY valid JSON: { "updatedContent": "...full updated file...", "explanation": "...brief explanation..." }
Do not include markdown or any text outside the JSON.`,
        },
        {
          role: 'user',
          content: `File: ${fileToEdit}\n\nCurrent content:\n\`\`\`\n${currentContent}\n\`\`\`\n\nInstruction: ${instruction}`,
        },
      ]
    )

    const cleaned = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
    const parsed: EditResponse = JSON.parse(cleaned)

    return res.json(parsed)
  } catch (err) {
    next(err)
  }
})
```

### 6.7 `apps/api/src/routes/projects.ts`

```typescript
import { Router } from 'express'

export const projectsRouter = Router()

// In-memory store (replace with Prisma for persistence)
const projects: Map<string, any> = new Map()

projectsRouter.get('/', (_req, res) => {
  res.json(Array.from(projects.values()))
})

projectsRouter.get('/:id', (req, res) => {
  const project = projects.get(req.params.id)
  if (!project) return res.status(404).json({ error: 'Project not found' })
  return res.json(project)
})

projectsRouter.post('/', (req, res) => {
  const { id, ...data } = req.body
  projects.set(id, { id, ...data, createdAt: new Date() })
  return res.status(201).json(projects.get(id))
})

projectsRouter.delete('/:id', (req, res) => {
  projects.delete(req.params.id)
  return res.status(204).send()
})
```

### 6.8 `apps/api/src/routes/export.ts`

```typescript
import { Router, Request, Response, NextFunction } from 'express'
import archiver from 'archiver'
import type { GeneratedFile } from '@vian/shared-types'

export const exportRouter = Router()

exportRouter.post('/', (
  req: Request<{}, {}, { files: GeneratedFile[]; projectName: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { files, projectName = 'vian-project' } = req.body

    res.setHeader('Content-Type', 'application/zip')
    res.setHeader('Content-Disposition', `attachment; filename="${projectName}.zip"`)

    const archive = archiver('zip', { zlib: { level: 6 } })
    archive.on('error', next)
    archive.pipe(res)

    for (const file of files) {
      if (!file.isDirectory) {
        archive.append(file.content, { name: `${projectName}/${file.path}` })
      }
    }

    archive.finalize()
  } catch (err) {
    next(err)
  }
})
```

### 6.9 `apps/api/src/middleware/errorHandler.ts`

```typescript
import { Request, Response, NextFunction } from 'express'

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error('[VIAN API Error]', err.message)
  const status = (err as any).status ?? 500
  res.status(status).json({
    error: err.message ?? 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
}
```

---

## 7. Environment Variables

### `apps/api/.env`

```env
# Server
PORT=4000
NODE_ENV=development

# LLM Keys
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Database (optional for v1)
DATABASE_URL=postgresql://user:password@localhost:5432/vian
```

### `apps/web/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

---

## 8. `packages/prisma` (Optional — for persistence)

### `packages/prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Project {
  id        String   @id @default(uuid())
  name      String
  prompt    String   @db.Text
  model     String
  files     Json
  userId    String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model User {
  id        String    @id @default(uuid())
  email     String    @unique
  name      String?
  createdAt DateTime  @default(now())
}
```

---

## 9. TypeScript Configs

### `apps/web/tsconfig.json`

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### `apps/api/tsconfig.json`

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "module": "CommonJS",
    "moduleResolution": "node",
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

---

## 10. Setup & Run Instructions

```bash
# 1. Install pnpm (if not already installed)
npm install -g pnpm@8

# 2. Clone / navigate to project root
cd vian-app

# 3. Install all workspace dependencies
pnpm install

# 4. Set up environment variables
cp apps/api/.env.example apps/api/.env
# → Fill in OPENAI_API_KEY and/or ANTHROPIC_API_KEY

# 5. Start both apps in parallel
pnpm dev

# Web runs on: http://localhost:3000
# API runs on: http://localhost:4000
```

---

## 11. Implementation Order (Build This Sequence)

Follow this exact sequence to avoid dependency errors:

```
1.  Root package.json + pnpm-workspace.yaml + root tsconfig.json
2.  packages/shared-types  (types first — both apps depend on this)
3.  apps/api package.json + tsconfig.json
4.  apps/api/src/index.ts  (server entry)
5.  apps/api/src/services/LLMService.ts
6.  apps/api/src/services/FileGenerator.ts
7.  apps/api/src/routes/generation.ts
8.  apps/api/src/routes/edit.ts
9.  apps/api/src/routes/projects.ts
10. apps/api/src/routes/export.ts
11. apps/api/src/middleware/errorHandler.ts
12. apps/web package.json + next.config.js + tailwind.config.js + tsconfig.json
13. apps/web/app/globals.css
14. apps/web/app/layout.tsx
15. apps/web/lib/utils.ts
16. apps/web/lib/api-client.ts
17. apps/web/hooks/useGeneration.ts
18. apps/web/hooks/useWebContainer.ts
19. apps/web/components/ModelSelector.tsx
20. apps/web/components/FileExplorer.tsx
21. apps/web/components/CodeEditor.tsx
22. apps/web/components/PreviewPanel.tsx
23. apps/web/components/ChatInput.tsx
24. apps/web/app/page.tsx  (wires everything together — build last)
```

---

## 12. Key Design Decisions & Constraints

| Decision | Rationale |
|---|---|
| pnpm workspaces | Shared types without publishing to npm |
| Express (not Next.js API routes) | Long-running LLM calls need full Node.js process control |
| WebContainers | Real Node.js runtime in browser — not a sandbox/iframe with static HTML |
| Monaco Editor (`@monaco-editor/react`) | Same editor as VS Code, first-class TypeScript support |
| `next.config.js` COEP/COOP headers | Required by WebContainers API — cannot be skipped |
| Zustand (not Redux) | Minimal boilerplate for global state |
| Dynamic import for Monaco | Monaco fails SSR; `ssr: false` required |
| Dynamic import for WebContainer | Same reason — browser-only API |

---

## 13. Common Errors & Fixes

| Error | Fix |
|---|---|
| `SharedArrayBuffer is not defined` | Add COEP/COOP headers in `next.config.js` (Section 5.2) |
| `Cannot find module '@vian/shared-types'` | Run `pnpm install` from root; check `pnpm-workspace.yaml` lists `packages/*` |
| Monaco SSR error | Use `dynamic(() => import('@monaco-editor/react'), { ssr: false })` |
| WebContainer boots twice in dev | React StrictMode double-mounts — use a `ref` guard in `useWebContainer` |
| LLM returns markdown instead of JSON | Strip code fences in `FileGenerator.ts` — already handled in Section 6.4 |
| CORS error from frontend to API | `cors({ origin: 'http://localhost:3000' })` in `apps/api/src/index.ts` |
| Port conflict | Web = 3000, API = 4000. Never run both on same port |

---

## 14. Future Extensions (Phase 2)

- [ ] Streaming responses (SSE / WebSocket) for real-time code generation display
- [ ] Auth with Clerk or NextAuth
- [ ] Persistent projects via Prisma + PostgreSQL
- [ ] GitHub export (Octokit — create repo, push files)
- [ ] Multiple tabs / multiple projects open simultaneously
- [ ] Deployment button (Vercel API)
- [ ] Diff view when editing files (Monaco's built-in DiffEditor)
- [ ] Prompt history / chat thread per project

---

*End of VIAN Blueprint — Built by Viren Pandey*
