'use client'

import { useState } from 'react'
import { RefreshCw, ExternalLink, Monitor, Tablet, Smartphone } from 'lucide-react'
import type { WCStatus } from '@/hooks/useWebContainer'

type DeviceType = 'desktop' | 'tablet' | 'mobile'

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
  const [device, setDevice] = useState<DeviceType>('desktop')
  const isLoading = status !== 'running' && status !== 'idle' && status !== 'error'
  const dotColor =
    status === 'running'    ? 'bg-[#22c55e]' :
    status === 'installing' ? 'bg-[#f59e0b] animate-pulse' :
    status === 'booting'    ? 'bg-[#f59e0b] animate-pulse' :
    status === 'error'      ? 'bg-[#ef4444]' :
    'bg-[#444]'

  const deviceWidth = 
    device === 'desktop' ? '100%' :
    device === 'tablet' ? '768px' :
    '375px'

  return (
    <div className="flex flex-col h-full bg-[#0d0d0d]">
      {/* Browser chrome header */}
      <div className="flex items-center gap-3 h-10 px-4 bg-[#111] border-b border-[#1a1a1a] flex-shrink-0">
        {/* Traffic lights */}
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#ef4444]/70 hover:bg-[#ef4444] transition-colors" />
          <div className="w-3 h-3 rounded-full bg-[#f59e0b]/70 hover:bg-[#f59e0b] transition-colors" />
          <div className="w-3 h-3 rounded-full bg-[#22c55e]/70 hover:bg-[#22c55e] transition-colors" />
        </div>

        {/* Address bar */}
        <div className="flex-1 bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg px-3 py-1.5 flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColor}`} />
          <span className="text-xs text-[#888] font-mono truncate">
            {STATUS_LABEL[status]}
          </span>
        </div>

        {/* Right icons */}
        <button
          onClick={() => {
            const iframe = document.querySelector<HTMLIFrameElement>('#preview-iframe')
            if (iframe) iframe.src = iframe.src
          }}
          className="p-1.5 text-[#888] hover:text-[#f0f0f0] hover:bg-[#1a1a1a] rounded transition-colors disabled:opacity-30"
          disabled={!url}
          title="Refresh"
        >
          <RefreshCw size={14} />
        </button>
        <button
          onClick={() => url && window.open(url, '_blank')}
          className="p-1.5 text-[#888] hover:text-[#f0f0f0] hover:bg-[#1a1a1a] rounded transition-colors disabled:opacity-30"
          disabled={!url}
          title="Open in new tab"
        >
          <ExternalLink size={14} />
        </button>
      </div>

      {/* Preview area */}
      <div className="flex-1 relative bg-gradient-to-br from-[#0d0d0d] via-[#141414] to-[#0d0d0d] overflow-hidden">
        {/* Loading overlay */}
        {isLoading && !url && (
          <div className="absolute inset-0 bg-gradient-to-br from-[#0d0d0d] via-[#141414] to-[#0d0d0d] flex flex-col items-center justify-center gap-3 z-10">
            <div className="w-10 h-10 border-2 border-[#3b82f6] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-[#888] font-medium font-mono">{STATUS_LABEL[status]}</p>
            <div className="flex items-center gap-2 text-xs text-[#555] mt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] animate-pulse" />
              <span>Setting up your environment...</span>
            </div>
          </div>
        )}

        {/* Live iframe with device width */}
        {url && (
          <div className="w-full h-full flex items-center justify-center bg-[#0a0a0a] p-4">
            <iframe
              id="preview-iframe"
              src={url}
              className="h-full border border-[#1a1a1a] rounded-xl shadow-2xl bg-white transition-all duration-300"
              style={{ width: deviceWidth }}
              title="VIAN Live Preview"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
            />
          </div>
        )}

        {/* Empty state */}
        {status === 'idle' && !url && (
          <div className="absolute inset-0 bg-gradient-to-br from-[#0d0d0d] via-[#141414] to-[#0d0d0d] flex flex-col items-center justify-center gap-3">
            <div className="relative">
              <span className="text-[80px] text-[#3b82f6] opacity-10">◆</span>
              <div className="absolute inset-0 blur-2xl bg-[#3b82f6] opacity-5" />
            </div>
            <p className="text-sm text-[#888] font-medium text-center px-6 leading-relaxed max-w-xs">
              Enter a prompt in the chat to generate your app
            </p>
            <div className="flex items-center gap-2 text-xs text-[#555] mt-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] animate-pulse" />
              <span>Waiting for generation...</span>
            </div>
          </div>
        )}

        {/* Error state */}
        {status === 'error' && (
          <div className="absolute inset-0 bg-gradient-to-br from-[#0d0d0d] via-[#141414] to-[#0d0d0d] flex flex-col items-center justify-center gap-3">
            <div className="relative">
              <span className="text-[60px] text-[#ef4444] opacity-20">⚠</span>
              <div className="absolute inset-0 blur-2xl bg-[#ef4444] opacity-10" />
            </div>
            <p className="text-base text-[#ef4444] font-medium text-center px-6 leading-relaxed max-w-md">
              Container error — check the terminal for details
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-2 px-4 py-2 bg-[#1a1a1a] hover:bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg text-sm text-[#888] hover:text-[#f0f0f0] transition-colors"
            >
              Reload Page
            </button>
          </div>
        )}
      </div>

      {/* Device toggle footer */}
      {url && (
        <div className="h-8 border-t border-[#1a1a1a] bg-[#0d0d0d] flex items-center justify-center gap-1 flex-shrink-0">
          <button
            onClick={() => setDevice('desktop')}
            className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${
              device === 'desktop' ? 'bg-[#1f1f1f] text-white' : 'text-[#555] hover:text-[#888]'
            }`}
          >
            <Monitor size={14} />
          </button>
          <button
            onClick={() => setDevice('tablet')}
            className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${
              device === 'tablet' ? 'bg-[#1f1f1f] text-white' : 'text-[#555] hover:text-[#888]'
            }`}
          >
            <Tablet size={14} />
          </button>
          <button
            onClick={() => setDevice('mobile')}
            className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${
              device === 'mobile' ? 'bg-[#1f1f1f] text-white' : 'text-[#555] hover:text-[#888]'
            }`}
          >
            <Smartphone size={14} />
          </button>
        </div>
      )}
    </div>
  )
}
