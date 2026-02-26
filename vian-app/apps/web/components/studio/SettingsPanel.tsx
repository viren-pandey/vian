'use client'

import { useState } from 'react'
import { Share2, Download, Rocket, Key, Copy, Check, ExternalLink } from 'lucide-react'
import { useProjectStore } from '@/stores/projectStore'
import { API_BASE } from '@/lib/constants'

interface SettingsPanelProps {
  projectName: string
  onShare?: () => void
  onExport?: () => void
}

export default function SettingsPanel({ projectName, onShare, onExport }: SettingsPanelProps) {
  const [copied, setCopied] = useState(false)
  const [deploying, setDeploying] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const { previewUrl, files } = useProjectStore()

  const shareUrl = previewUrl ?? window.location.href

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleExport = async () => {
    if (onExport) {
      onExport()
      return
    }

    try {
      const payload = {
        projectName: projectName ?? 'vian-project',
        files: Object.values(files).map((f) => ({
          path: f.path,
          content: f.content,
          isDirectory: false,
        })),
      }

      const res = await fetch(`${API_BASE}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error('Export failed')

      const blob = await res.blob()
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `${projectName ?? 'vian-project'}.zip`
      link.click()
      URL.revokeObjectURL(link.href)
    } catch (err) {
      console.error('[export]', err)
    }
  }

  const handleDeploy = async () => {
    setDeploying(true)
    // Placeholder for deploy logic
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setDeploying(false)
  }

  const handleSaveApiKey = () => {
    if (!apiKey.trim()) return
    localStorage.setItem('vian_byok', apiKey)
    alert('API key saved successfully')
  }

  return (
    <div className="h-full flex flex-col bg-[#0d0d0d] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 md:px-4 py-3 border-b border-[#1a1a1a] bg-[#111] sticky top-0 z-10">
        <span className="text-heading text-[#f0f0f0]">Project Settings</span>
      </div>

      {/* Settings sections */}
      <div className="flex-1 p-3 md:p-4 space-y-4">

        {/* Share Section */}
        <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Share2 size={16} className="text-[#3b82f6]" />
            <h3 className="text-sm font-semibold text-[#f0f0f0]">Share Project</h3>
          </div>
          <p className="text-xs text-[#888] leading-relaxed">
            Share your live preview with others. Anyone with the link can view your app.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-3 py-2 text-xs font-mono text-[#888] focus:outline-none focus:border-[#3b82f6]"
            />
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 bg-[#1a1a1a] hover:bg-[#1f1f1f] border border-[#2a2a2a] text-[#f0f0f0] text-xs font-medium px-4 py-2 rounded-lg transition-colors"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          {onShare && (
            <button
              onClick={onShare}
              className="w-full flex items-center justify-center gap-2 bg-[#3b82f6] hover:bg-[#2563eb] text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
            >
              <ExternalLink size={14} />
              Open in New Tab
            </button>
          )}
        </div>

        {/* Export Section */}
        <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Download size={16} className="text-[#22c55e]" />
            <h3 className="text-sm font-semibold text-[#f0f0f0]">Export Code</h3>
          </div>
          <p className="text-xs text-[#888] leading-relaxed">
            Download your project as a ZIP file. Includes all generated files and dependencies.
          </p>
          <button
            onClick={handleExport}
            disabled={Object.keys(files).length === 0}
            className="w-full flex items-center justify-center gap-2 bg-[#1a1a1a] hover:bg-[#1f1f1f] border border-[#2a2a2a] text-[#f0f0f0] text-sm font-medium px-4 py-2.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download size={14} />
            Download ZIP
          </button>
        </div>

        {/* Deploy Section */}
        <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Rocket size={16} className="text-[#f59e0b]" />
            <h3 className="text-sm font-semibold text-[#f0f0f0]">Deploy</h3>
            <span className="ml-auto text-[10px] bg-[#f59e0b]/10 text-[#f59e0b] px-2 py-0.5 rounded">
              Coming Soon
            </span>
          </div>
          <p className="text-xs text-[#888] leading-relaxed">
            Deploy your app to production with one click. Powered by Vercel.
          </p>
          <button
            onClick={handleDeploy}
            disabled={deploying || Object.keys(files).length === 0}
            className="w-full flex items-center justify-center gap-2 bg-[#1a1a1a] hover:bg-[#1f1f1f] border border-[#2a2a2a] text-[#f0f0f0] text-sm font-medium px-4 py-2.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Rocket size={14} />
            {deploying ? 'Deploying...' : 'Deploy to Vercel'}
          </button>
        </div>

        {/* BYOK Section */}
        <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Key size={16} className="text-[#a78bfa]" />
            <h3 className="text-sm font-semibold text-[#f0f0f0]">Bring Your Own Key (BYOK)</h3>
          </div>
          <p className="text-xs text-[#888] leading-relaxed">
            Use your own API keys for unlimited generations. Supports OpenAI, Anthropic, Google, and more.
          </p>
          <input
            type="password"
            placeholder="sk-..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm font-mono text-[#f0f0f0] placeholder:text-[#444] focus:outline-none focus:border-[#3b82f6]"
          />
          <button
            onClick={handleSaveApiKey}
            disabled={!apiKey.trim()}
            className="w-full flex items-center justify-center gap-2 bg-[#1a1a1a] hover:bg-[#1f1f1f] border border-[#2a2a2a] text-[#f0f0f0] text-sm font-medium px-4 py-2.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Key size={14} />
            Save API Key
          </button>
        </div>

        {/* Project Info */}
        <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-4 space-y-2">
          <h3 className="text-sm font-semibold text-[#f0f0f0]">Project Info</h3>
          <div className="space-y-1.5 text-xs font-mono">
            <div className="flex items-center justify-between">
              <span className="text-[#888]">Name</span>
              <span className="text-[#f0f0f0]">{projectName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#888]">Files</span>
              <span className="text-[#f0f0f0]">{Object.keys(files).length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#888]">Framework</span>
              <span className="text-[#f0f0f0]">Next.js 14</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#888]">Runtime</span>
              <span className="text-[#f0f0f0]">WebContainer</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
