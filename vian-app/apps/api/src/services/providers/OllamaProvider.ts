/**
 * OllamaProvider - Local LLM provider (100% free, runs on your machine)
 * 
 * Features:
 * - Zero cost (runs locally)
 * - No API limits
 * - Privacy-focused (no data sent to cloud)
 * - Multiple models supported
 * - Auto-installation of models when needed
 * 
 * Setup: Install Ollama from https://ollama.ai
 * Models are automatically pulled when first used
 */

import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

interface OllamaResponse {
  model: string
  response: string
  done: boolean
}

interface PullProgress {
  status: string
  digest?: string
  total?: number
  completed?: number
}

export class OllamaProvider {
  private baseUrl: string
  private model: string
  private timeout: number

  constructor(model?: string) {
    this.baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
    this.model = model || process.env.OLLAMA_MODEL || 'deepseek-coder:6.7b'
    this.timeout = 180000 // 3 minutes (allows time for model download/loading)
    
    console.log(`[OllamaProvider] Initialized with model: ${this.model}`)
  }

  /**
   * Set or change the model to use
   */
  setModel(modelName: string): void {
    console.log(`[OllamaProvider] Switching model from ${this.model} to ${modelName}`)
    this.model = modelName
  }

  /**
   * Get current model name
   */
  getModel(): string {
    return this.model
  }

