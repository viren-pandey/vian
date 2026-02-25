'use client'

import { useState, useRef, useEffect, type KeyboardEvent } from 'react'
import { Send, ChevronDown, Bot, User } from 'lucide-react'
import { useProjectStore } from '@/stores/projectStore'
import { MODELS, type ModelId } from '@/lib/constants'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface ChatPanelProps {
  onEdit: (instruction: string, onSuccess?: (editedPath: string) => void) => void
  onGenerate: (prompt: string) => void
}

export default function ChatPanel({ onEdit, onGenerate }: ChatPanelProps) {
  const [value, setValue] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [showModelMenu, setShowModelMenu] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const wasGenerating = useRef(false)
  const isEditMode = useRef(false)
  const lastEditedFile = useRef<string>('')
  const lastRuntimeError = useRef('')
  const { isGenerating, model, setModel, files, errorMessage } = useProjectStore()

  const currentModel = MODELS.find((m) => m.id === model) ?? MODELS[0]
  const hasFiles = Object.keys(files).length > 0

  // Detect conversational messages that should get a local reply instead of calling the API
  const isConversational = (text: string): boolean => {
    if (text.length > 60) return false
    const codeKeywords = /add|creat|mak|build|chang|updat|fix|style|remov|delet|button|page|component|color|font|layout|dark|light|navbar|header|footer|sidebar|modal|form|input|table|list|card|icon|background|border|padding|margin|align|center|responsive|mobile|animation|hover|click|submit|fetch|api|data|state|hook|function|tsx?|jsx?|css|html|json|npm|install/i
    if (codeKeywords.test(text)) return false
    return true
  }

  const getConversationalReply = (text: string): string => {
    const t = text.toLowerCase().trim()
    if (/^(hi|hello|hey|sup|yo)/.test(t)) return 'Hey! Describe what you want to build or change and I will get right on it.'
    if (/thank|thanks/.test(t)) return 'You are welcome! Let me know if you want any changes.'
    if (/^[\d\s+\-*/^()]+$/.test(t)) {
      try { return 'That equals: ' + eval(t) } catch { return 'I am a code AI — try describing an app to build!' }
    }
    if (/who are you|what are you/.test(t)) return 'I am VIAN — an AI code builder by Viren Pandeyy. Describe an app and I will build it!'
    if (/how are you/.test(t)) return 'Ready to build! What do you want to create?'
    return 'I am a code AI — describe what you want to build or change in your app!'
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Capture runtime errors forwarded from the preview iframe via postMessage
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'preview-error') {
        const msg = String(e.data.message ?? '')
        lastRuntimeError.current = msg
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: 'assistant',
            content: `⚠️ Preview error detected:\n\`${msg}\`\n\nType "fix the error" and I will patch it.`,
            timestamp: new Date(),
          },
        ])
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])

  useEffect(() => {
    if (wasGenerating.current && !isGenerating) {
      if (errorMessage) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: 'assistant',
            content: 'Error: ' + errorMessage,
            timestamp: new Date(),
          },
        ])
      } else {
        const fileCount = Object.keys(files).length
        const editedName = lastEditedFile.current
          ? lastEditedFile.current.split('/').pop()
          : null
        const msg = isEditMode.current
          ? 'Done! I updated ' + (editedName ?? 'your file') + '. The changes are live in the editor.'
          : 'Done! I built ' + fileCount + ' file' + (fileCount !== 1 ? 's' : '') + ' for you. The preview is booting up — give it a moment!'
        lastEditedFile.current = ''
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: 'assistant',
            content: msg,
            timestamp: new Date(),
          },
        ])
      }
    }
    wasGenerating.current = isGenerating
  }, [isGenerating, errorMessage, files, hasFiles])

  const handleSubmit = () => {
    const trimmed = value.trim()
    if (!trimmed || isGenerating) return

    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), role: 'user', content: trimmed, timestamp: new Date() },
    ])

    // Detect conversational messages and reply locally
    if (hasFiles && isConversational(trimmed)) {
      const reply = getConversationalReply(trimmed)
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { id: Date.now().toString(), role: 'assistant', content: reply, timestamp: new Date() },
        ])
      }, 300)
      setValue('')
      if (textareaRef.current) textareaRef.current.style.height = 'auto'
      return
    }

    if (hasFiles) {
      isEditMode.current = true
      // Auto-inject error context when the user is asking to fix something
      const errorCtx = lastRuntimeError.current || errorMessage || ''
      const isFixRequest = /fix|error|broken|crash|bug|issue|doesn.t work|not work/i.test(trimmed)
      const instruction = (isFixRequest && errorCtx)
        ? `${trimmed}\n\nError context to fix:\n${errorCtx}`
        : trimmed
      lastRuntimeError.current = ''
      onEdit(instruction, (editedPath) => { lastEditedFile.current = editedPath })
    } else {
      isEditMode.current = false
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

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#111]">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-0">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-4">
            <div className="w-10 h-10 rounded-xl bg-accent/15 border border-accent/20 flex items-center justify-center">
              <Bot size={18} className="text-accent" />
            </div>
            <div>
              <p className="text-xs font-medium text-text-primary mb-1">VIAN</p>
              <p className="text-[11px] text-text-muted leading-relaxed">
                {hasFiles
                  ? 'Describe a change and I will update your app.'
                  : 'Describe the app you want to build and I will generate it.'}
              </p>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={
              'flex gap-2 items-start ' +
              (msg.role === 'user' ? 'justify-end' : 'justify-start')
            }
          >
            {msg.role === 'assistant' && (
              <div className="w-5 h-5 rounded-md bg-accent/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot size={10} className="text-accent" />
              </div>
            )}
            <div
              className={
                'max-w-[85%] rounded-xl px-3 py-2 text-[11px] leading-relaxed font-ui ' +
                (msg.role === 'user'
                  ? 'bg-accent/15 text-text-primary border border-accent/20'
                  : 'bg-[#1a1a1a] text-text-muted border border-[#2a2a2a]')
              }
            >
              {msg.content}
            </div>
            {msg.role === 'user' && (
              <div className="w-5 h-5 rounded-md bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center flex-shrink-0 mt-0.5">
                <User size={10} className="text-text-muted" />
              </div>
            )}
          </div>
        ))}

        {isGenerating && (
          <div className="flex gap-2 items-start justify-start">
            <div className="w-5 h-5 rounded-md bg-accent/15 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Bot size={10} className="text-accent" />
            </div>
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-3 py-2 flex gap-1 items-center">
              <span className="w-1 h-1 rounded-full bg-accent animate-pulse" style={{ animationDelay: '0ms' }} />
              <span className="w-1 h-1 rounded-full bg-accent animate-pulse" style={{ animationDelay: '150ms' }} />
              <span className="w-1 h-1 rounded-full bg-accent animate-pulse" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="flex-shrink-0 p-3 border-t border-[#1f1f1f]">
        <div className="relative mb-2">
          <button
            onClick={() => setShowModelMenu((v) => !v)}
            onBlur={() => setTimeout(() => setShowModelMenu(false), 120)}
            className="flex items-center gap-1 text-[10px] text-text-muted hover:text-text-secondary transition-colors py-0.5 font-ui"
          >
            <span>{currentModel.label}</span>
            <ChevronDown size={10} className="opacity-60" />
          </button>

          {showModelMenu && (
            <div className="absolute bottom-full mb-1 left-0 w-52 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg shadow-xl z-50 py-1 max-h-48 overflow-y-auto">
              {MODELS.map((m) => (
                <button
                  key={m.id}
                  onMouseDown={() => {
                    setModel(m.id as ModelId)
                    setShowModelMenu(false)
                  }}
                  className={
                    'w-full text-left px-3 py-1.5 text-[10px] font-ui flex items-center justify-between hover:bg-[#222] transition-colors ' +
                    (model === m.id ? 'text-accent' : 'text-text-secondary')
                  }
                >
                  <span>{m.label}</span>
                  <span className="text-text-muted">{m.provider}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-end gap-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-3 py-2 focus-within:border-accent/40 transition-colors">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => {
              setValue(e.target.value)
              e.target.style.height = 'auto'
              e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px'
            }}
            onKeyDown={handleKeyDown}
            placeholder={hasFiles ? 'Describe a change...' : 'Describe your app...'}
            disabled={isGenerating}
            rows={1}
            className="flex-1 bg-transparent resize-none outline-none text-[11px] text-text-primary placeholder-[#444] disabled:opacity-40 font-ui leading-5"
            style={{ maxHeight: '100px' }}
          />
          <button
            onClick={handleSubmit}
            disabled={isGenerating || !value.trim()}
            className="flex-shrink-0 w-6 h-6 bg-accent hover:bg-accent-hover disabled:opacity-30 disabled:cursor-not-allowed rounded-lg flex items-center justify-center transition-colors"
          >
            <Send size={11} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  )
}