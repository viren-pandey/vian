'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { MessageSquare, FolderOpen, Share2, Globe, Check, Download } from 'lucide-react'
import { useProjectStore } from '@/stores/projectStore'
import { useGeneration } from '@/hooks/useGeneration'
import { useWebContainer } from '@/hooks/useWebContainer'
import { API_BASE } from '@/lib/constants'
import FileExplorer from '@/components/studio/FileExplorer'
import CodeEditor from '@/components/studio/CodeEditor'
import PreviewPanel from '@/components/studio/PreviewPanel'
import ChatPanel from '@/components/studio/ChatPanel'
import StatusBar from '@/components/studio/StatusBar'
import TerminalPanel from '@/components/studio/TerminalPanel'

export default function StudioPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const searchParams = useSearchParams()
  const urlPrompt = searchParams.get('prompt')
  const { activeFile, files, isGenerating, previewUrl } = useProjectStore()
  const { generate, editFile } = useGeneration()
  const { status, logs } = useWebContainer()
  const hasAutoStarted = useRef(false)
  const [leftTab, setLeftTab] = useState<'chat' | 'files'>('chat')
  const [copied, setCopied] = useState(false)
  const [exporting, setExporting] = useState(false)

  const handleShare = useCallback(() => {
    const url = previewUrl ?? window.location.href
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [previewUrl])

  const handlePublish = useCallback(async () => {
    if (exporting || Object.keys(files).length === 0) return
    setExporting(true)
    try {
      const payload = {
        projectName: projectId ?? 'vian-project',
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
      link.download = `${projectId ?? 'vian-project'}.zip`
      link.click()
      URL.revokeObjectURL(link.href)
    } catch (err) {
      console.error('[publish]', err)
    } finally {
      setExporting(false)
    }
  }, [exporting, files, projectId])

  useEffect(() => {
    if (urlPrompt && !hasAutoStarted.current) {
      hasAutoStarted.current = true
      generate(urlPrompt)
    }
  }, [urlPrompt, generate])

  const activeContent = activeFile ? String(files[activeFile]?.content ?? '') : ''
  const isEditorLoading = isGenerating && !activeFile
  const fileCount = Object.keys(files).length

  return (
    <div className="h-screen flex flex-col bg-[#0d0d0d] overflow-hidden">

      {/* ── Navbar (h-14, Bolt-style big) ──────────────────────────────────── */}
      <header className="flex-shrink-0 h-14 flex items-center justify-between px-5 border-b border-[#1f1f1f] bg-[#111] select-none">
        {/* Left: logo */}
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-accent rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-bold leading-none">◆</span>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold text-white tracking-tight">VIAN Studio</span>
            <span className="text-[10px] text-[#555]">by Viren Pandeyy</span>
          </div>
          {isGenerating && (
            <div className="flex items-center gap-1.5 ml-2 px-2.5 py-1 rounded-full bg-accent/10 border border-accent/20">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              <span className="text-[11px] text-accent font-medium">Generating…</span>
            </div>
          )}
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2">
          {fileCount > 0 && (
            <span className="text-[10px] text-[#555] mr-2">
              {fileCount} file{fileCount !== 1 ? 's' : ''}
            </span>
          )}
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 text-[11px] text-[#888] hover:text-white px-3 py-1.5 rounded-lg border border-[#2a2a2a] hover:border-[#3a3a3a] transition-colors"
            title="Copy preview URL to clipboard"
          >
            {copied ? <Check size={12} className="text-green-400" /> : <Share2 size={12} />}
            {copied ? 'Copied!' : 'Share'}
          </button>
          <button
            onClick={handlePublish}
            disabled={exporting || fileCount === 0}
            className="flex items-center gap-1.5 text-[11px] text-white px-3 py-1.5 rounded-lg bg-accent hover:bg-accent-hover transition-colors font-medium disabled:opacity-40 disabled:cursor-not-allowed"
            title="Download project as ZIP"
          >
            {exporting ? <Globe size={12} className="animate-spin" /> : <Download size={12} />}
            {exporting ? 'Zipping...' : 'Export'}
          </button>
          <div className="w-7 h-7 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center text-[11px] text-[#888] font-semibold">
            V
          </div>
        </div>
      </header>

      {/* ── Main ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── Left panel: Chat + Files tabs (w-72) ─────────────────────────── */}
        <aside className="w-72 flex-shrink-0 flex flex-col border-r border-[#1f1f1f] bg-[#111]">
          {/* Tab bar */}
          <div className="flex h-9 border-b border-[#1f1f1f] flex-shrink-0">
            <button
              onClick={() => setLeftTab('chat')}
              className={`flex-1 flex items-center justify-center gap-1.5 text-[12px] font-medium transition-colors ${
                leftTab === 'chat'
                  ? 'text-white border-b border-accent -mb-px'
                  : 'text-[#555] hover:text-[#888]'
              }`}
            >
              <MessageSquare size={12} />
              Chat
            </button>
            <button
              onClick={() => setLeftTab('files')}
              className={`flex-1 flex items-center justify-center gap-1.5 text-[12px] font-medium transition-colors ${
                leftTab === 'files'
                  ? 'text-white border-b border-accent -mb-px'
                  : 'text-[#555] hover:text-[#888]'
              }`}
            >
              <FolderOpen size={12} />
              Files
              {fileCount > 0 && (
                <span className="text-[10px] bg-[#2a2a2a] text-[#666] px-1 rounded">{fileCount}</span>
              )}
            </button>
          </div>

          {/* Tab content */}
          {leftTab === 'chat' ? (
            <ChatPanel onGenerate={generate} onEdit={editFile} terminalLogs={logs} />
          ) : (
            <div className="flex-1 overflow-y-auto">
              <FileExplorer />
            </div>
          )}
        </aside>

        {/* ── Center: Code editor + Terminal ───────────────────────────────── */}
        <main className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Code editor */}
          <div className="flex-1 overflow-hidden">
            <CodeEditor
              filePath={activeFile}
              content={activeContent}
              isLoading={isEditorLoading}
            />
          </div>

          {/* Terminal panel at bottom */}
          <div className="h-44 flex-shrink-0 border-t border-[#1f1f1f]">
            <TerminalPanel logs={logs} status={status} />
          </div>
        </main>

        {/* ── Right: Preview ───────────────────────────────────────────────── */}
        <aside className="w-[42%] flex-shrink-0 border-l border-[#1f1f1f] flex flex-col">
          <PreviewPanel
            url={previewUrl}
            status={status}
          />
        </aside>
      </div>

      {/* ── Status bar ─────────────────────────────────────────────────────── */}
      <StatusBar />
    </div>
  )
}

