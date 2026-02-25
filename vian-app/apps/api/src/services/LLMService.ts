import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import Groq from 'groq-sdk'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { keyManager } from './KeyManager'

export interface GeneratedFileEvent {
  type: 'file'
  path: string
  content: string
  language?: string
}

export interface GenerationEvent {
  type: 'file' | 'complete' | 'error'
  path?: string
  content?: string
  language?: string
  message?: string
}

// ─── Generation system prompt ────────────────────────────────────────────────
const GENERATION_SYSTEM_PROMPT = `CRITICAL — PRE-INSTALLED FILES (DO NOT REGENERATE THESE):
  package.json    → Next.js 14.2.5 + react 18.3.1 + clsx + lucide-react (NOT Vite, NOT CRA)
  next.config.js  → COOP/COEP headers already set
  tsconfig.json   → paths: {"@/*": ["./*"]} already configured
  tailwind.config.ts → CSS variable colors + animations already configured
  app/globals.css → Tailwind + CSS variables (--background, --foreground, --primary…) already set
  lib/utils.ts    → cn, formatDate, timeAgo, formatCurrency, slugify, capitalize, truncate, groupBy, debounce, generateId
  lib/types.ts    → ApiResponse<T>, PaginatedResponse<T>, User, Session, Status, SelectOption, NavItem
  lib/constants.ts → APP_NAME, API_BASE, ROUTES, DEFAULT_PAGE_SIZE
  lib/api-client.ts → api.get/post/put/patch/delete typed fetch wrapper

FORBIDDEN:
  ✗ NEVER generate: vite.config.ts, index.html (root), src/main.tsx, src/App.tsx
  ✗ NEVER use: vite, webpack, parcel, create-react-app, esbuild
  ✗ NEVER modify: package.json, next.config.js, tsconfig.json — will break the project
  ✗ NEVER use pages/ directory — App Router only (app/ directory)
  ✗ NEVER add new npm packages — only: next, react, react-dom, clsx, lucide-react, tailwindcss
  ✗ NEVER use @apply with custom token names (bg-background, text-foreground etc.) in @layer base — causes CSS build crash. Use plain CSS: body { background-color: hsl(var(--background)); }
  ✗ If you regenerate app/globals.css, ALWAYS include the full :root { } and .dark { } CSS variable blocks from the boilerplate — otherwise the whole app goes white

═══════════════════════════════════════════════════════════════════════════════
 YOU ARE VIAN — A FULLSTACK APP GENERATOR. EVERY OUTPUT MUST BE PRODUCTION-QUALITY.
═══════════════════════════════════════════════════════════════════════════════

OUTPUT FORMAT — STRICT:
Return ONLY raw JSON objects, one per line. Example:
{"type":"file","path":"app/page.tsx","content":"'use client'\\nimport ..."}
After all files: {"type":"complete"}
ZERO markdown. ZERO explanation. ZERO preamble. Raw JSON objects ONLY.

FILE GENERATION ORDER:
1. app/globals.css           — ONLY if adding new CSS vars/fonts beyond boilerplate
2. tailwind.config.ts        — ONLY if extending colors/animations beyond boilerplate
3. lib/db.ts                 — In-memory data store + full TypeScript types for this app
4. lib/auth.ts               — Auth helpers: getSession, getCurrentUser, hashPassword (mock if no DB)
5. app/api/[resource]/route.ts — Next.js Route Handlers (GET, POST, PUT, DELETE with NextResponse)
6. app/actions/[name].ts     — Server Actions ('use server') for form mutations & data fetching
7. components/[Name].tsx     — Every component needs its own file
8. app/page.tsx              — Main page (last, imports everything above)
9. app/[route]/page.tsx      — Additional route pages if the app requires multiple views

═══════════════════════════════════════════════════════════════════════════════
 FULLSTACK ARCHITECTURE REQUIREMENTS
═══════════════════════════════════════════════════════════════════════════════

▸ DATABASE LAYER (lib/db.ts) — ALWAYS generate this for any non-trivial app:
  • Define TypeScript interfaces for every entity (e.g., interface Product { id: string; name: string; ... })
  • Use in-memory arrays as the data store (works in WebContainer without external DB)
  • Provide CRUD functions: findAll, findById, create, update, deleteById
  • Seed with 8-15 realistic mock records (real names, prices, dates, descriptions)
  • Export the store and all CRUD functions
  Example:
  const products: Product[] = [{ id: '1', name: 'MacBook Pro', price: 2499, ... }, ...]
  export function findAll() { return [...products] }
  export function create(data: Omit<Product,'id'>) { const p = { id: generateId(), ...data }; products.push(p); return p }

▸ API ROUTES (app/api/[resource]/route.ts) — ALWAYS for CRUD apps:
  • GET  → return NextResponse.json({ data: findAll() })
  • POST → parse req.json(), validate, create(), return NextResponse.json({ data: result }, { status: 201 })
  • PUT/PATCH → parse id from searchParams or body, update(), return updated record
  • DELETE → parse id, deleteById(id), return NextResponse.json({ success: true })
  • Always import: import { NextRequest, NextResponse } from 'next/server'
  • Always handle errors: try/catch → NextResponse.json({ error: msg }, { status: 500 })

▸ SERVER ACTIONS (app/actions/[name].ts) — Use for form submissions & mutations:
  • 'use server' at top of file
  • Async functions that call DB layer and return typed results
  • Use revalidatePath() after mutations if using data caching
  • Return { success: boolean, data?: T, error?: string }

▸ AUTH PATTERN (lib/auth.ts) — For apps needing login/user context:
  • Mock session using in-memory map or simple token check
  • Export: getSession(): Session | null, getCurrentUser(): User | null, signIn(email,password): Session, signOut(): void
  • For real Next.js auth: read Authorization header or cookies
  • Never use external auth packages (not in package.json)

▸ FRONTEND COMPONENTS — Quality bar is HIGH:
  • Every component must render REAL DATA from the API (use useEffect + fetch or SWR-style pattern)
  • Include loading state (skeleton or spinner while fetching)
  • Include error state (error message component)
  • Include empty state (illustration + CTA when no data)
  • CRUD forms must: validate inputs, show errors inline, disable submit while loading, show success feedback
  • Use the CSS variable colors (bg-background, text-foreground, bg-card, text-muted-foreground, etc.)
  • Use Tailwind extensively — no inline styles
  • Use lucide-react for ALL icons
  • Responsive: mobile-first with sm:/md:/lg: breakpoints

▸ PAGE ARCHITECTURE — What a quality page looks like:
  app/page.tsx for a task manager:
    - Navbar with logo, nav links, user avatar
    - Hero/header with page title + primary action button (e.g., "New Task")
    - Filter/sort bar (status filter, sort dropdown)
    - Task list with TaskCard components (title, description, status badge, due date, actions)
    - Modal for create/edit (controlled, accessible)
    - Empty state when no tasks
    - Footer

▸ MINIMUM FILE COUNT:
  • Simple display app (landing page, portfolio): 4-6 files
  • CRUD app (todo, notes, inventory): 8-12 files
    Must include: lib/db.ts + app/api/*/route.ts + 3-5 components + page
  • Dashboard/analytics: 10-15 files
    Must include: lib/db.ts + multiple api routes + chart-like components + layout

═══════════════════════════════════════════════════════════════════════════════
 CODE QUALITY RULES — NON-NEGOTIABLE
═══════════════════════════════════════════════════════════════════════════════

• "use client" directive at top of EVERY file using useState, useEffect, useRef, event handlers
• ALL TypeScript types explicit — zero implicit any
• ALL functions complete — zero // TODO, zero placeholder text, zero "coming soon"
• ALL components receive typed props interfaces (e.g., interface TaskCardProps { task: Task; onEdit: (t: Task) => void })
• Import cn from '@/lib/utils' for conditional classes
• Import generateId from '@/lib/utils' for new record IDs
• Import formatDate, timeAgo, formatCurrency from '@/lib/utils' as needed
• Import types from '@/lib/types' as needed
• Import api from '@/lib/api-client' for fetch calls (or use direct fetch to /api/*)
• Colors: use CSS variable classes (bg-background, bg-card, text-foreground, text-muted-foreground, border-border, etc.) for proper light/dark support
• Spacing: use consistent Tailwind spacing (p-4/p-6, gap-3/gap-4, mb-2/mb-4)
• Borders: border border-border rounded-lg for cards
• Buttons: solid primary (bg-primary text-primary-foreground hover:bg-primary/90) and ghost (hover:bg-accent)
• Hover states: transition-colors duration-150 on all interactive elements
• Focus states: focus-visible:ring-2 focus-visible:ring-ring
• NEVER use black/white hardcoded colors — use CSS variable classes`
const EDIT_SYSTEM_PROMPT = `You are VIAN's fullstack code editor for Next.js 14 App Router + TypeScript + Tailwind CSS.

You will receive:
1. The user's edit instruction (may include a runtime error to fix)
2. ALL current project files so you have full context

YOUR JOB: understand the FULL app structure, apply the change or fix the error across ALL files that need changing.

Return ONLY raw JSON on data: lines — one per file:
data: {"type":"file","path":"app/page.tsx","content":"...full content, \\n for newlines..."}
data: {"type":"file","path":"lib/db.ts","content":"..."}
data: {"type":"complete"}

RULES:
• data: lines ONLY — zero markdown, preamble, or explanation outside of code
• Return FULL file content — never partial diffs or snippets
• Fix ALL files involved: if a component is broken, fix it AND its parent AND its imports
• When fixing a runtime error: identify root cause across the whole project, fix everywhere
• Preserve all existing functionality not mentioned in the instruction
• "use client" at top of every file using hooks or event handlers
• Colors: use CSS variable classes (bg-background, text-foreground, bg-card, border-border, text-muted-foreground)
• Use clsx/cn for conditional classes, lucide-react for icons
• Only use packages already installed: next, react, react-dom, clsx, lucide-react
• Zero TODO comments — every function complete and working
• TypeScript strict: explicit types on all props, params, return values — no implicit any
• Available pre-built utilities in lib/utils.ts: cn, formatDate, timeAgo, formatCurrency, slugify, capitalize, truncate,
  initials, groupBy, unique, chunk, generateId, debounce, sleep
• Available pre-built types in lib/types.ts: ApiResponse, PaginatedResponse, User, Session, Status, SelectOption, NavItem
• API routes go in app/api/[resource]/route.ts using NextRequest/NextResponse
• Server actions go in app/actions/*.ts with 'use server' directive`

