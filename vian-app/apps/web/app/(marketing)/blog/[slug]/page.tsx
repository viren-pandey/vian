import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Navbar } from '@/components/marketing/Navbar'
import { Footer } from '@/components/marketing/Footer'

const API = process.env.API_URL ?? 'http://localhost:4000'

interface Post {
  id:          string
  title:       string
  slug:        string
  excerpt:     string
  content:     string
  coverImage:  string | null
  publishedAt: string | null
  readTime:    number
  published:   boolean
  tags:        { name: string }[]
}

async function getPost(slug: string): Promise<Post | null> {
  try {
    const res = await fetch(`${API}/api/blog/${slug}`, { next: { revalidate: 60 } })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const post = await getPost(params.slug)
  if (!post) return { title: 'Post not found — VIAN' }
  return {
    title:       `${post.title} — VIAN Blog`,
    description: post.excerpt,
    openGraph: {
      title:       post.title,
      description: post.excerpt,
      images:      post.coverImage ? [`${API}/uploads/blog/${post.coverImage}`] : [],
    },
  }
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug)
  if (!post || !post.published) notFound()

  const dateStr = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : ''

  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      <Navbar />

      <article className="max-w-3xl mx-auto px-6 pt-36 pb-24">
        {/* Cover image */}
        {post.coverImage && (
          <div className="w-full aspect-[21/9] overflow-hidden rounded-2xl mb-10 bg-[#111111]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`${API}/uploads/blog/${post.coverImage}`}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.map((t) => (
              <span key={t.name}
                className="text-xs text-[#3b82f6] bg-[#1d3a6e]/20 px-2.5 py-0.5 rounded-full">
                {t.name}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <h1 className="text-4xl font-bold text-[#f0f0f0] leading-tight mb-4">{post.title}</h1>

        {/* Excerpt */}
        {post.excerpt && (
          <p className="text-[#888888] text-lg leading-relaxed mb-6">{post.excerpt}</p>
        )}

        {/* Meta */}
        <p className="text-xs text-[#4a4a4a] mb-10">
          {dateStr}{post.readTime ? ` · ${post.readTime} min read` : ''}
        </p>

        <hr className="border-[#1a1a1a] mb-10" />

        {/* Body */}
        <div
          className="tiptap"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </article>

      <Footer />
    </main>
  )
}
