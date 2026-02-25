'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useDebouncedCallback } from 'use-debounce'
import { ArrowLeft, Check, Loader2 } from 'lucide-react'
import BlogEditor from '@/components/admin/blog/BlogEditor'
import PostSettings from '@/components/admin/blog/PostSettings'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

const estimateReadTime = (html: string) =>
  Math.max(1, Math.ceil(html.replace(/<[^>]*>/g, '').trim().split(/\s+/).filter(Boolean).length / 200))

export default function EditPostPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()

  const [fetching,   setFetching]   = useState(true)
  const [title,      setTitle]      = useState('')
  const [content,    setContent]    = useState('')
  const [slug,       setSlug]       = useState('')
  const [excerpt,    setExcerpt]    = useState('')
  const [tags,       setTags]       = useState<string[]>([])
  const [coverImage, setCoverImage] = useState('')
  const [published,  setPublished]  = useState(false)
  const [readTime,   setReadTime]   = useState(1)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')

  const initialized = useRef(false)

  useEffect(() => {
    async function load() {
      try {
        const res  = await fetch(`/api/blog/admin/${id}`)
        if (!res.ok) throw new Error()
        const data = await res.json()
        setTitle(data.title ?? '')
        setContent(data.content ?? '')
        setSlug(data.slug ?? '')
        setExcerpt(data.excerpt ?? '')
        setTags((data.tags ?? []).map((t: { name: string }) => t.name))
        setCoverImage(data.coverImage ?? '')
        setPublished(data.published ?? false)
        setReadTime(data.readTime ?? 1)
        initialized.current = true
      } finally {
        setFetching(false)
      }
    }
    load()
  }, [id])

  const save = useCallback(async (pub?: boolean) => {
    setSaveStatus('saving')
    try {
      const res = await fetch(`/api/blog/admin/${id}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          title: title.trim() || 'Untitled',
          slug,
          excerpt,
          content,
          tags,
          coverImage,
          readTime,
          published: pub ?? published,
        }),
      })
      if (!res.ok) throw new Error()
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch {
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, title, content, slug, excerpt, tags, coverImage, published, readTime])

  const autoSave = useDebouncedCallback(() => {
    if (initialized.current) save()
  }, 3000)

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

  if (fetching) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#4a4a4a]" size={24} />
      </div>
    )
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
          <span className="text-sm text-[#4a4a4a]">Edit Post</span>
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
          {published && (
            <a href={`/blog/${slug}`} target="_blank" rel="noreferrer"
              className="text-sm px-3 py-1.5 rounded-lg border border-[#262626] text-[#888888]
                         hover:text-[#f0f0f0] hover:border-[#3a3a3a] transition-colors">
              View Live
            </a>
          )}
          <button onClick={() => save()}
            className="text-sm px-3 py-1.5 rounded-lg border border-[#262626] text-[#888888]
                       hover:text-[#f0f0f0] hover:border-[#3a3a3a] transition-colors">
            Save Draft
          </button>
          {!published && (
            <button onClick={handlePublish}
              className="text-sm px-4 py-1.5 rounded-lg bg-[#3b82f6] hover:bg-[#2563eb]
                         text-white font-medium transition-colors">
              Publish
            </button>
          )}
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Editor area */}
        <div className="flex-1 overflow-y-auto px-10 py-10 max-w-3xl mx-auto w-full">
          <input
            value={title}
            onChange={(e) => { setTitle(e.target.value); autoSave() }}
            placeholder="Post title…"
            className="w-full bg-transparent text-3xl font-bold text-[#f0f0f0] placeholder-[#333]
                       outline-none border-none mb-8 resize-none"
          />
          <BlogEditor content={content} onChange={handleContentChange} />
        </div>

        {/* Sidebar */}
        <aside className="w-72 border-l border-[#1a1a1a] overflow-y-auto bg-[#0a0a0a]">
          <PostSettings
            slug={slug}             onSlugChange={(v) => { setSlug(v); autoSave() }}
            excerpt={excerpt}       onExcerptChange={(v) => { setExcerpt(v); autoSave() }}
            tags={tags}             onTagsChange={(v) => { setTags(v); autoSave() }}
            coverImage={coverImage}  onCoverImageChange={(v) => { setCoverImage(v); autoSave() }}
            published={published}   onPublishedChange={(v) => { setPublished(v); autoSave() }}
            readTime={readTime}
          />
        </aside>
      </div>
    </div>
  )
}
