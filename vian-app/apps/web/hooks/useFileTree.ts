import { useMemo } from 'react'
import { buildFileTree } from '@/lib/utils'
import type { GeneratedFile, FileNode } from '@vian/shared-types'

export function useFileTree(rawFiles: GeneratedFile[]): FileNode[] {
  return useMemo(() => buildFileTree(rawFiles), [rawFiles])
}
