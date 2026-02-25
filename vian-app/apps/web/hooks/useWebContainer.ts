'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useProjectStore } from '@/stores/projectStore'

export type WCStatus = 'idle' | 'booting' | 'installing' | 'running' | 'error'

// Singleton — WebContainer.boot() can only be called once per page load
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let globalWC: any = null

export function useWebContainer() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wcRef             = useRef<any>(null)
  const bootedRef         = useRef(false)
  const [status, setStatus]   = useState<WCStatus>('idle')
  const [logs, setLogs]       = useState<string[]>([])
  const { setPreviewUrl }     = useProjectStore()

  const pushLog = useCallback((line: string) => {
    setLogs((prev) => [...prev.slice(-300), line])
  }, [])

  // Wire up the global instance if it already exists (hot-reload guard)
  useEffect(() => {
    if (globalWC) {
      wcRef.current  = globalWC
      bootedRef.current = true
    }
    return () => {
      // Do NOT teardown on unmount — singleton lives for page lifetime
    }
  }, [])

  // Boot the WebContainer exactly once per page
  const ensureBooted = useCallback(async () => {
    if (bootedRef.current && wcRef.current) return wcRef.current

    setStatus('booting')
    pushLog('> Booting WebContainer...')

    const { WebContainer } = await import('@webcontainer/api')
    const container = globalWC ?? await WebContainer.boot()
    globalWC          = container
    wcRef.current     = container
    bootedRef.current = true

    // server-ready fires when `next dev` is up
    container.on('server-ready', (_port: number, url: string) => {
      pushLog(`> Ready -> ${url}`)
      setPreviewUrl(url)
      setStatus('running')
    })

    pushLog('> Sandbox ready.')
    setStatus('idle')
    return container
  }, [pushLog, setPreviewUrl])

  // Write a single file, creating parent directories automatically
  const writeFile = useCallback(async (filePath: string, content: string) => {
    const wc = await ensureBooted()
    const parts = filePath.split('/')
    if (parts.length > 1) {
      const dir = parts.slice(0, -1).join('/')
      await wc.fs.mkdir(dir, { recursive: true }).catch(() => {})
    }
    await wc.fs.writeFile(filePath, content)
  }, [ensureBooted])

  // Install dependencies then immediately start npm run dev -- single call
  const installAndBoot = useCallback(async () => {
    const wc = await ensureBooted()

    // npm install
    setStatus('installing')
    pushLog('> npm install...')

    const installProc = await wc.spawn('npm', ['install'])
    installProc.output.pipeTo(
      new WritableStream({
        write(chunk: string) {
          chunk.split('\n').filter(Boolean).forEach((l: string) => pushLog(l))
        },
      }),
    )

    const installCode = await installProc.exit
    if (installCode !== 0) {
      const msg = `npm install failed (exit ${installCode})`
      pushLog(`! ${msg}`)
      setStatus('error')
      return
    }
    pushLog('> Dependencies installed.')

    // npm run dev
    pushLog('> Starting next dev...')
    const devProc = await wc.spawn('npm', ['run', 'dev'])
    devProc.output.pipeTo(
      new WritableStream({
        write(chunk: string) {
          chunk.split('\n').filter(Boolean).forEach((l: string) => pushLog(l))
        },
      }),
    )
    // server-ready event fires -> sets previewUrl + status = 'running'
  }, [ensureBooted, pushLog])

  return {
    writeFile,
    installAndBoot,
    status,
    logs,
  }
}
