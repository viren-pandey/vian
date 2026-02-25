'use client'

import { useProjectStore } from '@/stores/projectStore'

export default function StatusBar() {
  const { files, isGenerating, errorMessage } = useProjectStore()

  const allFiles = Object.values(files)
  const total = allFiles.length
  const complete = allFiles.filter((f) => f.status === 'complete').length
  const generating = allFiles.find((f) => f.status === 'generating')
  const errors = allFiles.filter((f) => f.status === 'error').length

  const fileName = generating ? generating.path.split('/').pop() : null

  return (
    <div className="h-6 flex-shrink-0 flex items-center justify-between px-4 border-t border-border-subtle bg-surface text-2xs text-text-muted font-ui select-none">
      {/* Left: brand */}
      <div className="flex items-center gap-1.5">
        <span className="text-accent">◆</span>
        <span>VIAN by Viren</span>
      </div>

      {/* Center: generation/file status */}
      <div className="flex items-center gap-3">
        {isGenerating && generating ? (
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-dot" />
            <span className="text-text-secondary">Generating</span>
            <span className="text-text-muted font-code">{fileName}</span>
          </span>
        ) : total > 0 ? (
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-success" />
            <span>{complete}/{total} files</span>
          </span>
        ) : (
          <span className="opacity-40">No files</span>
        )}
      </div>

      {/* Right: TS / errors */}
      <div className="flex items-center gap-3">
        {errorMessage ? (
          <span className="flex items-center gap-1 text-error">
            <span>✕</span>
            <span className="max-w-[300px] truncate">{errorMessage}</span>
          </span>
        ) : errors > 0 ? (
          <span className="flex items-center gap-1 text-error">
            <span>✕</span>
            <span>{errors} error{errors !== 1 ? 's' : ''}</span>
          </span>
        ) : total > 0 ? (
          <span className="flex items-center gap-1 text-success">
            <span>✓</span>
            <span>No errors</span>
          </span>
        ) : null}
        <span className="opacity-30">TypeScript</span>
      </div>
    </div>
  )
}
