'use client'

import { Editor } from '@tiptap/react'
import { useState } from 'react'
import {
  Bold, Italic, Underline, Strikethrough,
  Code, AlignLeft, AlignCenter, AlignRight,
  Image as ImageIcon, Link as LinkIcon,
  Minus, Highlighter, Undo, Redo,
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
        type="button"
        onClick={onClick}
        title={title}
        className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm transition-colors ${
          isActive
            ? 'bg-[#1a1a1a] text-[#f0f0f0]'
            : 'text-[#888888] hover:text-[#f0f0f0] hover:bg-[#1a1a1a]'
        }`}
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
          className="h-7 px-2 text-xs text-[#888888] bg-[#1a1a1a] border border-[#262626]
                     rounded-lg mr-1 focus:outline-none focus:border-[#3b82f6] cursor-pointer"
          onChange={(e) => {
            const v = e.target.value
            if (v === 'p')          editor.chain().focus().setParagraph().run()
            if (v === 'h1')         editor.chain().focus().toggleHeading({ level: 1 }).run()
            if (v === 'h2')         editor.chain().focus().toggleHeading({ level: 2 }).run()
            if (v === 'h3')         editor.chain().focus().toggleHeading({ level: 3 }).run()
            if (v === 'bullet')     editor.chain().focus().toggleBulletList().run()
            if (v === 'ordered')    editor.chain().focus().toggleOrderedList().run()
            if (v === 'blockquote') editor.chain().focus().toggleBlockquote().run()
            if (v === 'codeblock')  editor.chain().focus().toggleCodeBlock().run()
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
        {btn(() => editor.chain().focus().toggleBold().run(),      <Bold size={14} />,          editor.isActive('bold'),        'Bold')}
        {btn(() => editor.chain().focus().toggleItalic().run(),    <Italic size={14} />,        editor.isActive('italic'),      'Italic')}
        {btn(() => editor.chain().focus().toggleUnderline().run(), <Underline size={14} />,     editor.isActive('underline'),   'Underline')}
        {btn(() => editor.chain().focus().toggleStrike().run(),    <Strikethrough size={14} />, editor.isActive('strike'),      'Strikethrough')}
        {btn(() => editor.chain().focus().toggleCode().run(),      <Code size={14} />,          editor.isActive('code'),        'Inline code')}

        {divider()}
        {btn(() => editor.chain().focus().setTextAlign('left').run(),   <AlignLeft size={14} />,   editor.isActive({ textAlign: 'left' }),   'Align left')}
        {btn(() => editor.chain().focus().setTextAlign('center').run(), <AlignCenter size={14} />, editor.isActive({ textAlign: 'center' }), 'Align center')}
        {btn(() => editor.chain().focus().setTextAlign('right').run(),  <AlignRight size={14} />,  editor.isActive({ textAlign: 'right' }),  'Align right')}

        {divider()}
        {btn(() => setShowImageModal(true),                               <ImageIcon size={14} />,   false,                           'Insert image')}
        {btn(() => setShowLinkInput(!showLinkInput),                      <LinkIcon size={14} />,    editor.isActive('link'),         'Insert link')}
        {btn(() => editor.chain().focus().setHorizontalRule().run(),      <Minus size={14} />,       false,                           'Horizontal rule')}

        {divider()}
        {btn(() => editor.chain().focus().toggleHighlight().run(), <Highlighter size={14} />, editor.isActive('highlight'), 'Highlight')}

        {divider()}
        {btn(() => editor.chain().focus().undo().run(), <Undo size={14} />, false, 'Undo')}
        {btn(() => editor.chain().focus().redo().run(), <Redo size={14} />, false, 'Redo')}
      </div>

      {/* Link input */}
      {showLinkInput && (
        <div className="flex items-center gap-2 px-4 py-2 bg-[#141414] border-b border-[#1a1a1a]">
          <input
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && insertLink()}
            placeholder="https://..."
            autoFocus
            className="flex-1 bg-[#1a1a1a] border border-[#262626] rounded-lg px-3 py-1.5
                       text-xs text-[#f0f0f0] placeholder:text-[#4a4a4a] focus:outline-none
                       focus:border-[#3b82f6]"
          />
          <button type="button" onClick={insertLink}
            className="bg-[#3b82f6] text-white text-xs px-3 py-1.5 rounded-lg hover:bg-[#2563eb]">
            Insert
          </button>
          <button type="button" onClick={() => setShowLinkInput(false)}
            className="text-[#888888] text-xs hover:text-[#f0f0f0]">
            Cancel
          </button>
        </div>
      )}

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
