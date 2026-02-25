/**
 * FileValidator — validates generated file paths and TypeScript syntax.
 * All validation is enforced before files are streamed to the client.
 */
export class FileValidator {
  private readonly ALLOWED_PREFIXES = [
    'apps/web/',
    'apps/api/',
    'packages/',
  ]

  private readonly ALLOWED_ROOT_FILES = [
    'package.json',
    'pnpm-workspace.yaml',
    'tsconfig.json',
    'tsconfig.base.json',
    '.env.example',
    '.gitignore',
    'README.md',
  ]

  /**
   * Returns true if the file path is within an allowed prefix
   * or is a known root-level config file.
   */
  isValidPath(filePath: string): boolean {
    if (!filePath || filePath.includes('..') || filePath.startsWith('/')) return false
    if (this.ALLOWED_ROOT_FILES.includes(filePath)) return true
    return this.ALLOWED_PREFIXES.some((prefix) => filePath.startsWith(prefix))
  }

  /**
   * Naïve brace-balance check for TypeScript/JavaScript.
   * Returns true if content is likely syntactically valid.
   * Only runs on .ts/.tsx files.
   */
  isValidTypeScript(content: string, path: string): boolean {
    if (!path.endsWith('.ts') && !path.endsWith('.tsx')) return true
    if (!content?.trim()) return false

    const open = (content.match(/\{/g) ?? []).length
    const close = (content.match(/\}/g) ?? []).length
    return Math.abs(open - close) < 3 // Allow small variance for template literals etc.
  }
}

