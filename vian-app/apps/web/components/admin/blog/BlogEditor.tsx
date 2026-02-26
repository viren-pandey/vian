'use client'

import { useEditor, EditorContent, type Editor } from '@tiptap/react'
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
    immediatelyRender: false,
    onUpdate: ({ editor }: { editor: Editor }) => onChange(editor.getHTML()),
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
