'use client'

import { useCallback, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDebouncedCallback } from 'use-debounce'
import { ArrowLeft, Check, Loader2 } from 'lucide-react'
import BlogEditor from '@/components/admin/blog/BlogEditor'
import PostSettings from '@/components/admin/blog/PostSettings'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

const generateSlug = (t: string) =>
  t.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-').slice(0, 80)

const estimateReadTime = (html: string) =>
  Math.max(1, Math.ceil(html.replace(/<[^>]*>/g, '').trim().split(/\s+/).filter(Boolean).length / 200))

export default function NewPostPage() {
  const router    = useRouter()
  const postIdRef = useRef<string | null>(null)

  const [title,      setTitle]      = useState('')
  const [content,    setContent]    = useState('')
  const [slug,       setSlug]       = useState('')
  const [excerpt,    setExcerpt]    = useState('')
  const [tags,       setTags]       = useState<string[]>([])
  const [coverImage, setCoverImage] = useState('')
  const [published,  setPublished]  = useState(false)
  const [readTime,   setReadTime]   = useState(1)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')

  const buildPayload = (pub?: boolean) => ({
    title:     title.trim() || 'Untitled',
    slug:      slug || generateSlug(title) || 'untitled',
    excerpt,
    content,
    tags,
    coverImage,
    readTime,
    published: pub ?? published,
  })

  const save = useCallback(async (pub?: boolean) => {
    setSaveStatus('saving')
    try {
      const payload = buildPayload(pub)
      let res: Response
      if (!postIdRef.current) {
        res = await fetch('/api/blog/admin', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(payload),
        })
      } else {
        res = await fetch(`/api/blog/admin/${postIdRef.current}`, {
          method:  'PUT',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(payload),
        })
      }
      if (!res.ok) throw new Error()
      const data = await res.json()
      if (!postIdRef.current) postIdRef.current = data.id
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch {
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, content, slug, excerpt, tags, coverImage, published, readTime])

  const autoSave = useDebouncedCallback(() => save(), 3000)

  function handleTitleChange(val: string) {
    setTitle(val)
    if (!slug) setSlug(generateSlug(val))
    autoSave()
  }

  function handleContentChange(html: string) {
    setContent(html)
    setReadTime(estimateReadTime(html))
    autoSave()
  }

  async function handlePublish() {
    setPublished(true)
    await save(true)
    router.push('/admin/blog')
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      {/* Topbar */}
      <header className="h-14 flex items-center justify-between px-5 border-b border-[#1a1a1a]
                         bg-[#0a0a0a]/80 backdrop-blur sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <button onClick={() => router.push('/admin/blog')}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[#888888]
                       hover:text-[#f0f0f0] hover:bg-[#1a1a1a] transition-colors">
            <ArrowLeft size={16} />
          </button>
          <span className="text-sm text-[#4a4a4a]">New Post</span>
        </div>

        <div className="flex items-center gap-3">
          {saveStatus === 'saving' && (
            <span className="flex items-center gap-1.5 text-xs text-[#4a4a4a]">
              <Loader2 size={12} className="animate-spin" /> Saving…
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="flex items-center gap-1.5 text-xs text-green-500">
              <Check size={12} /> Saved
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="text-xs text-red-400">Save failed</span>
          )}
          <button onClick={() => save()}
            className="text-sm px-3 py-1.5 rounded-lg border border-[#262626] text-[#888888]
                       hover:text-[#f0f0f0] hover:border-[#3a3a3a] transition-colors">
            Save Draft
          </button>
          <button onClick={handlePublish}
            className="text-sm px-4 py-1.5 rounded-lg bg-[#3b82f6] hover:bg-[#2563eb]
                       text-white font-medium transition-colors">
            Publish
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Editor area */}
        <div className="flex-1 overflow-y-auto px-10 py-10 max-w-3xl mx-auto w-full">
          <input
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Post title…"
            className="w-full bg-transparent text-3xl font-bold text-[#f0f0f0] placeholder-[#333]
                       outline-none border-none mb-8 resize-none"
          />
          <BlogEditor content={content} onChange={handleContentChange} />
        </div>

        {/* Sidebar */}
        <aside className="w-72 border-l border-[#1a1a1a] overflow-y-auto bg-[#0a0a0a]">
          <PostSettings
            slug={slug}           onSlugChange={setSlug}
            excerpt={excerpt}     onExcerptChange={setExcerpt}
            tags={tags}           onTagsChange={setTags}
            coverImage={coverImage} onCoverImageChange={setCoverImage}
            published={published}  onPublishedChange={setPublished}
            readTime={readTime}
          />
        </aside>
      </div>
    </div>
  )
}
