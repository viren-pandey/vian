interface Post {
  id:          string
  title:       string
  slug:        string
  excerpt:     string
  coverImage?: string | null
  publishedAt: string | null
  readTime:    number
  tags:        { name: string; slug: string }[]
}

export default function BlogCard({ post, apiBase = '' }: { post: Post; apiBase?: string }) {
  return (
    <a
      href={`/blog/${post.slug}`}
      className="block group bg-[#111111] border border-[#1a1a1a] hover:border-[#262626]
                 rounded-xl overflow-hidden transition-colors"
    >
      {post.coverImage && (
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`${apiBase}/uploads/blog/${post.coverImage}`}
          alt={post.title}
          className="w-full h-40 object-cover"
        />
      )}
      <div className="p-5">
        {post.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {post.tags.map((tag) => (
              <span
                key={tag.name}
                className="text-xs text-[#3b82f6] bg-[#1d3a6e]/30 px-2 py-0.5 rounded-full"
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}
        <h3 className="text-sm font-semibold text-[#f0f0f0] group-hover:text-white
                       transition-colors line-clamp-2 leading-snug">
          {post.title}
        </h3>
        {post.excerpt && (
          <p className="text-xs text-[#888888] leading-relaxed mt-2 line-clamp-2">
            {post.excerpt}
          </p>
        )}
        <p className="text-xs text-[#4a4a4a] mt-4 font-mono">
          {post.publishedAt
            ? new Date(post.publishedAt).toLocaleDateString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric',
              })
            : ''}{' '}
          {post.readTime > 0 && <> &middot; {post.readTime} min</>}
        </p>
      </div>
    </a>
  )
}
