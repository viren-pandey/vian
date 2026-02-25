import { useEffect, useRef, useState, useCallback } from 'react'
import { useProjectStore } from '@/stores/projectStore'

type ContainerStatus = 'idle' | 'booting' | 'installing' | 'running' | 'error'

export function useWebContainer() {
  const containerRef = useRef<any | null>(null)
  const bootedRef = useRef(false)
  const [status, setStatus] = useState<ContainerStatus>('idle')
  const [logs, setLogs] = useState<string[]>([])
  const { setPreviewUrl } = useProjectStore()

  const addLog = useCallback((line: string) => {
    setLogs((prev) => [...prev.slice(-300), line])
  }, [])

  // Teardown on unmount
  useEffect(() => {
    return () => { containerRef.current?.teardown() }
  }, [])

  const boot = useCallback(async (flatFiles: Record<string, string>) => {
    if (bootedRef.current || containerRef.current) {
      containerRef.current?.teardown()
      containerRef.current = null
      bootedRef.current = false
    }

    setStatus('booting')
    setPreviewUrl(null)
    setLogs([])
    addLog('~/project')
    addLog('> Booting sandbox...')

    try {
      const { WebContainer } = await import('@webcontainer/api')
      const container = await WebContainer.boot()
      containerRef.current = container
      bootedRef.current = true

      // Generated Vite apps have files at root (package.json, src/App.tsx, etc.)
      // Use the flat files as-is — no path transformation needed.
      const webFiles: Record<string, string> = { ...flatFiles }

      addLog(`> Mounting ${Object.keys(webFiles).length} files...`)

      // Build WebContainer fs tree from flat { path: content } map
      const fsTree: Record<string, any> = {}
      for (const [filePath, content] of Object.entries(webFiles)) {
        const parts = filePath.split('/')
        let node = fsTree
        for (let i = 0; i < parts.length - 1; i++) {
          node[parts[i]] = node[parts[i]] ?? { directory: {} }
          node = node[parts[i]].directory
        }
        node[parts[parts.length - 1]] = { file: { contents: content } }
      }

      await container.mount(fsTree)

      // ── Install ───────────────────────────────────────────────────────────
      setStatus('installing')
      addLog('> npm install')
      const installProc = await container.spawn('npm', ['install'])
      installProc.output.pipeTo(new WritableStream({
        write(chunk: string) {
          chunk.split('\n').filter(Boolean).forEach((l: string) => addLog(l))
        },
      }))
      const installCode = await installProc.exit
      if (installCode !== 0) throw new Error(`npm install failed (exit ${installCode})`)

      // ── Dev server ────────────────────────────────────────────────────────
      setStatus('running')
      addLog('> npm run dev')

      // Register server-ready BEFORE spawning — must not miss the event
      container.on('server-ready', (_port: number, serverUrl: string) => {
        addLog(`✓ Ready → ${serverUrl}`)
        setPreviewUrl(serverUrl)
      })

      const devProc = await container.spawn('npm', ['run', 'dev'])
      devProc.output.pipeTo(new WritableStream({
        write(chunk: string) {
          chunk.split('\n').filter(Boolean).forEach((l: string) => addLog(l))
        },
      }))
    } catch (err: any) {
      console.error('[WebContainer]', err)
      addLog(`✗ ${err?.message ?? 'WebContainer failed'}`)
      setStatus('error')
    }
  }, [setPreviewUrl, addLog])

  const teardown = useCallback(() => {
    containerRef.current?.teardown()
    containerRef.current = null
    bootedRef.current = false
    setStatus('idle')
    setPreviewUrl(null)
    setLogs([])
  }, [setPreviewUrl])

  return { boot, status, logs, teardown }
}
