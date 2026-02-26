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
    <div className="h-7 flex-shrink-0 flex items-center justify-between px-2 md:px-4 border-t border-[#1a1a1a] bg-[#0d0d0d] text-[10px] font-mono select-none overflow-hidden">
      {/* Left: brand */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span className="text-[#444] hidden sm:inline">◆ VIAN by Viren</span>
        <span className="text-[#444] sm:hidden">◆</span>
      </div>

      {/* Center: generation/file status - Desktop style */}
      <div className="hidden md:flex items-center gap-3">
        {isGenerating && generating ? (
          <span className="flex items-center gap-1.5 text-[#3b82f6]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] animate-pulse" />
            <span>{complete}/{total} files ready</span>
          </span>
        ) : total > 0 ? (
          <span className="flex items-center gap-1.5 text-[#22c55e]">
            <span>✓</span>
            <span>{total} files ready</span>
          </span>
        ) : (
          <span className="text-[#444]">No files</span>
        )}
      </div>

      {/* Mobile: READY pill */}
      <div className="md:hidden flex items-center flex-1 justify-center">
        {total > 0 && !isGenerating && (
          <div className="bg-[#166534] border border-[#16a34a] text-[#22c55e] text-[9px] font-bold px-2 py-0.5 rounded-full">
            ● READY
          </div>
        )}
        {isGenerating && (
          <div className="bg-[#1e3a8a] border border-[#3b82f6] text-[#3b82f6] text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-[#3b82f6] animate-pulse" />
            {complete}/{total}
          </div>
        )}
      </div>

      {/* Right: TS / errors */}
      <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
        {errorMessage ? (
          <span className="flex items-center gap-1 text-[#ef4444] max-w-[120px] md:max-w-[300px]">
            <span>✗</span>
            <span className="truncate hidden sm:inline">{errorMessage}</span>
          </span>
        ) : errors > 0 ? (
          <span className="flex items-center gap-1 text-[#ef4444]">
            <span>✗</span>
            <span className="hidden sm:inline">{errors} errors</span>
          </span>
        ) : total > 0 ? (
          <span className="flex items-center gap-1 text-[#22c55e]">
            <span>✓</span>
            <span className="hidden sm:inline">No errors</span>
          </span>
        ) : null}
        <span className="text-[#444] hidden md:inline">TypeScript</span>
      </div>
    </div>
  )
}
