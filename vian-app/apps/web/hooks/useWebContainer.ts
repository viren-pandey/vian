import { useEffect, useRef, useState, useCallback } from 'react'
import { useProjectStore } from '@/stores/projectStore'

type ContainerStatus = 'idle' | 'booting' | 'installing' | 'running' | 'error'

export function useWebContainer() {
  const containerRef = useRef<any | null>(null)
  const bootedRef    = useRef(false)
  const devStartedRef = useRef(false)
  const [status, setStatus] = useState<ContainerStatus>('idle')
  const [logs, setLogs]     = useState<string[]>([])
  const { setPreviewUrl }   = useProjectStore()

  const addLog = useCallback((line: string) => {
    setLogs((prev) => [...prev.slice(-300), line])
  }, [])

  useEffect(() => {
    return () => { containerRef.current?.teardown() }
  }, [])

  // Boot the WebContainer once -- idempotent
  const ensureBooted = useCallback(async () => {
    if (bootedRef.current && containerRef.current) return containerRef.current as any

    if (status !== 'booting') setStatus('booting')
    addLog('> Booting sandbox...')

    const { WebContainer } = await import('@webcontainer/api')
    const container = await WebContainer.boot()
    containerRef.current = container
    bootedRef.current    = true
    devStartedRef.current = false
    addLog('> Sandbox ready')
    return container as any
  }, [status, addLog])

  // Write a single file into the running container (creates parent dirs)
  const writeFile = useCallback(async (filePath: string, content: string) => {
    const container = await ensureBooted()
    const parts = filePath.split('/')
    if (parts.length > 1) {
      const dir = parts.slice(0, -1).join('/')
      await container.fs.mkdir(dir, { recursive: true }).catch(() => {})
    }
    await container.fs.writeFile(filePath, content)
  }, [ensureBooted])

  // Run npm install -- returns a Promise so caller can await or fire-and-forget
  const install = useCallback(async () => {
    const container = await ensureBooted()
    setStatus('installing')
    addLog('> npm install')

    const proc = await container.spawn('npm', ['install'])
    proc.output.pipeTo(
      new WritableStream({
        write(chunk: string) {
          chunk.split('\n').filter(Boolean).forEach((l: string) => addLog(l))
        },
      }),
    )

    const code = await proc.exit
    if (code !== 0) {
      const msg = `npm install failed (exit ${code})`
      addLog(`! ${msg}`)
      setStatus('error')
      throw new Error(msg)
    }
    addLog('> Dependencies installed')
  }, [ensureBooted, addLog])

  // Start next dev -- idempotent (won't spawn twice)
  const startDev = useCallback(async () => {
    if (devStartedRef.current) return
    devStartedRef.current = true

    const container = containerRef.current
    if (!container) throw new Error('Container not booted')

    setStatus('running')
    addLog('> npm run dev')

    container.on('server-ready', (_port: number, url: string) => {
      addLog(`> Ready -- ${url}`)
      setPreviewUrl(url)
    })

    const proc = await container.spawn('npm', ['run', 'dev'])
    proc.output.pipeTo(
      new WritableStream({
        write(chunk: string) {
          chunk.split('\n').filter(Boolean).forEach((l: string) => addLog(l))
        },
      }),
    )
  }, [addLog, setPreviewUrl])

  const teardown = useCallback(() => {
    containerRef.current?.teardown()
    containerRef.current  = null
    bootedRef.current     = false
    devStartedRef.current = false
    setStatus('idle')
    setPreviewUrl(null)
    setLogs([])
  }, [setPreviewUrl])

  return { writeFile, install, startDev, teardown, status, logs }
}
