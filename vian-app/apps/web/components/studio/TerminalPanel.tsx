'use client'

import { useEffect, useRef } from 'react'
import { Terminal } from 'lucide-react'

type ContainerStatus = 'idle' | 'booting' | 'installing' | 'running' | 'error'

interface TerminalPanelProps {
  logs: string[]
  status: ContainerStatus
}

const STATUS_COLOR: Record<ContainerStatus, string> = {
  idle:       'text-[#555]',
  booting:    'text-[#f59e0b]',
  installing: 'text-[#3b82f6]',
  running:    'text-[#22c55e]',
  error:      'text-[#ef4444]',
}

export default function TerminalPanel({ logs, status }: TerminalPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a]">
      {/* Tab bar — matches Bolt style */}
      <div className="flex items-center h-8 px-3 border-b border-[#1a1a1a] bg-[#0d0d0d] flex-shrink-0 gap-3">
        <button className="flex items-center gap-1.5 text-[10px] text-[#f0f0f0] border-b border-[#3b82f6] pb-px -mb-px px-0.5">
          <Terminal size={10} />
          Terminal
        </button>
        <div className="ml-auto flex items-center gap-1.5">
          {status === 'running' && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse flex-shrink-0" />
          )}
          {status === 'booting' || status === 'installing' ? (
            <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b] animate-pulse flex-shrink-0" />
          ) : null}
          <span className={`text-[10px] font-mono ${STATUS_COLOR[status]}`}>{status}</span>
        </div>
      </div>

      {/* Log output */}
      <div className="flex-1 overflow-y-auto px-4 py-2 font-mono text-[11px] space-y-0.5">
        {logs.length === 0 ? (
          <div className="text-[#2a2a2a] select-none mt-1">Waiting for generation…</div>
        ) : (
          logs.map((line, i) => (
            <div
              key={i}
              className={
                line.startsWith('✗')
                  ? 'text-[#ef4444]'
                  : line.startsWith('✓')
                  ? 'text-[#22c55e]'
                  : line.startsWith('>')
                  ? 'text-[#3b82f6]'
                  : line === '~/project'
                  ? 'text-[#22c55e] font-semibold'
                  : 'text-[#666]'
              }
            >
              {line}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
