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
  if (ext.endsWith('.tsx') || ext.endsWith('.jsx')) return { label: 'R',  color: '#61dafb' }
  if (ext.endsWith('.ts'))                           return { label: 'TS', color: '#3178c6' }
  if (ext.endsWith('.js'))                           return { label: 'JS', color: '#f7df1e' }
  if (ext.endsWith('.css'))                          return { label: '#',  color: '#42a5f5' }
  if (ext.endsWith('.html'))                         return { label: '<>', color: '#e44d26' }
  if (ext.endsWith('.svg'))                          return { label: '◈',  color: '#ff9800' }
  if (ext.endsWith('.md'))                           return { label: '↓',  color: '#78909c' }
  if (ext.endsWith('.json'))                         return { label: '{}', color: '#ffa726' }
  if (ext.includes('.env'))                          return { label: '⚙',  color: '#ecc94b' }
  if (ext.endsWith('.png') || ext.endsWith('.jpg') ||
      ext.endsWith('.jpeg') || ext.endsWith('.webp')) return { label: '▣', color: '#26a69a' }
  return { label: '·', color: '#777' }
}

function getFolderColor(name: string): string {
  const n = name.toLowerCase()
  if (n === 'app')                        return '#3b82f6'
  if (n === 'components')                 return '#a78bfa'
  if (n === 'lib')                        return '#34d399'
  if (n === 'hooks')                      return '#fb923c'
  if (n === 'api')                        return '#38bdf8'
  if (n === 'actions')                    return '#f472b6'
  if (n === 'styles')                     return '#60a5fa'
  if (n === 'public')                     return '#4ade80'
  if (n === 'types')                      return '#c084fc'
  if (n === 'store' || n === 'stores')    return '#fbbf24'
  if (n === 'utils')                      return '#34d399'
  if (n === 'server')                     return '#f87171'
  if (n === 'pages')                      return '#818cf8'
  if (n === 'middleware')                 return '#f59e0b'
  return '#6b7280'
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
  if (status === 'generating') return <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block animate-pulse-dot" />
  if (status === 'complete')   return <span className="text-green-400 text-[10px] font-bold leading-none">✓</span>
  if (status === 'error')      return <span className="text-red-400 text-[10px] font-bold leading-none">✗</span>
  return <span className="w-1.5 h-1.5 rounded-full border border-[#444] inline-block" />
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
            ? 'bg-[#1d3557] text-white'
            : 'text-[#c0c0c0] hover:bg-[#1f1f1f] hover:text-white'
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
    <div className="flex-1 overflow-y-auto py-2">
      <div className="px-4 mb-2 flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-[#444]">Explorer</span>
        <span className="text-[10px] text-[#3b3b3b]">{Object.keys(files).length} files</span>
      </div>
      {tree.map((node) => (
        <FileItem key={node.path} node={node} depth={0} />
      ))}
    </div>
  )
}
