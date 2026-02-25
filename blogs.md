# VIAN — Blog System
### Complete Implementation Prompt for GitHub Copilot / Cursor / Claude Code
> Read every section before writing a single line of code.
> This file covers the entire blog system — editor, admin panel, public pages, API.

---

## 1. WHAT THIS FILE COVERS

A full WordPress-style blog system for VIAN by Viren.

Viren (admin) writes posts in a rich text editor from the admin panel.
Public users read posts on the marketing site at /blog and /blog/[slug].

Features:
- Rich text editor (Tiptap) with full formatting toolbar
- Image uploads directly inside posts
- Cover image per post
- Draft / Publish system with auto-save
- Tags, excerpts, slugs, read time
- Public blog index + individual post pages
- Admin dashboard to manage all posts

---

## 2. ROUTES

```
PUBLIC:
  /blog                      Blog index — all published posts
  /blog/[slug]               Single post page

ADMIN (ULTIMATE_ADMIN only):
  /admin/blog                All posts list (drafts + published)
  /admin/blog/new            Create new post
  /admin/blog/[id]/edit      Edit existing post
```

---

## 3. FOLDER STRUCTURE

```
apps/web/
├── app/
│   ├── (marketing)/
│   │   ├── blog/
│   │   │   ├── page.tsx              ← Public blog index
│   │   │   └── [slug]/
│   │   │       └── page.tsx          ← Public post page
│   └── (admin)/
│       └── admin/
│           └── blog/
│               ├── page.tsx          ← Admin posts list
│               ├── new/
│               │   └── page.tsx      ← Create post
│               └── [id]/
│                   └── edit/
│                       └── page.tsx  ← Edit post
│
├── components/
│   ├── marketing/
│   │   └── BlogCard.tsx              ← Reusable post card
│   └── admin/
│       └── blog/
│           ├── BlogEditor.tsx        ← Main Tiptap editor
│           ├── EditorToolbar.tsx     ← Formatting toolbar
│           ├── PostSettings.tsx      ← Right sidebar (slug, tags, etc.)
│           ├── ImageUploadModal.tsx  ← Upload or paste URL
│           └── CoverImageUpload.tsx  ← Cover image in sidebar

apps/api/
└── src/
    └── routes/
        └── blog.ts                   ← All blog API routes
```

---

## 4. DEPENDENCIES

Install these in `apps/web`:

```bash
pnpm add @tiptap/react @tiptap/pm @tiptap/starter-kit
pnpm add @tiptap/extension-image
pnpm add @tiptap/extension-link
pnpm add @tiptap/extension-placeholder
pnpm add @tiptap/extension-text-align
pnpm add @tiptap/extension-highlight
pnpm add @tiptap/extension-underline
pnpm add @tiptap/extension-code-block-lowlight
pnpm add lowlight
pnpm add use-debounce
pnpm add reading-time
```

Install in `apps/api`:

```bash
pnpm add multer @types/multer
pnpm add slugify
```

---

## 5. DATABASE SCHEMA

Add to `packages/prisma/schema.prisma`:

```prisma
model BlogPost {
  id          String     @id @default(cuid())
  title       String
  slug        String     @unique
  excerpt     String     @default("")
  content     String     @db.Text
  coverImage  String?
  published   Boolean    @default(false)
  publishedAt DateTime?
  readTime    Int        @default(0)
  tags        BlogTag[]  @relation("BlogPostTags")
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  @@map("blog_posts")
}

model BlogTag {
  id    String     @id @default(cuid())
  name  String     @unique
  slug  String     @unique
  posts BlogPost[] @relation("BlogPostTags")

  @@map("blog_tags")
}
```

Run migration:

```bash
cd packages/prisma
pnpm prisma migrate dev --name add_blog
pnpm prisma generate
```

---

## 6. API ROUTES

### File: `apps/api/src/routes/blog.ts`

