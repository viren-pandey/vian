'use client'

import { useState, useRef, useEffect, useCallback, type KeyboardEvent } from 'react'
import { ArrowUp, Paperclip, Image as ImageIcon, X, Bot, Sparkles, FileCode, CircleCheck, RefreshCw } from 'lucide-react'
import { useProjectStore } from '@/stores/projectStore'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  imageUrl?: string
  files?: string[]
}

interface ChatPanelProps {
  onEdit: (instruction: string, onSuccess?: (editedPath: string) => void) => void
  onGenerate: (prompt: string) => void
  terminalLogs?: string[]
}

const HISTORY_KEY = (id: string | null) => `vian_chat_${id ?? 'scratch'}`
const MAX_STORED = 60

function loadHistory(projectId: string | null): Message[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY(projectId))
    if (!raw) return []
    return (JSON.parse(raw) as Message[]).map((m) => ({
      ...m,
      timestamp: new Date(m.timestamp),
    }))
  } catch {
    return []
  }
}

function saveHistory(projectId: string | null, msgs: Message[]) {
  try {
    localStorage.setItem(HISTORY_KEY(projectId), JSON.stringify(msgs.slice(-MAX_STORED)))
  } catch {
    /* storage quota */
  }
}

const examplePrompts = [
  'Add sidebar',
  'Fix responsive bugs',
  'Install Framer Motion',
  'Add dark mode',
  'Add animations',
]

