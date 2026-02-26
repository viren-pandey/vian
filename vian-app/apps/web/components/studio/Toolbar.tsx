'use client'

import { useState } from 'react'
import { Eye, Code, Database, Settings, Share2, Upload } from 'lucide-react'

interface ToolbarProps {
  projectName?: string
  isGenerating?: boolean
  model?: string
  onShare?: () => void
  onPublish?: () => void
}

export default function Toolbar({ 
  projectName = 'Untitled Project', 
  isGenerating = false,
  model = 'claude-sonnet-4.5',
  onShare,
  onPublish 
}: ToolbarProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'code' | 'data' | 'settings'>('preview')

  return (
    <div className="h-11 bg-[#0d0d0d] border-b border-[#1a1a1a] flex items-center justify-between px-4 flex-shrink-0">
      {/* Left: Logo + Project Name + Generating Badge */}
      <div className="flex items-center gap-3">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <span className="text-[#3b82f6] text-[20px]">◆</span>
          <span className="text-[13px] font-bold text-white">VIAN STUDIO</span>
          <span className="text-[12px] text-[#555]">/</span>
          <span className="text-[12px] text-[#888]">{projectName}</span>
        </div>

        {/* Generating badge with ping animation */}
        {isGenerating && (
          <div className="bg-[rgba(59,130,246,0.10)] border border-[rgba(59,130,246,0.25)] rounded-full px-2.5 py-1 flex items-center gap-1.5">
            <div className="relative flex items-center justify-center">
              {/* Ping outer */}
              <span className="absolute w-2 h-2 rounded-full bg-[#3b82f6] opacity-75 animate-ping" />
              {/* Static inner */}
              <span className="relative w-1.5 h-1.5 rounded-full bg-[#3b82f6]" />
            </div>
            <span className="text-[11px] font-mono text-[#3b82f6]">Generating</span>
          </div>
        )}
      </div>

      {/* Center: Tabs (Desktop only) */}
      <div className="hidden md:flex items-center gap-1">
        <button
          onClick={() => setActiveTab('preview')}
          className={`flex items-center gap-1.5 px-3 h-8 rounded-lg transition-colors ${
            activeTab === 'preview'
              ? 'bg-[#1a1a1a] text-white'
              : 'text-[#666] hover:text-white hover:bg-[#111]'
          }`}
        >
          <Eye size={14} />
          <span className="text-[11px] font-medium">Preview</span>
        </button>
        <button
          onClick={() => setActiveTab('code')}
          className={`flex items-center gap-1.5 px-3 h-8 rounded-lg transition-colors ${
            activeTab === 'code'
              ? 'bg-[#1a1a1a] text-white'
              : 'text-[#666] hover:text-white hover:bg-[#111]'
          }`}
        >
          <Code size={14} />
          <span className="text-[11px] font-medium">Code</span>
        </button>
        <button
          onClick={() => setActiveTab('data')}
          className={`flex items-center gap-1.5 px-3 h-8 rounded-lg transition-colors ${
            activeTab === 'data'
              ? 'bg-[#1a1a1a] text-white'
              : 'text-[#666] hover:text-white hover:bg-[#111]'
          }`}
        >
          <Database size={14} />
          <span className="text-[11px] font-medium">Data</span>
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-1.5 px-3 h-8 rounded-lg transition-colors ${
            activeTab === 'settings'
              ? 'bg-[#1a1a1a] text-white'
              : 'text-[#666] hover:text-white hover:bg-[#111]'
          }`}
        >
          <Settings size={14} />
          <span className="text-[11px] font-medium">Settings</span>
        </button>
      </div>

      {/* Mobile: Compact mode */}
      <div className="md:hidden flex items-center gap-2">
        {isGenerating && (
          <div className="bg-[rgba(59,130,246,0.10)] border border-[rgba(59,130,246,0.25)] rounded-full px-2 py-0.5 flex items-center gap-1">
            <div className="relative flex items-center justify-center">
              <span className="absolute w-2 h-2 rounded-full bg-[#3b82f6] opacity-75 animate-ping" />
              <span className="relative w-1.5 h-1.5 rounded-full bg-[#3b82f6]" />
            </div>
          </div>
        )}
        <div className="w-8 h-8 rounded-full bg-[#3b82f6] text-white flex items-center justify-center text-[13px] font-bold">
          V
        </div>
      </div>

      {/* Right: Actions + Avatar */}
      <div className="hidden md:flex items-center gap-2">
        {/* Share button */}
        <button
          onClick={onShare}
          className="h-8 px-3 rounded-lg border border-[#2a2a2a] text-[#888] hover:text-white hover:border-[#3a3a3a] transition-colors flex items-center gap-1.5 text-[11px] font-medium"
        >
          <Share2 size={12} />
          Share
        </button>

        {/* Publish button */}
        <button
          onClick={onPublish}
          className="h-8 px-3 rounded-lg bg-[#3b82f6] hover:bg-[#2563eb] text-white transition-colors flex items-center gap-1.5 text-[11px] font-semibold"
        >
          <Upload size={12} />
          Publish
        </button>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-[#3b82f6] text-white flex items-center justify-center text-[13px] font-bold cursor-pointer hover:bg-[#2563eb] transition-colors">
          V
        </div>
      </div>
    </div>
  )
}