```typescript
import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import multer from 'multer'
import path from 'path'
import { requireAdmin } from '../middleware/requireAdmin'

const router  = Router()
const prisma  = new PrismaClient()
const upload  = multer({
  dest: 'uploads/blog/',
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    const allowed = ['image/png','image/jpeg','image/webp','image/gif']
    cb(null, allowed.includes(file.mimetype))
  },
})

// ─── PUBLIC ROUTES ──────────────────────────────────────────────────

// GET /api/blog — all published posts
router.get('/', async (req, res) => {
  const posts = await prisma.blogPost.findMany({
    where:   { published: true },
    orderBy: { publishedAt: 'desc' },
    include: { tags: true },
    select: {
      id: true, title: true, slug: true,
      excerpt: true, coverImage: true,
      publishedAt: true, readTime: true,
      tags: { select: { name: true, slug: true } },
    },
  })
  res.json(posts)
})

// GET /api/blog/latest?limit=3 — for landing page preview
router.get('/latest', async (req, res) => {
  const limit = parseInt(req.query.limit as string) || 3
  const posts = await prisma.blogPost.findMany({
    where:   { published: true },
    orderBy: { publishedAt: 'desc' },
    take:    limit,
    select: {
      id: true, title: true, slug: true,
      excerpt: true, coverImage: true,
      publishedAt: true, readTime: true,
      tags: { select: { name: true } },
    },
  })
  res.json(posts)
})

// GET /api/blog/:slug — single post
router.get('/:slug', async (req, res) => {
  const post = await prisma.blogPost.findUnique({
    where:   { slug: req.params.slug },
    include: { tags: true },
  })
  if (!post || !post.published) {
    return res.status(404).json({ error: 'Post not found' })
  }
  res.json(post)
})

// ─── ADMIN ROUTES ────────────────────────────────────────────────────

// GET /api/admin/blog — all posts (draft + published)
router.get('/admin/all', requireAdmin, async (req, res) => {
  const posts = await prisma.blogPost.findMany({
    orderBy: { updatedAt: 'desc' },
    include: { tags: true },
  })
  res.json(posts)
})

// POST /api/admin/blog — create post
router.post('/admin', requireAdmin, async (req, res) => {
  const { title, slug, excerpt, content, coverImage, published, tags, readTime } = req.body

  // Upsert tags
  const tagRecords = await Promise.all(
    (tags as string[]).map((name) =>
      prisma.blogTag.upsert({
        where:  { name },
        update: {},
        create: { name, slug: name.toLowerCase().replace(/\s+/g, '-') },
      })
    )
  )

  const post = await prisma.blogPost.create({
    data: {
      title, slug, excerpt, content,
      coverImage, readTime,
      published,
      publishedAt: published ? new Date() : null,
      tags: { connect: tagRecords.map((t) => ({ id: t.id })) },
    },
    include: { tags: true },
  })
  res.json(post)
})

// PUT /api/admin/blog/:id — update post
router.put('/admin/:id', requireAdmin, async (req, res) => {
  const { title, slug, excerpt, content, coverImage, published, tags, readTime } = req.body
  const existing = await prisma.blogPost.findUnique({ where: { id: req.params.id } })
  if (!existing) return res.status(404).json({ error: 'Post not found' })

  const tagRecords = await Promise.all(
    (tags as string[]).map((name) =>
      prisma.blogTag.upsert({
        where:  { name },
        update: {},
        create: { name, slug: name.toLowerCase().replace(/\s+/g, '-') },
      })
    )
  )

  const post = await prisma.blogPost.update({
    where: { id: req.params.id },
    data: {
      title, slug, excerpt, content,
      coverImage, readTime,
      published,
      publishedAt: published && !existing.publishedAt ? new Date() : existing.publishedAt,
      tags: { set: tagRecords.map((t) => ({ id: t.id })) },
    },
    include: { tags: true },
  })
  res.json(post)
})

// DELETE /api/admin/blog/:id
router.delete('/admin/:id', requireAdmin, async (req, res) => {
  await prisma.blogPost.delete({ where: { id: req.params.id } })
  res.json({ success: true })
})

// POST /api/admin/blog/cover — upload cover image
router.post('/admin/cover', requireAdmin, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
  res.json({ url: `/api/blog/image/${req.file.filename}` })
})

// POST /api/admin/blog/image — upload inline image (for editor)
router.post('/admin/image', requireAdmin, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
  res.json({ url: `/api/blog/image/${req.file.filename}` })
})

// GET /api/blog/image/:filename — serve image
router.get('/image/:filename', (req, res) => {
  res.sendFile(path.resolve(`uploads/blog/${req.params.filename}`))
})

export default router
```

Register in `apps/api/src/index.ts`:

```typescript
import blogRouter from './routes/blog'
app.use('/api/blog', blogRouter)
```

---

## 7. MAIN EDITOR COMPONENT

### `apps/web/components/admin/blog/BlogEditor.tsx`

