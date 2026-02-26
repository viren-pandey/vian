'use client'

import dynamic from 'next/dynamic'
import { useRef, useCallback, useState } from 'react'
import { Wand2 } from 'lucide-react'
import type { OnMount } from '@monaco-editor/react'
import { useProjectStore } from '@/stores/projectStore'
import AnimatedCodeWriter from './AnimatedCodeWriter'
import VianRobot from './VianRobot'

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-base">
      <span className="text-xs text-text-muted font-ui animate-pulse">Loading editor...</span>
    </div>
  ),
})

interface CodeEditorProps {
  filePath: string | null
  content: string
  isLoading: boolean
}

function langFromPath(path: string | null): string {
  if (!path) return 'plaintext'
  const ext = path.split('.').pop() ?? ''
  const map: Record<string, string> = {
    tsx: 'typescript', ts: 'typescript',
    jsx: 'javascript', js: 'javascript',
    json: 'json', css: 'css',
    md: 'markdown', html: 'html',
    prisma: 'graphql', yaml: 'yaml', yml: 'yaml',
  }
  return map[ext] ?? 'plaintext'
}

/** Lazily load Prettier and format code — dynamically imported to avoid SSR issues */
async function formatWithPrettier(code: string, lang: string): Promise<string> {
  try {
    const prettier = (await import('prettier/standalone')).default

    if (lang === 'typescript') {
      const [babel, estree, ts] = await Promise.all([
        import('prettier/plugins/babel'),
        import('prettier/plugins/estree'),
        import('prettier/plugins/typescript'),
      ])
      return await prettier.format(code, {
        parser: 'typescript',
        plugins: [babel, estree, ts],
        semi: false,
        singleQuote: true,
        trailingComma: 'es5',
        printWidth: 100,
        tabWidth: 2,
      })
    }

    if (lang === 'javascript') {
      const [babel, estree] = await Promise.all([
        import('prettier/plugins/babel'),
        import('prettier/plugins/estree'),
      ])
      return await prettier.format(code, {
        parser: 'babel',
        plugins: [babel, estree],
        semi: false,
        singleQuote: true,
        trailingComma: 'es5',
        printWidth: 100,
        tabWidth: 2,
      })
    }

    if (lang === 'json') {
      const [babel, estree] = await Promise.all([
        import('prettier/plugins/babel'),
        import('prettier/plugins/estree'),
      ])
      return await prettier.format(code, {
        parser: 'json',
        plugins: [babel, estree],
        tabWidth: 2,
      })
    }

    if (lang === 'css') {
      const postcss = await import('prettier/plugins/postcss')
      return await prettier.format(code, {
        parser: 'css',
        plugins: [postcss],
        tabWidth: 2,
      })
    }

    return code
  } catch (e) {
    console.warn('[Prettier] format error:', e)
    return code
  }
}

