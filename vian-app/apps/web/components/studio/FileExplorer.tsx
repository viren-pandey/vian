'use client'

import { useState } from 'react'
import clsx from 'clsx'
import { useProjectStore, type FileNode } from '@/stores/projectStore'

type FileStatus = FileNode['status']

interface TreeNode {
  name: string
  path: string
  isDir: boolean
  children: TreeNode[]
  status: FileStatus
}

// ── File / folder icon helpers ─────────────────────────────────────────────
function getFileIcon(name: string): { label: string; color: string } {
  const ext = name.toLowerCase()
  if (ext.endsWith('.tsx') || ext.endsWith('.jsx')) return { label: 'R',  color: '#3b82f6' }
  if (ext.endsWith('.ts'))                           return { label: 'TS', color: '#3b82f6' }
  if (ext.endsWith('.js'))                           return { label: 'JS', color: '#f59e0b' }
  if (ext.endsWith('.css'))                          return { label: '#',  color: '#a78bfa' }
  if (ext.endsWith('.html'))                         return { label: '<>', color: '#e44d26' }
  if (ext.endsWith('.svg'))                          return { label: '◈',  color: '#ff9800' }
  if (ext.endsWith('.md'))                           return { label: '↓',  color: '#78909c' }
  if (ext.endsWith('.json'))                         return { label: '{}', color: '#888' }
  if (ext.includes('.env'))                          return { label: '⚙',  color: '#ecc94b' }
  if (ext.endsWith('.png') || ext.endsWith('.jpg') ||
      ext.endsWith('.jpeg') || ext.endsWith('.webp')) return { label: '▣', color: '#26a69a' }
  return { label: '·', color: '#777' }
}

function getFolderColor(name: string): string {
  // All folders use orange theme
  return '#f97316'
}

function FolderIcon({ open, color }: { open: boolean; color: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill={color} className="flex-shrink-0" style={{ opacity: open ? 1 : 0.8 }}>
      {open
        ? <path d="M20 8H12L10 6H4C2.9 6 2 6.9 2 8V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V10C22 8.9 21.1 8 20 8Z"/>
        : <path d="M20 8H12L10 6H4C2.9 6 2 6.9 2 8V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V10C22 8.9 21.1 8 20 8Z" opacity="0.7"/>}
    </svg>
  )
}

// ── Status indicator ───────────────────────────────────────────────────────
function StatusDot({ status }: { status: FileStatus }) {
  if (status === 'queued') 
    return <span className="w-1.5 h-1.5 rounded-full border border-[#333] inline-block" />
  
  if (status === 'generating') 
    return (
      <span 
        className="w-2 h-2 rounded-full bg-[#3b82f6] inline-block"
        style={{ animation: 'antenna-pulse 1s ease-in-out infinite' }}
      />
    )
  
  if (status === 'complete')
    return (
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <circle cx="6" cy="6" r="5" stroke="#22c55e" strokeWidth="1.5" />
        <path d="M3.5 6l2 2 3-3" stroke="#22c55e" strokeWidth="1.5"
              strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  
  if (status === 'error')
    return (
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <circle cx="6" cy="6" r="5" stroke="#ef4444" strokeWidth="1.5" />
        <path d="M4 4l4 4M8 4l-4 4" stroke="#ef4444" strokeWidth="1.5"
              strokeLinecap="round" />
      </svg>
    )
  
  return null
}

// ── Tree item ──────────────────────────────────────────────────────────────
function FileItem({ node, depth }: { node: TreeNode; depth: number }) {
  const [open, setOpen] = useState(depth < 2)
  const { setActiveFile, activeFile } = useProjectStore()
  const isActive = !node.isDir && node.path === activeFile
  const folderColor = node.isDir ? getFolderColor(node.name) : ''
  const fileIcon = !node.isDir ? getFileIcon(node.name) : null

  return (
    <div className="animate-file-appear">
      <div
        onClick={() => (node.isDir ? setOpen((v) => !v) : setActiveFile(node.path))}
        style={{ paddingLeft: `${depth * 14 + 4}px` }}
        className={clsx(
          'group flex items-center gap-1.5 h-7 pr-2 cursor-pointer select-none rounded mx-1 transition-colors',
          isActive
            ? 'bg-[rgba(180,80,20,0.15)] text-white border-l-[3px] border-[#f97316]'
            : 'text-[#c0c0c0] hover:bg-[#1f1f1f] hover:text-white border-l-[3px] border-transparent'
        )}
      >
        {/* Chevron for folders */}
        <span className="w-3 flex-shrink-0 flex items-center justify-center text-[10px] text-[#555]">
          {node.isDir ? (open ? '▾' : '▸') : ''}
        </span>

        {/* Icon */}
        {node.isDir ? (
          <FolderIcon open={open} color={folderColor} />
        ) : (
          <span
            style={{ color: fileIcon!.color, fontFamily: 'monospace' }}
            className="text-[9px] font-bold w-[14px] text-center flex-shrink-0 leading-none"
          >
            {fileIcon!.label}
          </span>
        )}

        {/* Name */}
        <span className="truncate flex-1 text-[13px] font-mono leading-none tracking-tight">
          {node.name}
        </span>

        {/* Status badge */}
        {!node.isDir && (
          <span className="flex-shrink-0 w-4 flex justify-center opacity-60 group-hover:opacity-100 transition-opacity">
            <StatusDot status={node.status} />
          </span>
        )}
      </div>

      {node.isDir && open && (
        <div>
          {node.children.map((child) => (
            <FileItem key={child.path} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Tree builder ───────────────────────────────────────────────────────────
function buildTree(files: Record<string, FileNode>): TreeNode[] {
  const root: TreeNode[] = []
  for (const file of Object.values(files)) {
    const parts = file.path.split('/')
    let level = root
    for (let i = 0; i < parts.length; i++) {
      const name = parts[i]
      const isLast = i === parts.length - 1
      let node = level.find((n) => n.name === name)
      if (!node) {
        node = { name, path: parts.slice(0, i + 1).join('/'), isDir: !isLast, children: [], status: isLast ? file.status : 'complete' }
        level.push(node)
      } else if (isLast) {
        node.status = file.status
      }
      level = node.children
    }
  }
  return sortNodes(root)
}

function sortNodes(nodes: TreeNode[]): TreeNode[] {
  return nodes
    .sort((a, b) => {
      if (a.isDir && !b.isDir) return -1
      if (!a.isDir && b.isDir) return 1
      return a.name.localeCompare(b.name)
    })
    .map((n) => ({ ...n, children: sortNodes(n.children) }))
}

// ── Main export ────────────────────────────────────────────────────────────
export default function FileExplorer() {
  const { files } = useProjectStore()
  const tree = buildTree(files)

  if (Object.keys(files).length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-3 text-center">
        <div className="w-12 h-12 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center text-2xl">
          📁
        </div>
        <p className="text-[12px] text-[#555] leading-relaxed max-w-[140px]">
          Files appear here as they&apos;re generated
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="h-11 flex items-center justify-between px-4 border-b border-[#1a1a1a] flex-shrink-0">
        <div className="flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-[#3b82f6]">
            <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
            <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
            <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
            <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
          </svg>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#888]">EXPLORER</span>
        </div>
      </div>

      {/* File tree */}
      <div className="flex-1 overflow-y-auto py-2">
        {tree.map((node) => (
          <FileItem key={node.path} node={node} depth={0} />
        ))}
      </div>
    </div>
  )
}
