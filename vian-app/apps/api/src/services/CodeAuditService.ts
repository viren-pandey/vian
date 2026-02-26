// apps/api/src/services/CodeAuditService.ts
// Decides WHEN to invoke OpenCode — so it's not called unnecessarily

import { openCodeService, type AuditResult } from './OpenCodeService'

const AUDIT_TRIGGERS = [
  'cannot find module',
  'is not defined',
  'unexpected token',
  'type error',
  'syntaxerror',
  'referenceerror',
  'typeerror',
  'failed to compile',
  'error TS',
  "can't resolve",
  'module not found',
]

const COMMAND_TRIGGERS = [
  'npm install',
  'npm i ',
  'pnpm add',
  'yarn add',
  'fix this',
  'fix the error',
  'why is this broken',
  'not working',
  'debug this',
  'optimize',
]

export class CodeAuditService {

  // Check if generated code needs auditing
  shouldAudit(code: string): boolean {
    const lower = code.toLowerCase()
    return AUDIT_TRIGGERS.some((trigger) => lower.includes(trigger))
  }

  // Check if user message is a command for OpenCode
  isOpenCodeCommand(message: string): boolean {
    const lower = message.toLowerCase()
    return COMMAND_TRIGGERS.some((trigger) => lower.includes(trigger))
  }

  // Detect command type from user message
  getCommandType(message: string): 'audit' | 'fix' | 'run' | 'explain' {
    const lower = message.toLowerCase()
    if (lower.includes('npm') || lower.includes('pnpm') || lower.includes('yarn')) return 'run'
    if (lower.includes('fix') || lower.includes('error') || lower.includes('broken')) return 'fix'
    if (lower.includes('why') || lower.includes('explain') || lower.includes('debug')) return 'explain'
    return 'audit'
  }

  // Silent audit — call after generation, before sending to frontend
  async silentAudit(
    files: { path: string; content: string }[],
    context: string
  ): Promise<{ path: string; content: string }[]> {
    if (!openCodeService.available) return files

    // Only audit if there are actual files to audit
    const auditableFiles = files.filter((f) =>
      f.path.endsWith('.tsx') || f.path.endsWith('.ts') || f.path.endsWith('.js')
    )
    if (auditableFiles.length === 0) return files

    console.log(`[Audit] Running silent audit on ${auditableFiles.length} files...`)

    const result: AuditResult = await openCodeService.auditAndFix({
      type:    'audit',
      files:   auditableFiles,
      prompt:  'Fix any TypeScript errors, missing imports, or broken code.',
      context,
    })

    if (!result.success || !result.fixed) return files

    console.log(`[Audit] Fixed ${result.files.length} files silently.`)

    // Merge fixed files back into full file list
    const fixedMap = new Map(result.files.map((f) => [f.path, f.content]))
    return files.map((f) => ({
      path:    f.path,
      content: fixedMap.get(f.path) ?? f.content,
    }))
  }
}

export const codeAuditService = new CodeAuditService()
