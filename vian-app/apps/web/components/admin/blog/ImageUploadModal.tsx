'use client'

import { useState, useRef } from 'react'
import { Upload, X } from 'lucide-react'

interface Props {
  onInsert: (url: string, alt: string) => void
  onClose:  () => void
}

export default function ImageUploadModal({ onInsert, onClose }: Props) {
  const [tab,       setTab]       = useState<'upload' | 'url'>('upload')
  const [url,       setUrl]       = useState('')
  const [alt,       setAlt]       = useState('')
  const [preview,   setPreview]   = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [dragging,  setDragging]  = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function uploadFile(file: File) {
    setUploading(true)
    try {
      const form = new FormData()
      form.append('image', file)
      const res  = await fetch('/api/blog/admin/image', { method: 'POST', body: form })
      const data = await res.json()
      setPreview(data.url)
      setUrl(data.url)
    } finally {
      setUploading(false)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) uploadFile(file)
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#141414] border border-[#262626] rounded-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-semibold text-[#f0f0f0]">Insert Image</h3>
          <button type="button" onClick={onClose} className="text-[#888888] hover:text-[#f0f0f0]">
            <X size={16} />
          </button>
        </div>

        <div className="flex gap-1 mb-5 border-b border-[#1a1a1a]">
          {(['upload', 'url'] as const).map((t) => (
            <button key={t} type="button" onClick={() => setTab(t)}
              className={`px-4 py-2 text-xs font-medium border-b-2 -mb-px transition-colors ${
                tab === t
                  ? 'border-[#3b82f6] text-[#f0f0f0]'
                  : 'border-transparent text-[#888888] hover:text-[#f0f0f0]'
              }`}
            >
              {t === 'upload' ? 'Upload' : 'Paste URL'}
            </button>
          ))}
        </div>

        {tab === 'upload' && (
          <div>
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onClick={() => fileRef.current?.click()}
              className={`h-32 border-2 border-dashed rounded-xl flex flex-col items-center
                          justify-center cursor-pointer transition-colors ${
                dragging
                  ? 'border-[#3b82f6] bg-[#1d3a6e]/20'
                  : 'border-[#262626] hover:border-[#3b82f6] bg-[#0a0a0a]'
              }`}
            >
              {uploading ? (
                <div className="text-[#888888] text-xs">Uploading...</div>
              ) : preview ? (
                <img src={preview} className="h-full w-full object-contain rounded-xl p-2" alt="preview" />
              ) : (
                <>
                  <Upload size={20} className="text-[#4a4a4a] mb-2" />
                  <span className="text-xs text-[#888888]">Drop image or click to browse</span>
                  <span className="text-xs text-[#4a4a4a] mt-1">PNG, JPG, WEBP, GIF up to 10MB</span>
                </>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f) }} />
          </div>
        )}

        {tab === 'url' && (
          <div className="space-y-3">
            <input value={url} onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/image.png"
              className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-3 py-2.5
                         text-sm text-[#f0f0f0] placeholder:text-[#4a4a4a] focus:outline-none
                         focus:border-[#3b82f6]"
            />
            {url && <img src={url} className="w-full h-32 object-contain rounded-lg bg-[#0a0a0a]" alt="preview" />}
          </div>
        )}

        <div className="mt-4 space-y-1">
          <label className="text-xs text-[#888888]">Alt text (optional)</label>
          <input value={alt} onChange={(e) => setAlt(e.target.value)}
            placeholder="Describe the image..."
            className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-3 py-2.5
                       text-sm text-[#f0f0f0] placeholder:text-[#4a4a4a] focus:outline-none
                       focus:border-[#3b82f6]"
          />
        </div>

        <div className="flex gap-2 mt-6">
          <button type="button" onClick={onClose}
            className="flex-1 bg-[#1a1a1a] hover:bg-[#222222] text-[#888888] text-sm py-2.5
                       rounded-lg transition-colors">
            Cancel
          </button>
          <button type="button" onClick={() => url && onInsert(url, alt)} disabled={!url}
            className="flex-1 bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-40
                       disabled:cursor-not-allowed text-white text-sm py-2.5 rounded-lg transition-colors">
            Insert Image
          </button>
        </div>
      </div>
    </div>
  )
}
