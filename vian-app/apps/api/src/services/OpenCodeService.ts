// apps/api/src/services/OpenCodeService.ts
import { spawn, execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

export interface AuditResult {
  success:  boolean
  files:    { path: string; content: string }[]
  errors:   string[]
  warnings: string[]
  fixed:    boolean
}

export interface OpenCodeCommand {
  type:    'audit' | 'fix' | 'run' | 'explain'
  files:   { path: string; content: string }[]
  prompt:  string
  context: string
}

export class OpenCodeService {
  private isAvailable: boolean = false
  private tempDir: string

  constructor() {
    this.tempDir = path.join(os.tmpdir(), 'vian-opencode')
    this.checkAvailability()
  }

  // Check if opencode is installed
  private checkAvailability() {
    try {
      execSync('opencode --version', { stdio: 'pipe' })
      this.isAvailable = true
      console.log('[OpenCode] Available and ready.')
    } catch {
      this.isAvailable = false
      console.warn('[OpenCode] Not installed. Run: npm i -g opencode-ai')
    }
  }

  // Silent audit — runs in background, returns fixed files
  async auditAndFix(command: OpenCodeCommand): Promise<AuditResult> {
    if (!this.isAvailable) {
      return {
        success:  false,
        files:    command.files,
        errors:   ['OpenCode not installed'],
        warnings: [],
        fixed:    false,
      }
    }

    // Write files to temp directory
    const sessionDir = path.join(this.tempDir, `session-${Date.now()}`)
    fs.mkdirSync(sessionDir, { recursive: true })

    try {
      // Write all files
      for (const file of command.files) {
        const filePath = path.join(sessionDir, file.path)
        const fileDir  = path.dirname(filePath)
        fs.mkdirSync(fileDir, { recursive: true })
        fs.writeFileSync(filePath, file.content, 'utf-8')
      }

      // Build opencode prompt
      const ocPrompt = this.buildPrompt(command)

      // Run opencode
      const result = await this.runOpenCode(sessionDir, ocPrompt)

      // Read back modified files
      const fixedFiles = this.readFixedFiles(sessionDir, command.files)

      // Cleanup
      fs.rmSync(sessionDir, { recursive: true, force: true })

      return {
        success:  true,
        files:    fixedFiles,
        errors:   result.errors,
        warnings: result.warnings,
        fixed:    fixedFiles.some((f, i) => f.content !== command.files[i]?.content),
      }
    } catch (err: any) {
      fs.rmSync(sessionDir, { recursive: true, force: true })
      return {
        success:  false,
        files:    command.files,
        errors:   [err.message],
        warnings: [],
        fixed:    false,
      }
    }
  }

  private buildPrompt(command: OpenCodeCommand): string {
    const base = {
      audit: `You are a Next.js expert. Audit these files and fix any errors silently.
              Return working code. Do not explain. Just fix.
              Context: ${command.context}
              User request: ${command.prompt}`,

      fix:   `Fix all TypeScript errors, runtime errors, and broken imports.
              Make the code work correctly.
              User reported: ${command.prompt}`,

      run:   `Execute this terminal command in the project context: ${command.prompt}
              Return the result and any file changes needed.`,

      explain: `Analyze the code and explain what's wrong.
                User asked: ${command.prompt}`,
    }

    return base[command.type] || base.audit
  }

  private async runOpenCode(
    cwd: string,
    prompt: string
  ): Promise<{ errors: string[]; warnings: string[] }> {
    return new Promise((resolve) => {
      const errors:   string[] = []
      const warnings: string[] = []

      const proc = spawn('opencode', ['run', '--non-interactive', prompt], {
        cwd,
        env: {
          ...process.env,
          ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
          OPENCODE_MODEL:    process.env.OPENCODE_MODEL || 'claude-sonnet-4-6',
        },
        timeout: 60000,  // 60s max
      })

      proc.stderr.on('data', (data: Buffer) => {
        const line = data.toString()
        if (line.toLowerCase().includes('error'))   errors.push(line)
        if (line.toLowerCase().includes('warning')) warnings.push(line)
      })

      proc.on('close', () => resolve({ errors, warnings }))
      proc.on('error', (err) => {
        errors.push(err.message)
        resolve({ errors, warnings })
      })
    })
  }

  private readFixedFiles(
    sessionDir: string,
    originalFiles: { path: string; content: string }[]
  ): { path: string; content: string }[] {
    return originalFiles.map((file) => {
      const filePath = path.join(sessionDir, file.path)
      try {
        const content = fs.readFileSync(filePath, 'utf-8')
        return { path: file.path, content }
      } catch {
        return file  // return original if file wasn't changed
      }
    })
  }

  // Run a raw terminal command (for user npm install requests etc.)
  async runCommand(
    command: string,
    files: { path: string; content: string }[]
  ): Promise<{ output: string; success: boolean }> {
    if (!this.isAvailable) {
      return { output: 'OpenCode not available', success: false }
    }

    const sessionDir = path.join(this.tempDir, `cmd-${Date.now()}`)
    fs.mkdirSync(sessionDir, { recursive: true })

    // Write files to temp dir
    for (const file of files) {
      const filePath = path.join(sessionDir, file.path)
      fs.mkdirSync(path.dirname(filePath), { recursive: true })
      fs.writeFileSync(filePath, file.content, 'utf-8')
    }

    return new Promise((resolve) => {
      let output = ''

      const proc = spawn('opencode', ['run', '--non-interactive', command], {
        cwd: sessionDir,
        env: { ...process.env, ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY },
        timeout: 30000,
      })

      proc.stdout.on('data', (d: Buffer) => { output += d.toString() })
      proc.stderr.on('data', (d: Buffer) => { output += d.toString() })

      proc.on('close', (code) => {
        fs.rmSync(sessionDir, { recursive: true, force: true })
        resolve({ output, success: code === 0 })
      })
    })
  }

  get available() { return this.isAvailable }
}

// Singleton
export const openCodeService = new OpenCodeService()
