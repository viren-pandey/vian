import type { FileNode, GeneratedFile } from '@vian/shared-types'

/**
 * Converts a flat list of GeneratedFile into a nested FileNode tree
 * for rendering in the FileExplorer component.
 */
export function buildFileTree(files: GeneratedFile[]): FileNode[] {
  const root: FileNode[] = []

  for (const file of files) {
    const parts = file.path.split('/')
    let currentLevel = root

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      const isLast = i === parts.length - 1
      const existingNode = currentLevel.find((n) => n.name === part)

      if (existingNode) {
        if (!isLast && existingNode.children) {
          currentLevel = existingNode.children
        }
      } else {
        const newNode: FileNode = {
          name: part,
          path: parts.slice(0, i + 1).join('/'),
          isDirectory: !isLast,
          status: 'complete',
          children: !isLast ? [] : undefined,
        }
        currentLevel.push(newNode)
        if (!isLast && newNode.children) {
          currentLevel = newNode.children
        }
      }
    }
  }

  return sortTree(root)
}

function sortTree(nodes: FileNode[]): FileNode[] {
  return nodes
    .sort((a, b) => {
      // Directories first, then alphabetical
      if (a.isDirectory && !b.isDirectory) return -1
      if (!a.isDirectory && b.isDirectory) return 1
      return a.name.localeCompare(b.name)
    })
    .map((node) => ({
      ...node,
      children: node.children ? sortTree(node.children) : undefined,
    }))
}

export function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(' ')
}
