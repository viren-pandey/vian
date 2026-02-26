'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { 
  Eye, Code2, Database, Settings, 
  Share2, Download, Check, MessageSquare, FileCode2, MonitorPlay
} from 'lucide-react'
import { useProjectStore } from '@/stores/projectStore'
import { useGeneration } from '@/hooks/useGeneration'
import { useWebContainer } from '@/hooks/useWebContainer'
import { API_BASE } from '@/lib/constants'
import FileExplorer from '@/components/studio/FileExplorer'
import CodeEditor from '@/components/studio/CodeEditor'
import PreviewPanel from '@/components/studio/PreviewPanel'
import ChatPanel from '@/components/studio/ChatPanel'
import StatusBar from '@/components/studio/StatusBar'
import DatabaseViewer from '@/components/studio/DatabaseViewer'
import SettingsPanel from '@/components/studio/SettingsPanel'

type TabType = 'preview' | 'code' | 'data' | 'settings'
type CodePanelType = 'chat' | 'editor' | 'preview'

export default function StudioPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const searchParams = useSearchParams()
  const urlPrompt = searchParams.get('prompt')
  const { activeFile, files, isGenerating, previewUrl } = useProjectStore()
  const { generate, editFile } = useGeneration()
  const { status, logs } = useWebContainer()
  const hasAutoStarted = useRef(false)
  const [activeTab, setActiveTab] = useState<TabType>('preview')
  const [activeCodePanel, setActiveCodePanel] = useState<CodePanelType>('chat')
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
    <div className="h-screen flex flex-col bg-[#0d0d0d] overflow-hidden font-ui">

      {/* ── Toolbar ───────────────────────────────────────────────────────── */}
      <header className="h-12 flex items-center justify-between px-3 md:px-4 border-b border-[#1a1a1a] bg-[#0d0d0d] flex-shrink-0">
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          <span className="text-[#3b82f6] font-semibold text-base">◆ VIAN</span>
          <span className="hidden sm:inline text-xs text-[#2a2a2a]">|</span>
          <span className="text-xs md:text-sm text-[#888] font-medium truncate">{projectId}</span>
        </div>

        <div className="flex items-center gap-1.5 md:gap-2">
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 md:gap-2 bg-[#141414] hover:bg-[#1a1a1a] border border-[#1f1f1f] text-[#f0f0f0] text-xs font-medium px-2 md:px-3 py-1.5 rounded-lg transition-colors"
          >
            {copied ? <Check size={14} /> : <Share2 size={14} />}
            <span className="hidden sm:inline">{copied ? 'Copied' : 'Share'}</span>
          </button>
          <button
            onClick={handlePublish}
            disabled={exporting || fileCount === 0}
            className="flex items-center gap-1.5 md:gap-2 bg-[#3b82f6] hover:bg-[#2563eb] text-white text-xs font-medium px-2 md:px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download size={14} />
            <span className="hidden sm:inline">{exporting ? 'Exporting...' : 'Export'}</span>
          </button>
        </div>
      </header>

      {/* ── Tab Bar ────────────────────────────────────────────────────────── */}
      <nav className="h-10 flex items-center px-2 md:px-4 bg-[#111] border-b border-[#1a1a1a] flex-shrink-0 gap-0.5 md:gap-1 overflow-x-auto">
        {[
          { id: 'preview' as const, label: 'Preview', icon: Eye },
          { id: 'code' as const, label: 'Code', icon: Code2 },
          { id: 'data' as const, label: 'Data', icon: Database },
          { id: 'settings' as const, label: 'Settings', icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-[#1a1a1a] text-[#f0f0f0] border border-[#2a2a2a]'
                  : 'text-[#888] hover:text-[#f0f0f0] hover:bg-[#141414]'
              }`}
            >
              <Icon size={14} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          )
        })}
      </nav>
      {/* ── Main Content Area ──────────────────────────────────────────────── */}
      <main className="flex-1 overflow-hidden">

        {/* PREVIEW MODE - Fullscreen preview */}
        {activeTab === 'preview' && (
          <div className="h-full">
            <PreviewPanel url={previewUrl} status={status} />
          </div>
        )}

        {/* CODE MODE - Split layout with chat, editor, preview */}
        {activeTab === 'code' && (
          <div className="h-full flex flex-col">
            {/* Desktop: 3-panel layout */}
            <div className="hidden lg:flex h-full gap-0">
              {/* Left: Chat + Files (20%) */}
              <aside className="w-[20%] min-w-[280px] max-w-[400px] flex flex-col border-r border-[#1a1a1a] bg-[#111]">
                <ChatPanel onGenerate={generate} onEdit={editFile} terminalLogs={logs} />
              </aside>

              {/* Center: Code Editor (45%) */}
              <div className="flex-1 flex flex-col bg-[#0d0d0d]">
                <CodeEditor
                  filePath={activeFile}
                  content={activeContent}
                  isLoading={isEditorLoading}
                />
              </div>

              {/* Right: Live Preview (35%) */}
              <aside className="w-[35%] min-w-[320px] max-w-[600px] border-l border-[#1a1a1a]">
                <PreviewPanel url={previewUrl} status={status} />
              </aside>
            </div>

            {/* Mobile/Tablet: Single panel with bottom nav */}
            <div className="lg:hidden flex flex-col h-full">
              {/* Active panel */}
              <div className="flex-1 overflow-hidden">
                {activeCodePanel === 'chat' && (
                  <ChatPanel onGenerate={generate} onEdit={editFile} terminalLogs={logs} />
                )}
                {activeCodePanel === 'editor' && (
                  <CodeEditor
                    filePath={activeFile}
                    content={activeContent}
                    isLoading={isEditorLoading}
                  />
                )}
                {activeCodePanel === 'preview' && (
                  <PreviewPanel url={previewUrl} status={status} />
                )}
              </div>

              {/* Mobile bottom navigation */}
              <nav className="h-14 border-t border-[#1a1a1a] bg-[#111] flex items-stretch">
                {[
                  { id: 'chat' as const, label: 'Chat', icon: MessageSquare },
                  { id: 'editor' as const, label: 'Code', icon: FileCode2 },
                  { id: 'preview' as const, label: 'Preview', icon: MonitorPlay },
                ].map((panel) => {
                  const Icon = panel.icon
                  return (
                    <button
                      key={panel.id}
                      onClick={() => setActiveCodePanel(panel.id)}
                      className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors ${
                        activeCodePanel === panel.id
                          ? 'text-[#3b82f6] bg-[#1a1a1a]'
                          : 'text-[#888] hover:text-[#f0f0f0] hover:bg-[#141414]'
                      }`}
                    >
                      <Icon size={18} />
                      <span className="text-[10px] font-medium">{panel.label}</span>
                    </button>
                  )
                })}
              </nav>
            </div>
          </div>
        )}

        {/* DATA MODE - Database schema viewer */}
        {activeTab === 'data' && (
          <div className="h-full">
            <DatabaseViewer />
          </div>
        )}

        {/* SETTINGS MODE - Project settings */}
        {activeTab === 'settings' && (
          <div className="h-full">
            <SettingsPanel 
              projectName={projectId ?? 'vian-project'}
              onShare={handleShare}
              onExport={handlePublish}
            />
          </div>
        )}

      </main>

      {/* ── Status bar ─────────────────────────────────────────────────────── */}
      <StatusBar />
    </div>
  )
}