export default function ChatPanel({ onEdit, onGenerate, terminalLogs = [] }: ChatPanelProps) {
  const [value, setValue] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [attachedImage, setAttachedImage] = useState<{ file: File; previewUrl: string } | null>(null)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const wasGenerating = useRef(false)
  const isEditMode = useRef(false)
  const lastEditedFile = useRef<string>('')
  const lastRuntimeError = useRef('')
  const historyLoadedForId = useRef<string | null | undefined>(undefined)

  const { isGenerating, generationStatus, files, errorMessage, projectId, model, setModel } = useProjectStore()

  const hasFiles = Object.keys(files).length > 0

  // Quick command detection
  const QUICK_COMMANDS = [
    { trigger: 'npm install',     hint: '⚡ Will install in project' },
    { trigger: 'fix this',        hint: '🔧 Will audit and fix code' },
    { trigger: 'why is',          hint: '🔍 Will analyze code' },
    { trigger: 'optimize',        hint: '⚡ Will optimize performance' },
    { trigger: 'debug',           hint: '🔍 Will analyze errors' },
  ]

  const matchedCommand = QUICK_COMMANDS.find((c) =>
    value.toLowerCase().includes(c.trigger)
  )

  // Available models
  const MODELS = [
    { id: 'deepseek-coder:6.7b', label: 'DeepSeek Coder 6.7B', provider: 'Ollama (Local)' },
    { id: 'codellama:7b', label: 'CodeLlama 7B', provider: 'Ollama (Local)' },
    { id: 'qwen2.5-coder:7b', label: 'Qwen2.5 Coder 7B', provider: 'Ollama (Local)' },
    { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B', provider: 'Groq (Free)' },
    { id: 'gemini-2.0-flash-exp', label: 'Gemini 2.0 Flash', provider: 'Google' },
    { id: 'deepseek-chat', label: 'DeepSeek V3', provider: 'DeepSeek' },
    { id: 'gpt-4o', label: 'GPT-4o', provider: 'OpenAI' },
    { id: 'claude-3-5-sonnet-latest', label: 'Claude 3.5 Sonnet', provider: 'Anthropic' },
  ]

  // Load history when projectId changes
  useEffect(() => {
    if (historyLoadedForId.current === projectId) return
    historyLoadedForId.current = projectId
    setMessages(loadHistory(projectId))
  }, [projectId])

  // Persist messages whenever they change
  useEffect(() => {
    if (historyLoadedForId.current === undefined) return
    saveHistory(projectId, messages)
  }, [messages, projectId])

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const addMessage = useCallback(
    (role: Message['role'], content: string, imageUrl?: string, files?: string[]) => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString() + Math.random(),
          role,
          content,
          timestamp: new Date(),
          imageUrl,
          files,
        },
      ])
    },
    []
  )

  // Capture runtime errors from preview iframe
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'preview-error') {
        const msg = String(e.data.message ?? '')
        lastRuntimeError.current = msg
        addMessage(
          'assistant',
          `⚠️ Preview error detected:\n\`${msg}\`\n\nType "fix the error" and I'll patch it.`
        )
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [addMessage])

  // React to isGenerating transitions
  useEffect(() => {
    if (wasGenerating.current && !isGenerating) {
      if (errorMessage) {
        addMessage('assistant', '❌ ' + errorMessage)
      } else {
        const fileCount = Object.keys(files).length
        const editedName = lastEditedFile.current ? lastEditedFile.current.split('/').pop() : null
        const msg = isEditMode.current
          ? `✅ Done! I updated **${editedName ?? 'your file'}**. The changes are live in the editor.`
          : `✅ Done! I built **${fileCount} file${fileCount !== 1 ? 's' : ''}** for you. The preview is booting up — give it a moment!`
        lastEditedFile.current = ''
        const fileList = Object.keys(files).slice(-3) // Last 3 files
        addMessage('assistant', msg, undefined, fileList)
      }
    }
    wasGenerating.current = isGenerating
  }, [isGenerating, errorMessage, files, addMessage])

  // Image attachment
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      alert('Only image files are supported.')
      return
    }
    const previewUrl = URL.createObjectURL(file)
    setAttachedImage({ file, previewUrl })
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeAttachment = () => {
    if (attachedImage) URL.revokeObjectURL(attachedImage.previewUrl)
    setAttachedImage(null)
  }

  // Render simple bold markdown
  const renderContent = (content: string) => {
    const parts = content.split(/\*\*(.+?)\*\*/g)
    return parts.map((part, i) =>
      i % 2 === 1 ? <strong key={i}>{part}</strong> : <span key={i}>{part}</span>
    )
  }

  // Submit
  const handleSubmit = () => {
    const trimmed = value.trim()
    if ((!trimmed && !attachedImage) || isGenerating) return

    const displayContent = trimmed || '(image attached)'
    addMessage('user', displayContent, attachedImage?.previewUrl)

    if (attachedImage) {
      const formData = new FormData()
      formData.append('image', attachedImage.file)
      const token = localStorage.getItem('vian_admin_token') ?? ''
      fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.url) addMessage('assistant', `✅ Image uploaded! URL: \`${data.url}\``)
          else addMessage('assistant', '❌ Upload failed: ' + (data.error ?? 'unknown error'))
        })
        .catch(() => addMessage('assistant', '❌ Image upload failed.'))
      removeAttachment()
      setValue('')
      if (textareaRef.current) textareaRef.current.style.height = 'auto'
      return
    }

    if (hasFiles) {
      isEditMode.current = true
      addMessage('assistant', 'Got it! Let me update that for you…')
      const runtimeErr = lastRuntimeError.current || errorMessage || ''
      const buildErrors = terminalLogs
        .filter(
          (l) =>
            /error|failed|cannot find|module not found|SyntaxError|TypeError|unexpected/i.test(l)
        )
        .slice(-8)
        .join('\n')
      const errorCtx = [runtimeErr, buildErrors].filter(Boolean).join('\n')
      const isFixRequest = /fix|error|broken|crash|bug|issue|doesn.t work|not work|white|blank|nothing/i.test(
        trimmed
      )
      const instruction =
        isFixRequest && errorCtx ? `${trimmed}\n\nError context:\n${errorCtx}` : trimmed
      lastRuntimeError.current = ''
      onEdit(instruction, (editedPath) => {
        lastEditedFile.current = editedPath
      })
    } else {
      isEditMode.current = false
      addMessage('assistant', 'Got it! Starting to build your app now…')
      onGenerate(trimmed)
    }

    setValue('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const getFileIcon = (filename: string) => {
    if (filename.endsWith('.js')) return { icon: 'JS', color: '#f59e0b' }
    if (filename.endsWith('.css')) return { icon: 'CSS', color: '#a78bfa' }
    if (filename.endsWith('.tsx') || filename.endsWith('.ts'))
      return { icon: <FileCode size={16} />, color: '#3b82f6' }
    if (filename.endsWith('.json')) return { icon: '⚙', color: '#888' }
    return { icon: <FileCode size={16} />, color: '#888' }
  }

  // Calculate progress percentage (example based on generationStatus)
  const getProgress = () => {
    if (!isGenerating) return 100
    const total = Object.keys(files).length
    const complete = Object.values(files).filter((f) => f.status === 'complete').length
    return total > 0 ? Math.round((complete / total) * 100) : 0
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#111]">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-4">
            <div className="w-16 h-16 rounded-2xl bg-[rgba(59,130,246,0.15)] border border-[rgba(59,130,246,0.25)] flex items-center justify-center">
              <Sparkles size={28} className="text-[#3b82f6]" />
            </div>
            <div>
              <p className="text-base font-semibold text-white mb-2">
                How can VIAN help you today?
              </p>
              <p className="text-[13px] text-[#555] leading-relaxed max-w-[220px]">
                Ask me to build components, debug issues, or explain your logic.
              </p>
            </div>
          </div>
        )}

        {messages.map((msg) => {
          if (msg.role === 'assistant') {
            return (
              <div key={msg.id} className="flex gap-3 max-w-[90%]">
                {/* AI Avatar */}
                <div className="w-8 h-8 rounded-xl bg-[rgba(59,130,246,0.20)] border border-[rgba(59,130,246,0.30)] flex items-center justify-center flex-shrink-0">
                  <Bot size={18} className="text-[#3b82f6]" />
                </div>
                <div className="flex-1">
                  {/* Message bubble */}
                  <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl rounded-tl-sm px-3.5 py-3 text-sm text-[#e2e2e2] leading-relaxed">
                    {msg.imageUrl && (
                      <img
                        src={msg.imageUrl}
                        alt="attachment"
                        className="w-full max-w-[200px] rounded-lg mb-2 object-cover"
                      />
                    )}
                    <div className="whitespace-pre-wrap break-words">{renderContent(msg.content)}</div>
                  </div>

                  {/* File chips */}
                  {msg.files && msg.files.length > 0 && (
                    <div className="flex gap-2 flex-wrap mt-2">
                      {msg.files.map((file) => {
                        const filename = file.split('/').pop() || file
                        const { icon, color } = getFileIcon(filename)
                        return (
                          <div
                            key={file}
                            className="flex items-center gap-2 bg-[#1a1a1a] border border-[#262626] rounded-lg px-3 py-1.5"
                          >
                            <span className="text-[11px] font-mono" style={{ color }}>
                              {typeof icon === 'string' ? icon : icon}
                            </span>
                            <span className="text-[11px] font-mono text-[#c4c4c4]">{filename}</span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )
          } else {
            // User message
            return (
              <div key={msg.id} className="flex justify-end items-end gap-2">
                <div className="flex flex-col items-end max-w-[85%]">
                  <span className="text-[10px] uppercase tracking-wider text-[#555] mb-1">
                    USER
                  </span>
                  <div className="bg-[#3b82f6] rounded-2xl rounded-br-sm px-4 py-3 text-sm text-white leading-relaxed">
                    {msg.imageUrl && (
                      <img
                        src={msg.imageUrl}
                        alt="attachment"
                        className="w-full max-w-[200px] rounded-lg mb-2 object-cover"
                      />
                    )}
                    <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                  </div>
                </div>
                <div className="w-7 h-7 rounded-full bg-[#2a2a2a] flex items-center justify-center flex-shrink-0">
                  <span className="text-[#888] text-sm">👤</span>
                </div>
              </div>
            )
          }
        })}

        {/* Applying changes card */}
        {isGenerating && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-xl bg-[rgba(59,130,246,0.20)] border border-[rgba(59,130,246,0.30)] flex items-center justify-center flex-shrink-0">
              <Bot size={18} className="text-[#3b82f6]" />
            </div>
            <div className="flex-1 bg-[#1a1a1a] border border-[#262626] rounded-xl rounded-tl-sm px-4 py-3.5">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#888]">
                  APPLYING CHANGES
                </span>
                <span className="text-[11px] font-bold text-[#3b82f6]">{getProgress()}%</span>
              </div>
              <div className="w-full h-1.5 bg-[#2a2a2a] rounded-full overflow-hidden mb-3">
                <div
                  className="h-full bg-[#3b82f6] rounded-full transition-all duration-300"
                  style={{ width: `${getProgress()}%` }}
                />
              </div>
              <div className="space-y-2">
                {Object.entries(files)
                  .slice(-4)
                  .map(([path, file]) => (
                    <div key={path} className="flex items-center gap-2.5">
                      {file.status === 'complete' ? (
                        <CircleCheck size={16} className="text-[#22c55e] flex-shrink-0" />
                      ) : (
                        <RefreshCw
                          size={16}
                          className="text-[#3b82f6] flex-shrink-0 animate-spin"
                        />
                      )}
                      <span
                        className={`text-[13px] ${
                          file.status === 'complete' ? 'text-[#888]' : 'text-[#3b82f6]'
                        }`}
                      >
                        {file.status === 'complete' ? 'Created' : 'Optimizing'}{' '}
                        {path.split('/').pop()}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion chips */}
      {!isGenerating && messages.length > 0 && (
        <div className="flex-shrink-0 px-4 py-2 overflow-x-auto no-scrollbar">
          <div className="flex gap-2">
            {examplePrompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => setValue(prompt)}
                className="flex-shrink-0 bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#3a3a3a] hover:text-white rounded-full px-3.5 py-1.5 text-xs text-[#888] whitespace-nowrap transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Attached image preview */}
      {attachedImage && (
        <div className="flex-shrink-0 mx-4 mb-2 flex items-center gap-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-2 py-1.5">
          <ImageIcon size={12} className="text-[#3b82f6] flex-shrink-0" />
          <img
            src={attachedImage.previewUrl}
            alt="preview"
            className="h-8 w-8 rounded object-cover"
          />
          <span className="text-[11px] text-[#888] flex-1 truncate">{attachedImage.file.name}</span>
          <button
            onClick={removeAttachment}
            className="text-[#555] hover:text-[#ef4444] transition-colors"
            title="Remove"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* Input area */}
      <div className="flex-shrink-0 px-3 pb-3 border-t border-[#1a1a1a]">
        <div className="flex items-center justify-between pt-3 pb-2 gap-2">
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Bot size={12} className="text-[#3b82f6]" />
            <span className="text-[11px] font-mono text-[#444] hidden sm:inline">Model:</span>
          </div>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value as any)}
            className="bg-[#1a1a1a] border border-[#2a2a2a] text-[10px] text-[#ededed] rounded-lg px-2 py-1 focus:outline-none focus:border-[#3b82f6] cursor-pointer transition-colors hover:border-[#3a3a3a] flex-1 sm:flex-none max-w-[200px] truncate"
            disabled={isGenerating}
          >
            {MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label} · {m.provider}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-[#1a1a1a] border border-[#2a2a2a] focus-within:border-[#3b82f6] rounded-2xl px-3.5 py-3 transition-colors">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => {
              setValue(e.target.value)
              e.target.style.height = 'auto'
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
            }}
            onKeyDown={handleKeyDown}
            placeholder={isGenerating ? 'VIAN is writing...' : 'Type a message...'}
            disabled={isGenerating}
            rows={1}
            className={`w-full bg-transparent resize-none outline-none text-sm text-white placeholder-[#444] leading-tight transition-opacity ${
              isGenerating ? 'opacity-40 cursor-not-allowed' : ''
            }`}
            style={{ maxHeight: '120px', minHeight: '44px' }}
          />

          {/* Command hint */}
          {matchedCommand && !isGenerating && (
            <div className="mt-1 px-1">
              <span className="text-[10px] font-mono text-[#3b82f6]">
                {matchedCommand.hint}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between mt-2">
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isGenerating}
                title="Attach file"
                className="text-[#555] hover:text-[#888] disabled:opacity-30 transition-colors"
              >
                <Paperclip size={18} />
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isGenerating}
                title="Attach image"
                className="text-[#555] hover:text-[#888] disabled:opacity-30 transition-colors"
              >
                <ImageIcon size={18} />
              </button>
            </div>

            <button
              onClick={handleSubmit}
              disabled={isGenerating || (!value.trim() && !attachedImage)}
              className={`w-8 h-8 rounded-full bg-[#3b82f6] hover:bg-[#2563eb] flex items-center justify-center transition-colors ${
                isGenerating ? 'opacity-40 cursor-not-allowed' : 'disabled:opacity-40 disabled:cursor-not-allowed'
              }`}
            >
              <ArrowUp size={16} className="text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