```typescript
'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import Highlight from '@tiptap/extension-highlight'
import Underline from '@tiptap/extension-underline'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { common, createLowlight } from 'lowlight'
import EditorToolbar from './EditorToolbar'

const lowlight = createLowlight(common)

interface BlogEditorProps {
  content:  string
  onChange: (html: string) => void
}

export default function BlogEditor({ content, onChange }: BlogEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      Image.configure({ inline: false, allowBase64: true }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'text-blue-500 underline underline-offset-2' },
      }),
      Placeholder.configure({ placeholder: 'Start writing your post...' }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight.configure({ multicolor: false }),
      Underline,
      CodeBlockLowlight.configure({ lowlight }),
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: { class: 'tiptap focus:outline-none' },
    },
  })

  return (
    <div className="flex flex-col h-full">
      <EditorToolbar editor={editor} />
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-8 py-10">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  )
}
```

---

## 8. TOOLBAR COMPONENT

### `apps/web/components/admin/blog/EditorToolbar.tsx`

```typescript
'use client'

import { Editor } from '@tiptap/react'
import { useState } from 'react'
import {
  Bold, Italic, Underline, Strikethrough,
  Code, Code2, AlignLeft, AlignCenter, AlignRight,
  Image as ImageIcon, Link as LinkIcon,
  Minus, Highlighter, Undo, Redo,
  Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, ChevronDown,
} from 'lucide-react'
import ImageUploadModal from './ImageUploadModal'

interface ToolbarProps { editor: Editor | null }

export default function EditorToolbar({ editor }: ToolbarProps) {
  const [showImageModal, setShowImageModal] = useState(false)
  const [showLinkInput,  setShowLinkInput]  = useState(false)
  const [linkUrl,        setLinkUrl]        = useState('')

  if (!editor) return null

  function btn(
    onClick: () => void,
    icon: React.ReactNode,
    isActive?: boolean,
    title?: string
  ) {
    return (
      <button
        onClick={onClick}
        title={title}
        className={`
          w-8 h-8 flex items-center justify-center rounded-lg text-sm
          transition-colors
          ${isActive
            ? 'bg-[#1a1a1a] text-[#f0f0f0]'
            : 'text-[#888888] hover:text-[#f0f0f0] hover:bg-[#1a1a1a]'
          }
        `}
      >
        {icon}
      </button>
    )
  }

  function divider() {
    return <div className="w-px h-5 bg-[#262626] mx-1" />
  }

  function insertLink() {
    if (!linkUrl) return
    editor.chain().focus().setLink({ href: linkUrl }).run()
    setLinkUrl('')
    setShowLinkInput(false)
  }

  return (
    <>
      <div className="sticky top-0 z-10 bg-[#111111] border-b border-[#1a1a1a]
                      px-4 h-11 flex items-center gap-0.5 overflow-x-auto">

        {/* Block type */}
        <select
          className="h-7 px-2 text-xs text-[#888888] bg-[#1a1a1a]
                     border border-[#262626] rounded-lg mr-1 focus:outline-none
                     focus:border-[#3b82f6] cursor-pointer"
          onChange={(e) => {
            const val = e.target.value
            if (val === 'p')           editor.chain().focus().setParagraph().run()
            if (val === 'h1')          editor.chain().focus().toggleHeading({ level: 1 }).run()
            if (val === 'h2')          editor.chain().focus().toggleHeading({ level: 2 }).run()
            if (val === 'h3')          editor.chain().focus().toggleHeading({ level: 3 }).run()
            if (val === 'bullet')      editor.chain().focus().toggleBulletList().run()
            if (val === 'ordered')     editor.chain().focus().toggleOrderedList().run()
            if (val === 'blockquote')  editor.chain().focus().toggleBlockquote().run()
            if (val === 'codeblock')   editor.chain().focus().toggleCodeBlock().run()
          }}
          value={
            editor.isActive('heading', { level: 1 }) ? 'h1' :
            editor.isActive('heading', { level: 2 }) ? 'h2' :
            editor.isActive('heading', { level: 3 }) ? 'h3' :
            editor.isActive('bulletList')             ? 'bullet' :
            editor.isActive('orderedList')            ? 'ordered' :
            editor.isActive('blockquote')             ? 'blockquote' :
            editor.isActive('codeBlock')              ? 'codeblock' : 'p'
          }
        >
          <option value="p">Paragraph</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="bullet">Bullet List</option>
          <option value="ordered">Numbered List</option>
          <option value="blockquote">Blockquote</option>
          <option value="codeblock">Code Block</option>
        </select>

        {divider()}

        {/* Text formatting */}
        {btn(() => editor.chain().focus().toggleBold().run(),
          <Bold size={14} />, editor.isActive('bold'), 'Bold')}
        {btn(() => editor.chain().focus().toggleItalic().run(),
          <Italic size={14} />, editor.isActive('italic'), 'Italic')}
        {btn(() => editor.chain().focus().toggleUnderline().run(),
          <Underline size={14} />, editor.isActive('underline'), 'Underline')}
        {btn(() => editor.chain().focus().toggleStrike().run(),
          <Strikethrough size={14} />, editor.isActive('strike'), 'Strikethrough')}
        {btn(() => editor.chain().focus().toggleCode().run(),
          <Code size={14} />, editor.isActive('code'), 'Inline code')}

        {divider()}

        {/* Alignment */}
        {btn(() => editor.chain().focus().setTextAlign('left').run(),
          <AlignLeft size={14} />, editor.isActive({ textAlign: 'left' }), 'Align left')}
        {btn(() => editor.chain().focus().setTextAlign('center').run(),
          <AlignCenter size={14} />, editor.isActive({ textAlign: 'center' }), 'Align center')}
        {btn(() => editor.chain().focus().setTextAlign('right').run(),
          <AlignRight size={14} />, editor.isActive({ textAlign: 'right' }), 'Align right')}

        {divider()}

        {/* Media & Links */}
        {btn(() => setShowImageModal(true),
          <ImageIcon size={14} />, false, 'Insert image')}

        {btn(() => setShowLinkInput(!showLinkInput),
          <LinkIcon size={14} />, editor.isActive('link'), 'Insert link')}

        {btn(() => editor.chain().focus().setHorizontalRule().run(),
          <Minus size={14} />, false, 'Horizontal rule')}

        {divider()}

        {/* Highlight */}
        {btn(() => editor.chain().focus().toggleHighlight().run(),
          <Highlighter size={14} />, editor.isActive('highlight'), 'Highlight')}

        {divider()}

        {/* Undo / Redo */}
        {btn(() => editor.chain().focus().undo().run(),
          <Undo size={14} />, false, 'Undo')}
        {btn(() => editor.chain().focus().redo().run(),
          <Redo size={14} />, false, 'Redo')}
      </div>

      {/* Link input popover */}
      {showLinkInput && (
        <div className="flex items-center gap-2 px-4 py-2 bg-[#141414] border-b border-[#1a1a1a]">
          <input
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && insertLink()}
            placeholder="https://..."
            autoFocus
            className="flex-1 bg-[#1a1a1a] border border-[#262626] rounded-lg
                       px-3 py-1.5 text-xs text-[#f0f0f0] placeholder:text-[#4a4a4a]
                       focus:outline-none focus:border-[#3b82f6]"
          />
          <button
            onClick={insertLink}
            className="bg-[#3b82f6] text-white text-xs px-3 py-1.5 rounded-lg hover:bg-[#2563eb]"
          >
            Insert
          </button>
          <button
            onClick={() => setShowLinkInput(false)}
            className="text-[#888888] text-xs hover:text-[#f0f0f0]"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Image upload modal */}
      {showImageModal && (
        <ImageUploadModal
          onInsert={(url, alt) => {
            editor.chain().focus().setImage({ src: url, alt: alt || '' }).run()
            setShowImageModal(false)
          }}
          onClose={() => setShowImageModal(false)}
        />
      )}
    </>
  )
}
```

