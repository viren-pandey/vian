'use client'

import { useState } from 'react'
import { X, Upload } from 'lucide-react'

interface PostSettingsProps {
  slug:              string
  excerpt:           string
  tags:              string[]
  coverImage:        string
  published:         boolean
  readTime:          number
  onSlugChange:      (v: string) => void
  onExcerptChange:   (v: string) => void
  onTagsChange:      (v: string[]) => void
  onCoverChange:     (v: string) => void
  onPublishedChange: (v: boolean) => void
}

export default function PostSettings(props: PostSettingsProps) {
  const [tagInput, setTagInput] = useState('')

  function addTag(e: React.KeyboardEvent) {
    if (e.key !== 'Enter') return
    const tag = tagInput.trim().toLowerCase()
    if (!tag || props.tags.includes(tag)) { setTagInput(''); return }
    props.onTagsChange([...props.tags, tag])
    setTagInput('')
  }

  async function uploadCover(file: File) {
    const form = new FormData()
    form.append('image', file)
    const res  = await fetch('/api/blog/admin/cover', { method: 'POST', body: form })
    const data = await res.json()
    props.onCoverChange(data.url)
  }

  return (
    <aside className="w-80 border-l border-[#1a1a1a] bg-[#111111] overflow-y-auto p-5 space-y-6 flex-shrink-0">

      {/* Status */}
      <section>
        <h4 className="text-xs uppercase tracking-widest text-[#4a4a4a] mb-3">Status</h4>
        <button type="button" onClick={() => props.onPublishedChange(!props.published)}
          className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg border
                      text-sm font-medium transition-colors ${
            props.published
              ? 'bg-green-500/10 border-green-500/30 text-green-400'
              : 'bg-[#1a1a1a] border-[#262626] text-[#888888]'
          }`}
        >
          <span>{props.published ? 'Published' : 'Draft'}</span>
          <span className={`w-2 h-2 rounded-full ${props.published ? 'bg-green-400' : 'bg-[#4a4a4a]'}`} />
        </button>
      </section>

      {/* Cover image */}
      <section>
        <h4 className="text-xs uppercase tracking-widest text-[#4a4a4a] mb-3">Cover Image</h4>
        <label className="block cursor-pointer">
          <input type="file" accept="image/*" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadCover(f) }} />
          {props.coverImage ? (
            <div className="relative rounded-lg overflow-hidden">
              <img src={props.coverImage} className="w-full h-32 object-cover rounded-lg" alt="cover" />
              <button type="button"
                onClick={(e) => { e.preventDefault(); props.onCoverChange('') }}
                className="absolute top-2 right-2 bg-black/60 text-white rounded-full
                           w-6 h-6 flex items-center justify-center hover:bg-black/80"
              >
                <X size={12} />
              </button>
            </div>
          ) : (
            <div className="h-24 border-2 border-dashed border-[#262626] hover:border-[#3b82f6]
                            rounded-lg flex flex-col items-center justify-center text-[#4a4a4a]
                            hover:text-[#888888] transition-colors">
              <Upload size={16} className="mb-1" />
              <span className="text-xs">Upload cover image</span>
            </div>
          )}
        </label>
      </section>

      {/* Excerpt */}
      <section>
        <h4 className="text-xs uppercase tracking-widest text-[#4a4a4a] mb-3">Excerpt</h4>
        <textarea value={props.excerpt} onChange={(e) => props.onExcerptChange(e.target.value)}
          placeholder="Short description for SEO and previews..." rows={3} maxLength={200}
          className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-3 py-2.5 text-xs
                     text-[#f0f0f0] placeholder:text-[#4a4a4a] focus:outline-none
                     focus:border-[#3b82f6] resize-none"
        />
        <p className="text-xs text-[#4a4a4a] mt-1 text-right">{props.excerpt.length} / 200</p>
      </section>

      {/* Slug */}
      <section>
        <h4 className="text-xs uppercase tracking-widest text-[#4a4a4a] mb-3">Slug</h4>
        <div className="flex items-center bg-[#0a0a0a] border border-[#262626] rounded-lg
                        overflow-hidden focus-within:border-[#3b82f6]">
          <span className="text-xs text-[#4a4a4a] pl-3 flex-shrink-0">/blog/</span>
          <input value={props.slug} onChange={(e) => props.onSlugChange(e.target.value)}
            className="flex-1 bg-transparent px-2 py-2.5 text-xs text-[#f0f0f0]
                       focus:outline-none min-w-0"
          />
        </div>
      </section>

      {/* Tags */}
      <section>
        <h4 className="text-xs uppercase tracking-widest text-[#4a4a4a] mb-3">Tags</h4>
        <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={addTag}
          placeholder="Type tag and press Enter..."
          className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-3 py-2.5 text-xs
                     text-[#f0f0f0] placeholder:text-[#4a4a4a] focus:outline-none
                     focus:border-[#3b82f6]"
        />
        {props.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {props.tags.map((tag) => (
              <span key={tag}
                className="flex items-center gap-1 bg-[#1a1a1a] border border-[#262626]
                           text-[#888888] text-xs px-2.5 py-1 rounded-full"
              >
                {tag}
                <button type="button"
                  onClick={() => props.onTagsChange(props.tags.filter((t) => t !== tag))}
                  className="text-[#4a4a4a] hover:text-[#f0f0f0] ml-0.5"
                >
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
        )}
      </section>

      {/* Read time */}
      <section>
        <h4 className="text-xs uppercase tracking-widest text-[#4a4a4a] mb-1">Read time</h4>
        <p className="text-xs text-[#888888]">~{props.readTime} min read</p>
      </section>

    </aside>
  )
}
