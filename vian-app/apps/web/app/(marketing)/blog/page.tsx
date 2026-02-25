import { Metadata } from 'next'
import { Navbar } from '@/components/marketing/Navbar'
import { Footer } from '@/components/marketing/Footer'
import BlogCard from '@/components/marketing/BlogCard'

export const metadata: Metadata = {
  title:       'Blog — VIAN',
  description: 'Articles, updates, and thoughts from the VIAN team.',
}

const API = process.env.API_URL ?? 'http://localhost:4000'

interface Post {
  id:          string
  title:       string
  slug:        string
  excerpt:     string
  coverImage:  string | null
  publishedAt: string | null
  readTime:    number
  tags:        { name: string; slug?: string }[]
}

async function getPosts(): Promise<Post[]> {
  try {
    const res = await fetch(`${API}/api/blog`, { next: { revalidate: 60 } })
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

export default async function BlogIndexPage() {
  const posts   = await getPosts()
  const [hero, ...rest] = posts

  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      <Navbar />

      <section className="max-w-5xl mx-auto px-6 pt-36 pb-24">
        <h1 className="text-4xl font-bold text-[#f0f0f0] mb-2">Blog</h1>
        <p className="text-[#888888] mb-14 text-base">
          Articles, updates, and thoughts from the VIAN team.
        </p>

        {posts.length === 0 ? (
          <p className="text-[#4a4a4a]">No posts published yet — check back soon.</p>
        ) : (
          <>
            {/* Featured / hero post */}
            {hero && (
              <a href={`/blog/${hero.slug}`} className="block mb-12 group">
                {hero.coverImage && (
                  <div className="aspect-[21/9] w-full overflow-hidden rounded-2xl mb-5 bg-[#111111]">
                    <img
                      src={`${API}/uploads/blog/${hero.coverImage}`}
                      alt={hero.title}
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                    />
                  </div>
                )}
                <div className="flex gap-2 mb-3">
                  {hero.tags.map((t) => (
                    <span key={t.name}
                      className="text-xs text-[#3b82f6] bg-[#1d3a6e]/20 px-2.5 py-0.5 rounded-full">
                      {t.name}
                    </span>
                  ))}
                </div>
                <h2 className="text-2xl font-bold text-[#f0f0f0] group-hover:text-white mb-2 leading-snug">
                  {hero.title}
                </h2>
                {hero.excerpt && (
                  <p className="text-[#888888] text-base max-w-2xl leading-relaxed">{hero.excerpt}</p>
                )}
                <p className="text-xs text-[#4a4a4a] mt-3">
                  {hero.publishedAt ? new Date(hero.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
                  {hero.readTime ? ` · ${hero.readTime} min read` : ''}
                </p>
              </a>
            )}

            {/* Rest of posts */}
            {rest.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {rest.map((post) => (
                  <BlogCard key={post.id} post={post} apiBase={API} />
                ))}
              </div>
            )}
          </>
        )}
      </section>

      <Footer />
    </main>
  )
}
