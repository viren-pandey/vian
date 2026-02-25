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
        node = {
          name,
          path: parts.slice(0, i + 1).join('/'),
          isDir: !isLast,
          children: [],
          status: isLast ? file.status : 'complete',
        }
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

function StatusDot({ status }: { status: FileStatus }) {
  if (status === 'generating') {
    return <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block animate-pulse-dot" title="Generating…" />
  }
  if (status === 'complete') {
    return <span className="text-success text-2xs leading-none" title="Complete">✓</span>
  }
  if (status === 'error') {
    return <span className="text-vian-error text-2xs leading-none" title="Error">✗</span>
  }
  return <span className="w-1.5 h-1.5 rounded-full border border-text-muted/40 inline-block" title="Queued" />
}

function FileItem({
  node,
  depth,
}: {
  node: TreeNode
  depth: number
}) {
  const [open, setOpen] = useState(depth < 2)
  const { setActiveFile, activeFile } = useProjectStore()

  const isActive = !node.isDir && node.path === activeFile

  return (
    <div className="animate-file-appear">
      <div
        onClick={() => node.isDir ? setOpen((v) => !v) : setActiveFile(node.path)}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        className={clsx(
          'flex items-center gap-2 h-7 pr-2 text-xs cursor-pointer select-none rounded-sm transition-colors',
          isActive
            ? 'bg-elevated text-text-primary'
            : 'text-text-secondary hover:bg-elevated/60 hover:text-text-primary'
        )}
      >
        {/* Expand chevron or indent */}
        <span className="text-2xs w-3 text-center flex-shrink-0 text-text-muted">
          {node.isDir ? (open ? '▾' : '▸') : ''}
        </span>
        <span className="truncate flex-1 font-code text-xs">{node.name}</span>
        {!node.isDir && (
          <span className="flex-shrink-0 w-4 flex justify-center">
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

export default function FileExplorer() {
  const { files } = useProjectStore()
  const tree = buildTree(files)

  if (Object.keys(files).length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <p className="text-2xs text-text-muted text-center font-ui leading-relaxed">
          Files will appear here as they are generated
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto py-2">
      <div className="px-3 mb-1 text-2xs font-semibold uppercase tracking-widest text-text-muted font-ui">
        Explorer
      </div>
      {tree.map((node) => (
        <FileItem key={node.path} node={node} depth={0} />
      ))}
    </div>
  )
}