  /**
   * Call Ollama local API
   */
  async callOllama(prompt: string): Promise<string> {
    const startTime = Date.now()
    
    try {
      console.log('[OllamaProvider] Calling local Ollama...')
      
      const systemPrompt = this.getSystemPrompt()
      const optimizedPrompt = this.optimizePrompt(prompt)

      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          prompt: `${systemPrompt}\n\nUser request: ${optimizedPrompt}`,
          stream: false,
          options: {
            temperature: 0.1,
            top_p: 0.9,
            top_k: 40,
            num_predict: 4096,
          }
        }),
        signal: AbortSignal.timeout(this.timeout)
      })

      if (!response.ok) {
        if (response.status === 404) {
          // Model not found - auto-install it
          console.log(`[OllamaProvider] Model '${this.model}' not found, auto-installing...`)
          await this.pullModel(this.model)
          
          // Retry after installation
          console.log(`[OllamaProvider] Retrying generation with newly installed model...`)
          return this.callOllama(prompt)
        }
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`)
      }

      const data: OllamaResponse = await response.json()
      
      if (!data.response) {
        throw new Error('Empty response from Ollama')
      }

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
      console.log(`[OllamaProvider] ✓ Response received (${elapsed}s)`)

      // Extract JSON from response
      return this.extractJSON(data.response, prompt)

    } catch (error: any) {
      if (error.name === 'AbortError' || error.name === 'TimeoutError') {
        throw new Error('Ollama request timeout - model may be loading')
      }
      
      if (error.code === 'ECONNREFUSED') {
        throw new Error('Ollama not running. Start it with: ollama serve')
      }

      console.error('[OllamaProvider] Error:', error.message)
      throw error
    }
  }

  /**
   * Auto-install/pull a model from Ollama registry
   */
  private async pullModel(modelName: string): Promise<void> {
    console.log(`[OllamaProvider] 🔄 Pulling model: ${modelName}`)
    console.log(`[OllamaProvider] This may take 2-5 minutes for first-time download...`)
    
    try {
      // Use the Ollama API to pull the model
      const response = await fetch(`${this.baseUrl}/api/pull`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: modelName,
          stream: false
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to pull model: ${response.statusText}`)
      }

      const result = await response.json()
      console.log(`[OllamaProvider] ✅ Model '${modelName}' installed successfully!`)
      
    } catch (error: any) {
      console.error(`[OllamaProvider] ❌ Failed to pull model: ${error.message}`)
      throw new Error(`Could not auto-install model '${modelName}'. Please run manually: ollama pull ${modelName}`)
    }
  }

  /**
   * Extract JSON from Ollama response
   */
  private extractJSON(response: string, originalPrompt: string): string {
    try {
      // Try to find JSON in the response
      const jsonMatch = response.match(/\{[\s\S]*"files"[\s\S]*\}/i)
      
      if (jsonMatch) {
        const json = jsonMatch[0]
        // Validate it's proper JSON
        JSON.parse(json)
        return json
      }

      // If no JSON found, try to extract code and wrap it
      console.log('[OllamaProvider] No JSON found, wrapping raw code')
      return this.wrapInJSON(response, originalPrompt)

    } catch (error) {
      console.warn('[OllamaProvider] JSON extraction failed, wrapping raw response')
      return this.wrapInJSON(response, originalPrompt)
    }
  }

  /**
   * Wrap raw code in JSON format
   */
  private wrapInJSON(code: string, prompt: string): string {
    // Determine file extension and language from prompt
    const lowerPrompt = prompt.toLowerCase()
    let extension = '.tsx'
    let language = 'tsx'
    let filename = 'app/page'

    if (lowerPrompt.includes('typescript') || lowerPrompt.includes('.ts')) {
      extension = '.ts'
      language = 'ts'
    } else if (lowerPrompt.includes('react') || lowerPrompt.includes('component') || lowerPrompt.includes('next')) {
      extension = '.tsx'
      language = 'tsx'
    } else if (lowerPrompt.includes('javascript') || lowerPrompt.includes('.js')) {
      extension = '.js'
      language = 'js'
    } else if (lowerPrompt.includes('python')) {
      extension = '.py'
      language = 'python'
    } else if (lowerPrompt.includes('css')) {
      extension = '.css'
      language = 'css'
      filename = 'app/globals'
    } else if (lowerPrompt.includes('html')) {
      extension = '.html'
      language = 'html'
    }

    // Clean the code (remove markdown code blocks if present)
    let cleanCode = code
      .replace(/```[\w]*\n/g, '')
      .replace(/```\n?$/g, '')
      .trim()

    // Escape for JSON
    cleanCode = cleanCode.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')

    return `{
  "files": [
    {
      "path": "${filename}${extension}",
      "content": "${cleanCode}",
      "language": "${language}"
    }
  ]
}`
  }

  /**
   * System prompt for Next.js app generation
   */
  private getSystemPrompt(): string {
    return `You are a FULL-STACK Next.js application generator. Generate complete, production-ready Next.js 14+ applications.

═══════════════════════════════════════════════════════════════════════════════
CRITICAL OUTPUT FORMAT - STRICT REQUIREMENT
═══════════════════════════════════════════════════════════════════════════════

Return ONLY a valid JSON object with this EXACT structure:
{
  "files": [
    {
      "path": "app/page.tsx",
      "content": "full file content with \\n for newlines",
      "language": "tsx"
    }
  ]
}

NO markdown, NO explanations, NO code fences, NO extra text.
ONLY the JSON object above.

═══════════════════════════════════════════════════════════════════════════════
TECH STACK - NON-NEGOTIABLE
═══════════════════════════════════════════════════════════════════════════════

✓ Next.js 14+ App Router (app/ folder, NOT pages/)
✓ TypeScript everywhere (.tsx for components, .ts for utilities)
✓ Tailwind CSS for ALL styling
✓ Server Components by default
✓ 'use client' ONLY when using: useState, useEffect, useRef, event handlers, browser APIs

═══════════════════════════════════════════════════════════════════════════════
REQUIRED MINIMUM FILES
═══════════════════════════════════════════════════════════════════════════════

MUST include at minimum:
1. package.json - with dependencies: next, react, react-dom, typescript, tailwindcss, lucide-react
2. tsconfig.json - strict TypeScript config
3. tailwind.config.ts - Tailwind configuration
4. postcss.config.js - PostCSS for Tailwind
5. app/layout.tsx - Root layout with <html> and <body>
6. app/page.tsx - Main page component
7. app/globals.css - Tailwind imports + custom CSS variables

For CRUD/data apps, also include:
8. lib/db.ts - In-memory data store with TypeScript interfaces and CRUD functions
9. app/api/[resource]/route.ts - NextRequest/NextResponse API routes
10. components/*.tsx - Reusable UI components

═══════════════════════════════════════════════════════════════════════════════
CODE QUALITY REQUIREMENTS
═══════════════════════════════════════════════════════════════════════════════

✓ ALL TypeScript types explicit - no implicit any
✓ "use client" at top of files using hooks/events
✓ Responsive design - mobile-first with sm:/md:/lg: breakpoints
✓ Clean component structure - one component per file
✓ Proper error handling and loading states
✓ Helpful comments explaining key logic
✓ Real, working code - NO placeholders, NO TODOs

STYLING:
✓ Use Tailwind utility classes extensively
✓ Consistent spacing (p-4, p-6, gap-4, mb-4)
✓ Cards: bg-white dark:bg-gray-800 border border-gray-200 rounded-lg shadow
✓ Buttons: px-4 py-2 rounded-md transition-colors
✓ Icons from lucide-react

DATA & STATE:
✓ For apps with data: create lib/db.ts with in-memory arrays
✓ Seed with 8-15 realistic mock records
✓ API routes in app/api/[resource]/route.ts using NextResponse
✓ Client components use useEffect + fetch for data loading

═══════════════════════════════════════════════════════════════════════════════
EXAMPLE package.json
═══════════════════════════════════════════════════════════════════════════════

{
  "name": "nextjs-app",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "lucide-react": "^0.400.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.0.0"
  }
}

═══════════════════════════════════════════════════════════════════════════════
REMEMBER
═══════════════════════════════════════════════════════════════════════════════

- Output ONLY the JSON object - nothing else
- Include 8-20 files total (keep it reasonable for WebContainer)
- Make it fully functional and ready to run
- Every file must have complete, working code
- Use proper TypeScript types throughout`
  }

  /**
   * Optimize prompt for Ollama
   */
  private optimizePrompt(prompt: string): string {
    // Ollama can handle longer prompts since it's local - no API costs
    // Expand user prompt with additional context for better generation
    const enhanced = `Generate a complete, production-ready Next.js 14 application for the following request:

${prompt.trim()}

Remember to:
- Use App Router (app/ folder), not Pages Router
- Include TypeScript types everywhere
- Use Tailwind CSS for all styling
- Create realistic mock data (8-15 records minimum)
- Make it fully responsive and accessible
- Include package.json with correct dependencies
- Make all code complete and working - no placeholders`

    return enhanced
  }

  /**
   * Health check for Ollama
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        signal: AbortSignal.timeout(5000)
      })
      
      if (!response.ok) return false

      const data = await response.json()
      
      // Check if our model is available
      if (data.models && Array.isArray(data.models)) {
        const modelExists = data.models.some((m: any) => 
          m.name === this.model || m.name.startsWith(this.model.split(':')[0])
        )
        
        if (!modelExists) {
          console.warn(`[OllamaProvider] Model '${this.model}' not found. Available: ${data.models.map((m: any) => m.name).join(', ')}`)
        }
        
        return modelExists
      }

      return true

    } catch (error: any) {
      if (error.code === 'ECONNREFUSED') {
        console.warn('[OllamaProvider] Ollama not running')
      }
      return false
    }
  }

  /**
   * List available Ollama models
   */
  async listModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`)
      
      if (!response.ok) return []

      const data = await response.json()
      
      if (data.models && Array.isArray(data.models)) {
        return data.models.map((m: any) => m.name)
      }

      return []

    } catch (error) {
      return []
    }
  }
}
