'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown, ChevronUp, Plus } from 'lucide-react'

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
  const [collapsed, setCollapsed] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  return (
    <div 
      className="flex flex-col bg-[#0a0a0a] border-t border-[#1a1a1a] transition-all duration-200"
      style={{ height: collapsed ? '36px' : '160px' }}
    >
      {/* Tab bar with collapse */}
      <div className="flex items-center h-9 px-3 flex-shrink-0 gap-2">
        {/* Tabs */}
        <button className="flex items-center gap-1.5 text-[11px] text-white font-mono">
          ⚡ VIAN
        </button>
        <span className="text-[#333]">·</span>
        <button className="flex items-center gap-1.5 text-[11px] text-[#666] hover:text-white font-mono transition-colors">
          Publish Output
        </button>
        <span className="text-[#333]">·</span>
        <button className="flex items-center gap-1.5 text-[11px] text-[#666] hover:text-white font-mono transition-colors">
          &gt;_ Terminal
        </button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* npm ready pill */}
        {status === 'running' && (
          <div className="bg-[#166534] border border-[#16a34a] text-[#22c55e] text-[11px] font-mono px-2 py-0.5 rounded flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
            npm ready
          </div>
        )}

        {/* Add tab button */}
        <button className="text-[#555] hover:text-white transition-colors">
          <Plus size={12} />
        </button>

        {/* Collapse/Expand */}
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="text-[#555] hover:text-white transition-colors"
        >
          {collapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* Log output */}
      {!collapsed && (
        <div className="flex-1 overflow-y-auto px-4 py-2 font-mono text-[11px] space-y-0 leading-[1.65]">
          {logs.length === 0 ? (
            <div className="text-[#2a2a2a] select-none mt-1">Waiting for generation…</div>
          ) : (
            logs.map((line, i) => (
              <div
                key={i}
                className={
                  line.startsWith('✗') || line.toLowerCase().includes('error')
                    ? 'text-[#ef4444]'
                    : line.startsWith('✓') || line.toLowerCase().includes('ready')
                    ? 'text-[#22c55e]'
                    : line.startsWith('>') || line.toLowerCase().includes('npm run')
                    ? 'text-[#3b82f6]'
                    : line === '~/project'
                    ? 'text-[#22c55e] font-semibold'
                    : line.toLowerCase().includes('warning')
                    ? 'text-[#f59e0b]'
                    : 'text-[#666]'
                }
              >
                {line}
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  )
}