---

## 9. IMAGE UPLOAD MODAL

### `apps/web/components/admin/blog/ImageUploadModal.tsx`

```typescript
'use client'

import { useState, useRef } from 'react'
import { Upload, Link as LinkIcon, X } from 'lucide-react'

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
    const form = new FormData()
    form.append('image', file)
    const res  = await fetch('/api/blog/admin/image', { method: 'POST', body: form })
    const data = await res.json()
    setPreview(data.url)
    setUrl(data.url)
    setUploading(false)
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

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-semibold text-[#f0f0f0]">Insert Image</h3>
          <button onClick={onClose} className="text-[#888888] hover:text-[#f0f0f0]">
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-5 border-b border-[#1a1a1a]">
          {(['upload', 'url'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-xs font-medium capitalize border-b-2 -mb-px transition-colors ${
                tab === t
                  ? 'border-[#3b82f6] text-[#f0f0f0]'
                  : 'border-transparent text-[#888888] hover:text-[#f0f0f0]'
              }`}
            >
              {t === 'upload' ? 'Upload' : 'Paste URL'}
            </button>
          ))}
        </div>

        {/* Upload tab */}
        {tab === 'upload' && (
          <div className="space-y-4">
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onClick={() => fileRef.current?.click()}
              className={`
                h-32 border-2 border-dashed rounded-xl flex flex-col items-center
                justify-center cursor-pointer transition-colors
                ${dragging
                  ? 'border-[#3b82f6] bg-[#1d3a6e]/20'
                  : 'border-[#262626] hover:border-[#3b82f6] bg-[#0a0a0a]'
                }
              `}
            >
              {uploading ? (
                <div className="text-[#888888] text-xs">Uploading...</div>
              ) : preview ? (
                <img src={preview} className="h-full w-full object-contain rounded-xl p-2" />
              ) : (
                <>
                  <Upload size={20} className="text-[#4a4a4a] mb-2" />
                  <span className="text-xs text-[#888888]">Drop image or click to browse</span>
                  <span className="text-xs text-[#4a4a4a] mt-1">PNG, JPG, WEBP, GIF up to 10MB</span>
                </>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f) }}
            />
          </div>
        )}

        {/* URL tab */}
        {tab === 'url' && (
          <div className="space-y-3">
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/image.png"
              className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg
                         px-3 py-2.5 text-sm text-[#f0f0f0] placeholder:text-[#4a4a4a]
                         focus:outline-none focus:border-[#3b82f6]"
            />
            {url && (
              <img src={url} className="w-full h-32 object-contain rounded-lg bg-[#0a0a0a]" />
            )}
          </div>
        )}

        {/* Alt text */}
        <div className="mt-4 space-y-1">
          <label className="text-xs text-[#888888]">Alt text (optional)</label>
          <input
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
            placeholder="Describe the image..."
            className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg
                       px-3 py-2.5 text-sm text-[#f0f0f0] placeholder:text-[#4a4a4a]
                       focus:outline-none focus:border-[#3b82f6]"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-6">
          <button
            onClick={onClose}
            className="flex-1 bg-[#1a1a1a] hover:bg-[#222222] text-[#888888]
                       text-sm py-2.5 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => url && onInsert(url, alt)}
            disabled={!url}
            className="flex-1 bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-40
                       disabled:cursor-not-allowed text-white text-sm py-2.5
                       rounded-lg transition-colors"
          >
            Insert Image
          </button>
        </div>
      </div>
    </div>
  )
}
```

---

## 10. POST SETTINGS SIDEBAR

### `apps/web/components/admin/blog/PostSettings.tsx`

```typescript
'use client'

import { useState } from 'react'
import { X, Upload } from 'lucide-react'

interface PostSettingsProps {
  slug:         string
  excerpt:      string
  tags:         string[]
  coverImage:   string
  published:    boolean
  readTime:     number
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
    <aside className="w-80 border-l border-[#1a1a1a] bg-[#111111] overflow-y-auto p-5 space-y-6">

      {/* Status */}
      <section>
        <h4 className="text-xs uppercase tracking-widest text-[#4a4a4a] mb-3">Status</h4>
        <button
          onClick={() => props.onPublishedChange(!props.published)}
          className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg
                      border text-sm font-medium transition-colors ${
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
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadCover(f) }}
          />
          {props.coverImage ? (
            <div className="relative rounded-lg overflow-hidden">
              <img src={props.coverImage} className="w-full h-32 object-cover rounded-lg" />
              <button
                onClick={(e) => { e.preventDefault(); props.onCoverChange('') }}
                className="absolute top-2 right-2 bg-black/60 text-white
                           rounded-full w-6 h-6 flex items-center justify-center
                           hover:bg-black/80"
              >
                <X size={12} />
              </button>
            </div>
          ) : (
            <div className="h-24 border-2 border-dashed border-[#262626] hover:border-[#3b82f6]
                            rounded-lg flex flex-col items-center justify-center
                            text-[#4a4a4a] hover:text-[#888888] transition-colors">
              <Upload size={16} className="mb-1" />
              <span className="text-xs">Upload cover image</span>
            </div>
          )}
        </label>
      </section>

      {/* Excerpt */}
      <section>
        <h4 className="text-xs uppercase tracking-widest text-[#4a4a4a] mb-3">Excerpt</h4>
        <textarea
          value={props.excerpt}
          onChange={(e) => props.onExcerptChange(e.target.value)}
          placeholder="Short description for SEO and previews..."
          rows={3}
          maxLength={200}
          className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg
                     px-3 py-2.5 text-xs text-[#f0f0f0] placeholder:text-[#4a4a4a]
                     focus:outline-none focus:border-[#3b82f6] resize-none"
        />
        <p className="text-xs text-[#4a4a4a] mt-1 text-right">
          {props.excerpt.length} / 200
        </p>
      </section>

      {/* Slug */}
      <section>
        <h4 className="text-xs uppercase tracking-widest text-[#4a4a4a] mb-3">Slug</h4>
        <div className="flex items-center gap-0 bg-[#0a0a0a] border border-[#262626]
                        rounded-lg overflow-hidden focus-within:border-[#3b82f6]">
          <span className="text-xs text-[#4a4a4a] pl-3 flex-shrink-0">/blog/</span>
          <input
            value={props.slug}
            onChange={(e) => props.onSlugChange(e.target.value)}
            className="flex-1 bg-transparent px-2 py-2.5 text-xs text-[#f0f0f0]
                       focus:outline-none min-w-0"
          />
        </div>
      </section>

      {/* Tags */}
      <section>
        <h4 className="text-xs uppercase tracking-widest text-[#4a4a4a] mb-3">Tags</h4>
        <input
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={addTag}
          placeholder="Type tag and press Enter..."
          className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg
                     px-3 py-2.5 text-xs text-[#f0f0f0] placeholder:text-[#4a4a4a]
                     focus:outline-none focus:border-[#3b82f6]"
        />
        {props.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {props.tags.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 bg-[#1a1a1a] border border-[#262626]
                           text-[#888888] text-xs px-2.5 py-1 rounded-full"
              >
                {tag}
                <button
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
```

---

## 11. EDITOR PAGE

### `apps/web/app/(admin)/admin/blog/new/page.tsx`

```typescript
'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useDebouncedCallback } from 'use-debounce'
import { ArrowLeft, Eye } from 'lucide-react'
import BlogEditor   from '@/components/admin/blog/BlogEditor'
import PostSettings from '@/components/admin/blog/PostSettings'

function generateSlug(title: string): string {
  return title.toLowerCase().trim()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 80)
}

function estimateReadTime(html: string): number {
  const text  = html.replace(/<[^>]*>/g, '')
  const words = text.trim().split(/\s+/).length
  return Math.max(1, Math.ceil(words / 200))
}

export default function NewPostPage() {
  const router = useRouter()

  const [title,     setTitle]     = useState('')
  const [content,   setContent]   = useState('')
  const [slug,      setSlug]      = useState('')
  const [excerpt,   setExcerpt]   = useState('')
  const [tags,      setTags]      = useState<string[]>([])
  const [cover,     setCover]     = useState('')
  const [published, setPublished] = useState(false)
  const [readTime,  setReadTime]  = useState(1)
  const [saveStatus, setSaveStatus] = useState<'idle'|'saving'|'saved'>('idle')
  const [postId,    setPostId]    = useState<string | null>(null)

  function handleTitleChange(value: string) {
    setTitle(value)
    if (!slug || slug === generateSlug(title)) {
      setSlug(generateSlug(value))
    }
  }

  function handleContentChange(html: string) {
    setContent(html)
    setReadTime(estimateReadTime(html))
    autoSave({ title, content: html, slug, excerpt, tags, coverImage: cover, published, readTime })
  }

  const autoSave = useDebouncedCallback(async (data) => {
    setSaveStatus('saving')
    try {
      const method = postId ? 'PUT' : 'POST'
      const url    = postId ? `/api/blog/admin/${postId}` : '/api/blog/admin'
      const res    = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, published: false }),
      })
      const saved = await res.json()
      if (!postId) setPostId(saved.id)
      setSaveStatus('saved')
    } catch {
      setSaveStatus('idle')
    }
  }, 3000)

  async function handlePublish() {
    const method = postId ? 'PUT' : 'POST'
    const url    = postId ? `/api/blog/admin/${postId}` : '/api/blog/admin'
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title, slug, excerpt, content,
        coverImage: cover, published: true,
        tags, readTime,
      }),
    })
    router.push('/admin/blog')
  }

  async function handleSaveDraft() {
    const method = postId ? 'PUT' : 'POST'
    const url    = postId ? `/api/blog/admin/${postId}` : '/api/blog/admin'
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title, slug, excerpt, content,
        coverImage: cover, published: false,
        tags, readTime,
      }),
    })
    setSaveStatus('saved')
  }

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0a] overflow-hidden">

      {/* Top bar */}
      <div className="h-13 flex items-center justify-between px-5
                      border-b border-[#1a1a1a] bg-[#111111] flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/admin/blog')}
            className="flex items-center gap-1.5 text-[#888888] hover:text-[#f0f0f0]
                       text-xs transition-colors"
          >
            <ArrowLeft size={14} />
            Back
          </button>
          <span className="text-[#262626]">/</span>
          <span className="text-xs text-[#888888]">New Post</span>
        </div>

        <span className="text-xs font-mono text-[#4a4a4a]">
          {saveStatus === 'saving' && '○ Saving...'}
          {saveStatus === 'saved'  && '● Saved'}
        </span>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.open(`/blog/${slug}`, '_blank')}
            className="flex items-center gap-1.5 text-xs text-[#888888]
                       hover:text-[#f0f0f0] transition-colors px-3 py-1.5"
          >
            <Eye size={13} />
            Preview
          </button>
          <button
            onClick={handleSaveDraft}
            className="text-xs text-[#888888] hover:text-[#f0f0f0] border
                       border-[#262626] px-3 py-1.5 rounded-lg transition-colors"
          >
            Save Draft
          </button>
          <button
            onClick={handlePublish}
            className="text-xs text-white bg-[#3b82f6] hover:bg-[#2563eb]
                       px-4 py-1.5 rounded-lg transition-colors font-medium"
          >
            Publish →
          </button>
        </div>
      </div>

      {/* Title input */}
      <div className="px-8 pt-10 pb-2 max-w-3xl mx-auto w-full flex-shrink-0">
        <input
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Post title..."
          autoFocus
          className="w-full bg-transparent text-[#f0f0f0] text-4xl font-semibold
                     placeholder:text-[#2a2a2a] focus:outline-none"
        />
      </div>

      {/* Main content + sidebar */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-hidden">
          <BlogEditor content={content} onChange={handleContentChange} />
        </div>
        <PostSettings
          slug={slug}           excerpt={excerpt}
          tags={tags}           coverImage={cover}
          published={published} readTime={readTime}
          onSlugChange={setSlug}
          onExcerptChange={setExcerpt}
          onTagsChange={setTags}
          onCoverChange={setCover}
          onPublishedChange={setPublished}
        />
      </div>

    </div>
  )
}
```

---

## 12. EDITOR STYLES

### Add to `apps/web/app/globals.css`:

```css
/* ─── Tiptap Blog Editor Styles ─────────────────────────── */

.tiptap {
  min-height: 60vh;
  outline: none;
  font-family: 'Geist', sans-serif;
  font-size: 16px;
  line-height: 1.8;
  color: #d4d4d4;
}
.tiptap h1 { font-size: 32px; font-weight: 700; color: #f5f5f5; margin: 32px 0 16px; letter-spacing: -0.02em; }
.tiptap h2 { font-size: 24px; font-weight: 600; color: #f0f0f0; margin: 28px 0 12px; }
.tiptap h3 { font-size: 20px; font-weight: 600; color: #ebebeb; margin: 24px 0 10px; }
.tiptap p  { margin: 0 0 16px; }
.tiptap ul, .tiptap ol { padding-left: 24px; margin-bottom: 16px; }
.tiptap li { margin: 6px 0; }
.tiptap ul li { list-style: disc; }
.tiptap ol li { list-style: decimal; }
.tiptap blockquote {
  border-left: 3px solid #3b82f6;
  padding: 4px 0 4px 20px;
  margin: 24px 0;
  color: #888888;
  font-style: italic;
}
.tiptap code {
  background: #1a1a1a;
  border: 1px solid #262626;
  border-radius: 4px;
  padding: 2px 6px;
  font-family: 'Geist Mono', monospace;
  font-size: 13px;
  color: #a78bfa;
}
.tiptap pre {
  background: #111111;
  border: 1px solid #1f1f1f;
  border-radius: 8px;
  padding: 20px;
  margin: 24px 0;
  overflow-x: auto;
}
.tiptap pre code {
  background: none;
  border: none;
  padding: 0;
  color: #e2e8f0;
  font-size: 13px;
  line-height: 1.7;
}
.tiptap img {
  max-width: 100%;
  border-radius: 8px;
  margin: 24px auto;
  display: block;
  border: 1px solid #1f1f1f;
}
.tiptap a { color: #3b82f6; text-decoration: underline; text-underline-offset: 3px; }
.tiptap hr { border: none; border-top: 1px solid #1f1f1f; margin: 32px 0; }
.tiptap mark { background: rgba(251,191,36,0.2); border-radius: 3px; padding: 1px 3px; color: #fbbf24; }
.tiptap p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  color: #2a2a2a;
  pointer-events: none;
  float: left;
  height: 0;
}
.tiptap .selectedNode { outline: 2px solid #3b82f6; border-radius: 4px; }
```

---

## 13. PUBLIC BLOG PAGES

### Blog Index — `app/(marketing)/blog/page.tsx`

```typescript
import { Metadata } from 'next'
import Navbar   from '@/components/marketing/Navbar'
import Footer   from '@/components/marketing/Footer'
import BlogCard from '@/components/marketing/BlogCard'

export const metadata: Metadata = {
  title: 'Blog — VIAN by Viren',
  description: 'Thoughts, tutorials and updates from Viren.',
}

async function getPosts() {
  const res = await fetch(`${process.env.API_URL}/api/blog`, {
    next: { revalidate: 60 },
  })
  return res.json()
}

export default async function BlogPage() {
  const posts = await getPosts()
  const [featured, ...rest] = posts

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navbar />
      <main className="pt-32 pb-24 px-6 max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-14">
          <h1 className="text-5xl font-semibold text-[#f0f0f0]">Blog</h1>
          <p className="text-[#888888] text-base mt-3">
            Thoughts, tutorials and updates from Viren.
          </p>
        </div>

        {/* Featured post */}
        {featured && (
          <a href={`/blog/${featured.slug}`} className="block group mb-8">
            <div className="bg-[#111111] border border-[#1a1a1a] hover:border-[#262626]
                            rounded-2xl overflow-hidden transition-colors">
              {featured.coverImage && (
                <img
                  src={featured.coverImage}
                  alt={featured.title}
                  className="w-full h-64 object-cover"
                />
              )}
              <div className="p-8">
                <div className="flex gap-2 flex-wrap mb-4">
                  {featured.tags?.map((tag: any) => (
                    <span key={tag.name}
                      className="text-xs text-[#3b82f6] bg-[#1d3a6e]/30
                                 px-2.5 py-1 rounded-full">
                      {tag.name}
                    </span>
                  ))}
                </div>
                <h2 className="text-2xl font-semibold text-[#f0f0f0]
                               group-hover:text-white transition-colors">
                  {featured.title}
                </h2>
                <p className="text-[#888888] text-sm leading-relaxed mt-3 line-clamp-2">
                  {featured.excerpt}
                </p>
                <p className="text-xs text-[#4a4a4a] mt-5 font-mono">
                  Viren · {new Date(featured.publishedAt).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'short', day: 'numeric'
                  })} · {featured.readTime} min read
                </p>
              </div>
            </div>
          </a>
        )}

        {/* Remaining posts */}
        <div className="grid md:grid-cols-2 gap-4">
          {rest.map((post: any) => <BlogCard key={post.id} post={post} />)}
        </div>

      </main>
      <Footer />
    </div>
  )
}
```

---

## 14. SUCCESS CHECKLIST

```
□ Tiptap editor renders in /admin/blog/new
□ Bold / Italic / Underline / Strikethrough work
□ Inline code works
□ Heading 1, 2, 3 work via dropdown
□ Bullet list and numbered list work
□ Blockquote works
□ Code block with syntax highlighting works
□ Align left / center / right work
□ Highlight works (yellow tint)
□ Horizontal rule inserts correctly
□ Link button shows URL input, inserts clickable link
□ Image button opens ImageUploadModal
□ Image upload tab: drag & drop works, file picker works
□ Image URL tab: paste URL, preview shows, inserts into editor
□ Image appears correctly in editor after insert
□ Cover image uploads in sidebar, preview shows, remove works
□ Excerpt textarea with 200 char counter works
□ Slug auto-generates from title as user types
□ Slug is manually editable in sidebar
□ Tags: type + Enter adds chip, × removes chip
□ Read time auto-calculates and updates as user types
□ Auto-save fires 3s after last change, shows "● Saved"
□ "Save Draft" button saves without publishing
□ "Publish →" button publishes and redirects to /admin/blog
□ /admin/blog lists all posts with Draft/Published badges
□ Edit existing post loads all content back into editor correctly
□ Delete post removes it from list
□ /blog shows all published posts — featured + grid
□ /blog/[slug] renders full post with correct dark styles
□ Cover image shows on blog index card and post page
□ Tags show as chips on post page
□ Unpublished posts return 404 at /blog/[slug]
□ All Tiptap CSS styles render correctly on public post page
```

---

*VIAN Blog System — Built by Viren. Zero compromise.*