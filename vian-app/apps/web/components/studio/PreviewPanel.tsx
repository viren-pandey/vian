'use client'

import { RefreshCw } from 'lucide-react'
import type { WCStatus } from '@/hooks/useWebContainer'

interface PreviewPanelProps {
  url: string | null
  status: WCStatus
}

const STATUS_LABEL: Record<WCStatus, string> = {
  idle:       'No preview',
  booting:    'Booting sandbox...',
  installing: 'Installing dependencies...',
  running:    'localhost:3000',
  error:      'Error — check console',
}

export default function PreviewPanel({ url, status }: PreviewPanelProps) {
  const isLoading = status !== 'running' && status !== 'idle' && status !== 'error'
  const dotColor =
    status === 'running'    ? 'bg-green-500' :
    status === 'installing' ? 'bg-amber-400 animate-pulse' :
    status === 'booting'    ? 'bg-amber-400 animate-pulse' :
    status === 'error'      ? 'bg-red-500' :
    'bg-[#444]'

  return (
    <div className="flex flex-col h-full bg-surface">
      {/* Browser chrome */}
      <div className="flex items-center gap-2 h-9 px-3 bg-surface border-b border-border-subtle flex-shrink-0">
        {/* Traffic lights */}
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]/70" />
        </div>

        {/* Address bar */}
        <div className="flex-1 bg-base rounded px-2 py-0.5 flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColor}`} />
          <span className="text-2xs text-text-muted font-code truncate">
            {STATUS_LABEL[status]}
          </span>
        </div>

        {/* Refresh */}
        {url && (
          <button
            onClick={() => {
              const iframe = document.querySelector<HTMLIFrameElement>('#preview-iframe')
              if (iframe) iframe.src = iframe.src
            }}
            className="text-text-muted hover:text-text-secondary transition-colors"
          >
            <RefreshCw size={12} />
          </button>
        )}
      </div>

      {/* Preview area */}
      <div className="flex-1 relative bg-white">
        {/* Loading overlay */}
        {isLoading && !url && (
          <div className="absolute inset-0 bg-surface flex flex-col items-center justify-center gap-3 z-10">
            <div className="w-7 h-7 border border-accent border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-text-muted font-ui">{STATUS_LABEL[status]}</p>
          </div>
        )}

        {/* Live iframe — opacity transition */}
        {url && (
          <iframe
            id="preview-iframe"
            src={url}
            className={`w-full h-full border-0 transition-opacity duration-500 ${
              status === 'running' ? 'opacity-100' : 'opacity-0'
            }`}
            title="VIAN Live Preview"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
          />
        )}

        {/* Empty state */}
        {status === 'idle' && !url && (
          <div className="absolute inset-0 bg-surface flex flex-col items-center justify-center gap-3">
            <span className="text-5xl opacity-[0.05] text-text-primary">◻</span>
            <p className="text-2xs text-text-muted font-ui text-center px-6 leading-relaxed">
              Live preview will show here once your app is generated
            </p>
          </div>
        )}

        {/* Error state */}
        {status === 'error' && (
          <div className="absolute inset-0 bg-surface flex flex-col items-center justify-center gap-3">
            <span className="text-5xl opacity-[0.05] text-red-400">⚠</span>
            <p className="text-2xs text-red-400 font-ui text-center px-6 leading-relaxed">
              Container error — check the terminal for details
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
