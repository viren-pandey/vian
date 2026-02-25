'use client'

import dynamic from 'next/dynamic'
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

export default function CodeEditor({ filePath, content, isLoading }: CodeEditorProps) {
  const { setFile } = useProjectStore()

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

  return (
    <div className="h-full flex flex-col">
      {/* Tab bar */}
      <div className="flex items-center h-9 bg-surface border-b border-border-subtle flex-shrink-0 px-1">
        <div className="flex items-center gap-2 h-full px-3 border-b border-accent text-xs text-text-primary font-code">
          <span className="text-text-muted">{langFromPath(filePath).toUpperCase()}</span>
          <span>{filePath.split('/').pop()}</span>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <MonacoEditor
          height="100%"
          language={langFromPath(filePath)}
          value={typeof content === 'string' ? content : String(content ?? '')}
          path={filePath}
          onChange={(val) => {
            if (!filePath || val === undefined) return
            setFile(filePath, { path: filePath, content: val, status: 'complete' })
          }}
          theme="vs-dark"
          options={{
            fontSize: 13,
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
          }}
        />
      </div>
    </div>
  )
}
