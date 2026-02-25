'use client'

import dynamic from 'next/dynamic'
import { useRef, useCallback, useState } from 'react'
import { Wand2 } from 'lucide-react'
import type { OnMount } from '@monaco-editor/react'
import { useProjectStore } from '@/stores/projectStore'

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
  const { setFile } = useProjectStore()
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null)
  const [formatting, setFormatting] = useState(false)

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
      <div className="flex flex-col items-center justify-center h-full bg-base gap-4">
        <div className="w-5 h-5 border border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-text-muted font-ui animate-pulse">Generating your application...</p>
      </div>
    )
  }

  if (!filePath) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-base gap-3">
        <span className="text-4xl opacity-[0.06] text-text-primary">◆</span>
        <p className="text-xs text-text-muted font-ui">Select a file or generate a project</p>
      </div>
    )
  }

  const lang = langFromPath(filePath)
  const canFormat = ['typescript', 'javascript', 'json', 'css'].includes(lang)

  return (
    <div className="h-full flex flex-col">
      {/* Tab bar */}
      <div className="flex items-center h-9 bg-surface border-b border-border-subtle flex-shrink-0 px-1">
        <div className="flex items-center gap-2 h-full px-3 border-b border-accent text-xs text-text-primary font-code flex-1">
          <span className="text-text-muted">{lang.toUpperCase()}</span>
          <span>{filePath.split('/').pop()}</span>
        </div>

        {/* Prettier format button */}
        {canFormat && (
          <button
            onClick={handleFormat}
            disabled={formatting}
            title="Format with Prettier (Ctrl+S)"
            className="flex items-center gap-1.5 px-2.5 h-6 mr-1 rounded text-2xs text-text-muted hover:text-text-secondary hover:bg-white/5 transition-colors disabled:opacity-40 font-ui"
          >
            <Wand2 size={10} />
            {formatting ? 'Formatting…' : 'Format'}
          </button>
        )}
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
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
            fontSize: 15,
            fontFamily: '"Geist Mono", "Fira Code", monospace',
            fontLigatures: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            padding: { top: 16, bottom: 16 },
            lineNumbers: 'on',
            renderLineHighlight: 'none',
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
            bracketPairColorization: { enabled: true },
            scrollbar: { verticalScrollbarSize: 4, horizontalScrollbarSize: 4 },
            formatOnPaste: true,
          }}
        />
      </div>
    </div>
  )
}