export default function CodeEditor({ filePath, content, isLoading }: CodeEditorProps) {
  const { setFile, files, isGenerating } = useProjectStore()
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null)
  const [formatting, setFormatting] = useState(false)

  const activeFileData = filePath ? files[filePath] : null
  const isActiveFileGenerating = isGenerating && activeFileData?.status === 'generating'

  const handleFormat = useCallback(async () => {
    const ed = editorRef.current
    if (!ed || !filePath) return
    setFormatting(true)
    try {
      await ed.getAction('editor.action.formatDocument')?.run()
    } finally {
      setFormatting(false)
    }
  }, [filePath])

  const handleMount = useCallback<OnMount>(
    (editorInstance, monaco) => {
      editorRef.current = editorInstance

      // Register Prettier as the document formatter for each language
      const LANGS = ['typescript', 'javascript', 'json', 'css']
      const disposables = LANGS.map((lang) =>
        monaco.languages.registerDocumentFormattingEditProvider(lang, {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          provideDocumentFormattingEdits: async (model: any) => {
            const code = model.getValue()
            const formatted = await formatWithPrettier(code, lang)
            if (formatted === code) return []
            return [{ range: model.getFullModelRange(), text: formatted }]
          },
        }),
      )

      // Ctrl+S / Cmd+S → format
      editorInstance.addCommand(
        // Monaco key codes: CtrlCmd = 2048, KEY_S = 49
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
        () => { editorInstance.getAction('editor.action.formatDocument')?.run() },
      )

      return () => disposables.forEach((d: { dispose: () => void }) => d.dispose())
    },
    [],
  )

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#0d0d0d] gap-4">
        <div className="w-8 h-8 border-2 border-[#3b82f6] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-[#888] font-medium animate-pulse">Generating your application...</p>
      </div>
    )
  }

  if (!filePath) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#0d0d0d] gap-4">
        <div className="relative">
          <span className="text-[80px] text-[#3b82f6] opacity-10">◆</span>
          <div className="absolute inset-0 blur-2xl bg-[#3b82f6] opacity-5" />
        </div>
        <p className="text-sm text-[#888] font-medium">Select a file from the explorer</p>
        <p className="text-xs text-[#555] max-w-xs text-center leading-relaxed">
          Or start a new generation in the chat to create files
        </p>
      </div>
    )
  }

  const lang = langFromPath(filePath)
  const canFormat = ['typescript', 'javascript', 'json', 'css'].includes(lang)

  // ── GENERATING: show animated writer ──
  if (isGenerating) {
    return (
      <div className="h-full flex flex-col bg-[#0d0d0d] relative">
        {/* File tab bar */}
        <div className="flex items-center h-10 bg-[#111] border-b border-[#1a1a1a] flex-shrink-0 px-3 gap-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-[#888] text-xs font-mono uppercase">{lang}</span>
            <span className="text-[#2a2a2a]">|</span>
            <span className="text-[#f0f0f0] font-medium">{filePath?.split('/').pop()}</span>
          </div>

          {/* VIAN writing indicator */}
          {isActiveFileGenerating && (
            <div className="ml-auto flex items-center gap-1.5">
              <span className="text-[10px] font-mono text-[#3b82f6]">VIAN writing</span>
              <span className="flex gap-0.5">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-1 h-1 rounded-full bg-[#3b82f6]"
                    style={{
                      animation: `bounce 1s ease-in-out infinite`,
                      animationDelay: `${i * 0.15}s`,
                    }}
                  />
                ))}
              </span>
            </div>
          )}
        </div>

        {/* Animated code writer */}
        <div className="flex-1 overflow-hidden relative">
          <AnimatedCodeWriter
            code={content}
            isWriting={isActiveFileGenerating}
            language={lang}
            filename={filePath ?? ''}
          />
          <VianRobot isWriting={isActiveFileGenerating} />
        </div>
      </div>
    )
  }

  // ── DONE: show Monaco in read-only mode ──
  return (
    <div className="h-full flex flex-col bg-[#0d0d0d]">
      {/* File tab bar */}
      <div className="flex items-center h-10 bg-[#111] border-b border-[#1a1a1a] flex-shrink-0 px-3 gap-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-[#888] text-xs font-mono uppercase">{lang}</span>
          <span className="text-[#2a2a2a]">|</span>
          <span className="text-[#f0f0f0] font-medium">{filePath.split('/').pop()}</span>
        </div>

        {/* Prettier format button */}
        {canFormat && (
          <button
            onClick={handleFormat}
            disabled={formatting}
            title="Format with Prettier (Ctrl+S)"
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-[#888] hover:text-[#f0f0f0] hover:bg-[#1a1a1a] transition-colors disabled:opacity-40 border border-transparent hover:border-[#2a2a2a]"
          >
            <Wand2 size={12} />
            {formatting ? 'Formatting…' : 'Format'}
          </button>
        )}
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden p-4 bg-[#0d0d0d]">
        <MonacoEditor
          height="100%"
          language={lang}
          value={typeof content === 'string' ? content : String(content ?? '')}
          path={filePath}
          onMount={handleMount}
          onChange={(val) => {
            if (!filePath || val === undefined) return
            setFile(filePath, { path: filePath, content: val, status: 'complete' })
          }}
          beforeMount={(monaco) => {
            monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
              diagnosticCodesToIgnore: [2307, 7016, 2304],
            })
          }}
          theme="vs-dark"
          options={{
            readOnly: true,               // ← non-editable
            readOnlyMessage: {
              value: 'Use the chat to modify files'
            },
            domReadOnly: true,            // ← prevents paste/type
            fontSize: 13,
            lineHeight: 20,
            fontFamily: '"JetBrains Mono", "Fira Code", monospace',
            fontLigatures: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            padding: { top: 16, bottom: 16 },
            lineNumbers: 'on',
            renderLineHighlight: 'gutter',
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
            bracketPairColorization: { enabled: true },
            scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
            formatOnPaste: true,
            cursorBlinking: 'smooth',
            smoothScrolling: true,
          }}
        />
      </div>
    </div>
  )
}