// ─── Buffer parser — extract complete SSE events from a stream buffer ─────────
// Uses balanced-brace extraction so it handles:
//   • Multi-line JSON (real newlines inside content field)
//   • Preamble/explanation text from the model before data: lines
//   • Markdown code fences (```json ... ```)
//   • Missing "data: " prefix — looks for raw JSON objects too
function extractEvents(buffer: string): { events: GenerationEvent[]; remaining: string } {
  const events: GenerationEvent[] = []

  // Strip markdown fences so they don't confuse the parser
  const stripped = buffer.replace(/```(?:json)?\s*/g, '')

  let lastEnd = 0
  let i = 0

  while (i < stripped.length) {
    if (stripped[i] !== '{') { i++; continue }

    // Walk forward counting braces to find a balanced JSON object
    let depth = 0
    let inString = false
    let escape = false
    let j = i

    while (j < stripped.length) {
      const ch = stripped[j]
      if (escape)          { escape = false }
      else if (ch === '\\') { escape = true }
      else if (ch === '"')  { inString = !inString }
      else if (!inString) {
        if (ch === '{') depth++
        else if (ch === '}') {
          depth--
          if (depth === 0) { j++; break }
        }
      }
      j++
    }

    if (depth !== 0) { i++; continue } // unbalanced — not a complete object

    const candidate = stripped.slice(i, j)
    try {
      const parsed = JSON.parse(candidate) as GenerationEvent
      if (parsed.type === 'file' || parsed.type === 'complete' || parsed.type === 'error') {
        events.push(parsed)
        lastEnd = j
        i = j
        continue
      }
    } catch { /* not valid JSON — skip */ }

    i++
  }

  // Remaining = everything after the last successfully parsed object
  const remaining = stripped.slice(lastEnd)
  return { events, remaining }
}

// ─── LLMService class ─────────────────────────────────────────────────────────
export class LLMService {
  private anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
  private groq = new Groq({ apiKey: this.getNextGroqKey() })
  private geminiKeyIndex = 0

  /** Stream files for a new generation */
  async *generateFiles(prompt: string, model: string): AsyncGenerator<GenerationEvent> {
    if (model.startsWith('claude')) {
      yield* this.streamAnthropic(GENERATION_SYSTEM_PROMPT, prompt)
    } else if (model.startsWith('llama') || model.startsWith('mixtral') || model.startsWith('gemma') || model === 'groq') {
      yield* this.streamGroq(GENERATION_SYSTEM_PROMPT, prompt, model)
    } else if (model.startsWith('gemini')) {
      yield* this.streamGemini(GENERATION_SYSTEM_PROMPT, prompt, model)
    } else if (model.startsWith('deepseek')) {
      yield* this.streamDeepSeek(GENERATION_SYSTEM_PROMPT, prompt, model)
    } else {
      yield* this.streamOpenAI(GENERATION_SYSTEM_PROMPT, prompt, model)
    }
  }

  /** Stream files for an edit operation */
  async *editFile(
    instruction: string,
    currentContent: string,
    filePath: string,
    model: string,
    allFiles?: Record<string, string>
  ): AsyncGenerator<GenerationEvent> {
    // Build a rich context block with ALL current files
    let filesContext = ''
    if (allFiles && Object.keys(allFiles).length > 0) {
      filesContext = Object.entries(allFiles)
        .map(([path, content]) => `=== ${path} ===\n${content}`)
        .join('\n\n')
    } else {
      filesContext = `=== ${filePath} ===\n${currentContent}`
    }

    const userMessage = `EDIT INSTRUCTION:\n${instruction}\n\nCURRENT PROJECT FILES:\n${filesContext}`

    if (model.startsWith('claude')) {
      yield* this.streamAnthropic(EDIT_SYSTEM_PROMPT, userMessage)
    } else if (model.startsWith('llama') || model.startsWith('mixtral') || model.startsWith('gemma') || model === 'groq') {
      yield* this.streamGroq(EDIT_SYSTEM_PROMPT, userMessage, model)
    } else if (model.startsWith('gemini')) {
      yield* this.streamGemini(EDIT_SYSTEM_PROMPT, userMessage, model)
    } else if (model.startsWith('deepseek')) {
      yield* this.streamDeepSeek(EDIT_SYSTEM_PROMPT, userMessage, model)
    } else {
      yield* this.streamOpenAI(EDIT_SYSTEM_PROMPT, userMessage, model)
    }
  }

  // ── OpenAI streaming with automatic key rotation ──────────────────────────
  private async *streamOpenAI(
    system: string,
    userMessage: string,
    model: string
  ): AsyncGenerator<GenerationEvent> {
    const MAX_RETRIES = this.getKeyCount()

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const currentKey = keyManager.getNextKey()
      const openai = new OpenAI({ apiKey: currentKey })
      const openAIModel = model === 'gpt-4-turbo' ? 'gpt-4-turbo' : 'gpt-4o'

      try {
        const stream = await openai.chat.completions.create({
          model: openAIModel,
          max_tokens: 16000,
          stream: true,
          temperature: 0.1,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: userMessage },
          ],
        })

        let buffer = ''
        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta?.content ?? ''
          if (!delta) continue

          buffer += delta
          const { events, remaining } = extractEvents(buffer)
          buffer = remaining

          for (const event of events) {
            keyManager.markSuccess(currentKey)
            yield event
          }
        }

        // Flush any remaining buffer content
        if (buffer.trim()) {
          const { events } = extractEvents(buffer + '\n')
          for (const event of events) yield event
        }

        return // Success — exit retry loop

      } catch (err: any) {
        if (err?.status === 429) {
          const retryAfter = parseInt(err?.headers?.['retry-after'] ?? '60', 10)
          keyManager.markRateLimited(currentKey, retryAfter)
          if (attempt < MAX_RETRIES - 1) {
            console.log(`[LLMService] Key rate-limited. Switching to next key. Attempt ${attempt + 1}/${MAX_RETRIES}`)
            continue // Retry with next key immediately
          }
        } else {
          keyManager.markError(currentKey)
        }
        throw err
      }
    }
  }

  // ── Groq streaming (free tier, OpenAI-compatible) ─────────────────────────
  private async *streamGroq(
    system: string,
    userMessage: string,
    model: string
  ): AsyncGenerator<GenerationEvent> {
    const groqModel = model === 'groq' ? 'llama-3.3-70b-versatile' : model
    console.log(`[LLMService] Starting Groq stream with model: ${groqModel}`)

    let buffer = ''
    let eventsYielded = 0

    try {
      const stream = await this.groq.chat.completions.create({
        model: groqModel,
        max_tokens: 16000,
        stream: true,
        temperature: 0.1,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: userMessage },
        ],
      })

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content ?? ''
        if (!delta) continue

        buffer += delta
        const { events, remaining } = extractEvents(buffer)
        buffer = remaining

        for (const event of events) {
          eventsYielded++
          console.log(`[LLMService] Groq event #${eventsYielded}: type=${event.type} path=${event.path ?? ''}`)
          yield event
        }
      }

      // Flush remaining buffer
      if (buffer.trim()) {
        const { events } = extractEvents(buffer + '\n')
        for (const event of events) {
          eventsYielded++
          yield event
        }
      }

      console.log(`[LLMService] Groq stream complete. Events yielded: ${eventsYielded}`)
      if (eventsYielded === 0) {
        console.warn('[LLMService] WARNING: 0 events from Groq. Buffer tail:', buffer.slice(-300))
      }
    } catch (err: any) {
      console.error('[LLMService] Groq stream error:', err?.message ?? err)
      throw err
    }
  }

  // ── Anthropic streaming ────────────────────────────────────────────────────
  private async *streamAnthropic(
    system: string,
    userMessage: string
  ): AsyncGenerator<GenerationEvent> {
    const anthropicModel = process.env.ANTHROPIC_MODEL ?? 'claude-3-5-sonnet-20241022'
    console.log(`[LLMService] Starting Anthropic stream with model: ${anthropicModel}`)

    let buffer = ''
    let totalChars = 0
    let eventsYielded = 0

    try {
      const stream = this.anthropic.messages.stream({
        model: anthropicModel,
        max_tokens: 16000,
        system,
        messages: [{ role: 'user', content: userMessage }],
      })

      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          const text = chunk.delta.text ?? ''
          buffer += text
          totalChars += text.length

          // Log first 200 chars of output for debugging
          if (totalChars <= 200) {
            process.stdout.write(text)
          } else if (totalChars - text.length <= 200) {
            console.log('\n[LLMService] ...stream continues')
          }

          const { events, remaining } = extractEvents(buffer)
          buffer = remaining

          for (const event of events) {
            eventsYielded++
            console.log(`[LLMService] Yielding event #${eventsYielded}: type=${event.type} path=${event.path ?? ''}`)
            yield event
          }
        }
      }

      // Flush remaining buffer
      if (buffer.trim()) {
        console.log(`[LLMService] Flushing buffer (${buffer.length} chars remaining)`)
        const { events } = extractEvents(buffer + '\n')
        for (const event of events) {
          eventsYielded++
          console.log(`[LLMService] Flush event #${eventsYielded}: type=${event.type} path=${event.path ?? ''}`)
          yield event
        }
      }

      console.log(`[LLMService] Anthropic stream complete. Total chars: ${totalChars}, events: ${eventsYielded}`)
      if (eventsYielded === 0) {
        console.warn('[LLMService] WARNING: 0 events yielded! Raw buffer tail:', buffer.slice(-500))
      }
    } catch (err: any) {
      console.error('[LLMService] Anthropic stream error:', err?.message ?? err)
      console.error('[LLMService] Error status:', err?.status)
      throw err
    }
  }

  // ── DeepSeek streaming (OpenAI-compatible API) ───────────────────────────
  private async *streamDeepSeek(
    system: string,
    userMessage: string,
    model: string
  ): AsyncGenerator<GenerationEvent> {
    const apiKey = process.env.DEEPSEEK_API_KEY
    if (!apiKey) throw new Error('DEEPSEEK_API_KEY not configured')
    console.log(`[LLMService] Starting DeepSeek stream with model: ${model}`)

    const deepseek = new OpenAI({
      apiKey,
      baseURL: 'https://api.deepseek.com/v1',
    })

    let buffer = ''
    let eventsYielded = 0

    try {
      const stream = await deepseek.chat.completions.create({
        model,
        max_tokens: 16000,
        stream: true,
        temperature: 0.1,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: userMessage },
        ],
      })

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content ?? ''
        if (!delta) continue
        buffer += delta
        const { events, remaining } = extractEvents(buffer)
        buffer = remaining
        for (const event of events) { eventsYielded++; yield event }
      }

      if (buffer.trim()) {
        const { events } = extractEvents(buffer + '\n')
        for (const event of events) { eventsYielded++; yield event }
      }

      console.log(`[LLMService] DeepSeek stream complete. Events: ${eventsYielded}`)
    } catch (err: any) {
      console.error('[LLMService] DeepSeek error:', err?.message ?? err)
      throw err
    }
  }

  // ── Gemini streaming with key rotation ───────────────────────────────────
  private getNextGeminiKey(): string {
    const keys: string[] = []
    let i = 1
    while (process.env[`GEMINI_API_KEY_${i}`]) {
      keys.push(process.env[`GEMINI_API_KEY_${i}`]!)
      i++
    }
    if (keys.length === 0) throw new Error('No GEMINI_API_KEY_* configured')
    const key = keys[this.geminiKeyIndex % keys.length]
    this.geminiKeyIndex = (this.geminiKeyIndex + 1) % keys.length
    return key
  }

  private getNextGroqKey(): string {
    // Support numbered keys GROQ_API_KEY_1, _2 … or single GROQ_API_KEY
    const keys: string[] = []
    let i = 1
    while (process.env[`GROQ_API_KEY_${i}`]) {
      keys.push(process.env[`GROQ_API_KEY_${i}`]!)
      i++
    }
    if (keys.length === 0 && process.env.GROQ_API_KEY) keys.push(process.env.GROQ_API_KEY)
    if (keys.length === 0) throw new Error('No Groq API keys configured')
    return keys[0] // simple — can add rotation later
  }

  private async *streamGemini(
    system: string,
    userMessage: string,
    model: string
  ): AsyncGenerator<GenerationEvent> {
    const apiKey = this.getNextGeminiKey()
    console.log(`[LLMService] Starting Gemini stream with model: ${model}`)

    const genAI = new GoogleGenerativeAI(apiKey)
    const geminiModel = genAI.getGenerativeModel({
      model,
      systemInstruction: system,
    })

    let buffer = ''
    let eventsYielded = 0

    try {
      const result = await geminiModel.generateContentStream(userMessage)

      for await (const chunk of result.stream) {
        const text = chunk.text()
        if (!text) continue
        buffer += text
        const { events, remaining } = extractEvents(buffer)
        buffer = remaining
        for (const event of events) { eventsYielded++; yield event }
      }

      if (buffer.trim()) {
        const { events } = extractEvents(buffer + '\n')
        for (const event of events) { eventsYielded++; yield event }
      }

      console.log(`[LLMService] Gemini stream complete. Events: ${eventsYielded}`)
    } catch (err: any) {
      console.error('[LLMService] Gemini error:', err?.message ?? err)
      throw err
    }
  }

  private getKeyCount(): number {
    let count = 0
    let i = 1
    while (process.env[`OPENAI_API_KEY_${i}`]) { count++; i++ }
    if (count === 0 && process.env.OPENAI_API_KEY) count = 1
    return Math.max(count, 1)
  }
}

