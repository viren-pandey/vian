'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, Eye } from 'lucide-react'

interface Post {
  id:          string
  title:       string
  slug:        string
  published:   boolean
  publishedAt: string | null
  updatedAt:   string
  readTime:    number
  tags:        { name: string }[]
}

export default function AdminBlogPage() {
  const router = useRouter()
  const [posts,   setPosts]   = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const res  = await fetch('/api/blog/admin/all')
      const data = await res.json()
      setPosts(Array.isArray(data) ? data : [])
    } finally {
      setLoading(false)
    }
  }

  async function deletePost(id: string) {
    if (!confirm('Delete this post? This cannot be undone.')) return
    await fetch(`/api/blog/admin/${id}`, { method: 'DELETE' })
    setPosts((prev) => prev.filter((p) => p.id !== id))
  }

  useEffect(() => { load() }, [])

  return (
    <div className="min-h-screen bg-[#0a0a0a] px-8 py-10">
      <div className="flex items-center justify-between mb-8 max-w-5xl mx-auto">
        <div>
          <h1 className="text-2xl font-semibold text-[#f0f0f0]">Blog Posts</h1>
          <p className="text-sm text-[#888888] mt-1">{posts.length} total</p>
        </div>
        <button
          onClick={() => router.push('/admin/blog/new')}
          className="flex items-center gap-2 bg-[#3b82f6] hover:bg-[#2563eb] text-white
                     text-sm px-4 py-2 rounded-lg transition-colors font-medium"
        >
          <Plus size={15} />
          New Post
        </button>
      </div>

      <div className="max-w-5xl mx-auto">
        {loading ? (
          <p className="text-[#4a4a4a] text-sm">Loading...</p>
        ) : posts.length === 0 ? (
          <div className="text-center py-24 text-[#4a4a4a]">
            <p className="text-lg mb-2">No posts yet</p>
            <p className="text-sm">Click &ldquo;New Post&rdquo; to write your first one.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {posts.map((post) => (
              <div key={post.id}
                className="flex items-center justify-between bg-[#111111] border border-[#1a1a1a]
                           hover:border-[#262626] rounded-xl px-5 py-4 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      post.published
                        ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                        : 'bg-[#1a1a1a] text-[#4a4a4a] border border-[#262626]'
                    }`}>
                      {post.published ? 'Published' : 'Draft'}
                    </span>
                    {post.tags.map((t) => (
                      <span key={t.name}
                        className="text-xs text-[#3b82f6] bg-[#1d3a6e]/20 px-2 py-0.5 rounded-full">
                        {t.name}
                      </span>
                    ))}
                  </div>
                  <h3 className="text-sm font-medium text-[#f0f0f0] truncate">
                    {post.title || 'Untitled'}
                  </h3>
                  <p className="text-xs text-[#4a4a4a] mt-0.5 font-mono">
                    /blog/{post.slug} &middot; {post.readTime} min &middot; updated{' '}
                    {new Date(post.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-1 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  {post.published && (
                    <a href={`/blog/${post.slug}`} target="_blank" rel="noreferrer"
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-[#888888]
                                 hover:text-[#f0f0f0] hover:bg-[#1a1a1a] transition-colors" title="View">
                      <Eye size={14} />
                    </a>
                  )}
                  <button onClick={() => router.push(`/admin/blog/${post.id}/edit`)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-[#888888]
                               hover:text-[#f0f0f0] hover:bg-[#1a1a1a] transition-colors" title="Edit">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => deletePost(post.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-[#888888]
                               hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Delete">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
