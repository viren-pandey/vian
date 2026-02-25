'use client'

import { RefreshCw } from 'lucide-react'

type ContainerStatus = 'idle' | 'booting' | 'installing' | 'running' | 'error'

interface PreviewPanelProps {
  url: string | null
  isLoading: boolean
  containerStatus: ContainerStatus
}

const STATUS_LABEL: Record<ContainerStatus, string> = {
  idle:       'No preview',
  booting:    'Booting sandbox...',
  installing: 'Installing dependencies...',
  running:    'Running',
  error:      'Error — check console',
}

export default function PreviewPanel({ url, isLoading, containerStatus }: PreviewPanelProps) {
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
          {url && <span className="w-1.5 h-1.5 rounded-full bg-success flex-shrink-0" />}
          <span className="text-2xs text-text-muted font-code truncate">
            {url ?? STATUS_LABEL[containerStatus]}
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
        {/* Loading */}
        {(isLoading && !url) && (
          <div className="absolute inset-0 bg-surface flex flex-col items-center justify-center gap-3 z-10">
            <div className="w-7 h-7 border border-accent border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-text-muted font-ui">
              {containerStatus === 'booting'
                ? 'Booting sandbox...'
                : containerStatus === 'installing'
                ? 'Installing dependencies...'
                : 'Starting dev server...'}
            </p>
          </div>
        )}

        {/* Live iframe */}
        {url && (
          <iframe
            id="preview-iframe"
            src={url}
            className="w-full h-full border-0 animate-preview-ready"
            title="VIAN Live Preview"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
          />
        )}

        {/* Empty state */}
        {!isLoading && !url && (
          <div className="absolute inset-0 bg-surface flex flex-col items-center justify-center gap-3">
            <span className="text-5xl opacity-[0.05] text-text-primary">◻</span>
            <p className="text-2xs text-text-muted font-ui text-center px-6 leading-relaxed">
              Live preview will show here once your app is generated
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