// ─── Legacy non-streaming helper — routes all providers correctly ────────────
export type SupportedModel = string

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

/** Non-streaming LLM call — routes to correct provider by model prefix. */
export async function callLLM(
  model: SupportedModel,
  messages: LLMMessage[],
  maxTokens = 8192
): Promise<string> {
  const [systemMsg, ...rest] = messages
  const userContent = rest.map((m) => m.content).join('\n')
  const systemContent = systemMsg?.role === 'system' ? systemMsg.content : ''

  // ── Groq (llama, mixtral, gemma) ────────────────────────────────────────────
  if (model.startsWith('llama') || model.startsWith('mixtral') || model.startsWith('gemma')) {
    const groqKey = process.env.GROQ_API_KEY_1 ?? process.env.GROQ_API_KEY ?? ''
    if (!groqKey) throw new Error('GROQ_API_KEY not configured')
    const groq = new Groq({ apiKey: groqKey })
    const resp = await groq.chat.completions.create({
      model,
      messages,
      max_tokens: maxTokens,
      temperature: 0.1,
    })
    return resp.choices[0]?.message?.content ?? ''
  }

  // ── Gemini ─────────────────────────────────────────────────────────────────
  if (model.startsWith('gemini')) {
    const geminiKey = process.env.GEMINI_API_KEY_1 ?? process.env.GEMINI_API_KEY ?? ''
    if (!geminiKey) throw new Error('GEMINI_API_KEY not configured')
    const genAI = new GoogleGenerativeAI(geminiKey)
    const gModel = genAI.getGenerativeModel({ model })
    const result = await gModel.generateContent(`${systemContent}\n\n${userContent}`)
    return result.response.text()
  }

  // ── DeepSeek ───────────────────────────────────────────────────────────────
  if (model.startsWith('deepseek')) {
    const dsKey = process.env.DEEPSEEK_API_KEY ?? ''
    if (!dsKey) throw new Error('DEEPSEEK_API_KEY not configured')
    const ds = new OpenAI({ apiKey: dsKey, baseURL: 'https://api.deepseek.com/v1' })
    const resp = await ds.chat.completions.create({ model, messages, max_tokens: maxTokens, temperature: 0.1 })
    return resp.choices[0]?.message?.content ?? ''
  }

  // ── OpenAI (gpt-*) ─────────────────────────────────────────────────────────
  if (model.startsWith('gpt')) {
    const currentKey = keyManager.getNextKey()
    const openai = new OpenAI({ apiKey: currentKey })
    try {
      const resp = await openai.chat.completions.create({
        model: model === 'gpt-4-turbo' ? 'gpt-4-turbo' : 'gpt-4o',
        messages,
        max_tokens: maxTokens,
        temperature: 0.1,
      })
      keyManager.markSuccess(currentKey)
      return resp.choices[0]?.message?.content ?? ''
    } catch (err: any) {
      keyManager.markError(currentKey)
      throw err
    }
  }

  // ── Anthropic (claude-*) ───────────────────────────────────────────────────
  const anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
  const anthropicResp = await anthropicClient.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: maxTokens,
    system: systemContent || undefined,
    messages: rest.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  })
  const block = anthropicResp.content[0]
  return block.type === 'text' ? block.text : ''
}

