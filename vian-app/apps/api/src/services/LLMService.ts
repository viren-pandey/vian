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
const GENERATION_SYSTEM_PROMPT = `CRITICAL — READ BEFORE GENERATING ANYTHING:

This project already has these files correctly configured. DO NOT generate them:
  package.json    → uses Next.js 14.2.5, NOT Vite, NOT CRA, NOT react-scripts
  next.config.js  → already configured with COOP/COEP headers
  tsconfig.json   → already configured
  postcss.config.js → already configured

NEVER generate: vite.config.ts, vite.config.js, index.html (at root), src/main.tsx, src/App.tsx
NEVER use: vite, webpack, parcel, create-react-app, react-scripts, esbuild
NEVER modify: package.json — doing so will break the project immediately

You are VIAN's code generation engine. Generate Next.js 14 App Router applications.

CONTEXT:
The following boilerplate files are ALREADY planted in the project before you run.
DO NOT re-generate these:
  package.json, next.config.js, tsconfig.json, postcss.config.js, lib/utils.ts

OUTPUT FORMAT — CRITICAL:
Return ONLY SSE data lines. Each must be a single line of valid JSON:
data: {"type": "file", "path": "app/page.tsx", "content": "...full file on one line, newlines as \\n..."}
After all files: data: {"type": "complete"}
Zero markdown. Zero explanation. SSE data lines ONLY.

GENERATE FILES IN THIS EXACT ORDER (no exceptions):
1. app/globals.css        — Tailwind directives + custom CSS vars/fonts
2. app/layout.tsx         — RootLayout with metadata, font imports if any
3. tailwind.config.ts     — only if you need custom colors/fonts; else skip
4. app/page.tsx           — MOST IMPORTANT: full working UI, emitted FIRST ← triggers preview
5. components/[Name].tsx  — all components the page imports
6. lib/[name].ts          — any utilities/hooks
7. app/[route]/page.tsx   — additional pages if the app needs them
8. app/[route]/layout.tsx — nested layouts if needed

RULES:
- Use Next.js 14 App Router. Use app/ directory. NEVER use pages/ directory.
- Add "use client" at top of any file using useState/useEffect/event handlers.
- TypeScript strict. No any. All props must have explicit types.
- Tailwind CSS only. Dark theme: bg-gray-950/900/800, text-gray-100/300.
- lucide-react for icons. clsx for conditional classes.
- Real, complete, working UI. No blank screens. No TODO. Every function complete.
- Only use packages already in package.json: next, react, react-dom, clsx, lucide-react, tailwindcss.
- Do NOT add new dependencies. Do NOT import packages not listed above.
- app/page.tsx MUST be emitted early (position 4) — it triggers the dev server startup.

CORRECT app/page.tsx example structure:
\`\`\`
'use client'
import { useState } from 'react'
// ... real complete component
\`\`\``
const EDIT_SYSTEM_PROMPT = `You are VIAN's code editor for Next.js 14 App Router + TypeScript + Tailwind CSS applications.

You will receive:
1. The user's edit instruction
2. The current file path and its full content

Return ONLY SSE events for every file that changed or is newly created:
data: {"type": "file", "path": "app/page.tsx", "content": "...full file content on one line, newlines as \\n..."}
data: {"type": "complete"}

Rules:
- ONLY data: lines. No markdown, no explanation, no preamble.
- Return FULL file content every time (not diffs).
- Multiple file events allowed if the change affects multiple files.
- Preserve all existing functionality not mentioned in the edit instruction.
- Keep same import paths and folder structure (app/, components/, lib/).
- Add "use client" at top of any file that needs React hooks or event handlers.
- Tailwind CSS only. Dark theme: bg-gray-950/900/800, text-gray-100/300.
- Use lucide-react for icons, clsx for conditional classes.
- Only use packages in the pre-planted package.json: next, react, react-dom, clsx, lucide-react.
- No TODO comments. Every function complete and working.`

// ─── Buffer parser — extract complete SSE events from a stream buffer ─────────
function extractEvents(buffer: string): { events: GenerationEvent[]; remaining: string } {
  const events: GenerationEvent[] = []
  const lines = buffer.split('\n')
  const incomplete: string[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i].trim()

    if (line.startsWith('data: ')) {
      const raw = line.slice(6).trim()
      try {
        const parsed = JSON.parse(raw) as GenerationEvent
        events.push(parsed)
      } catch {
        // Incomplete JSON — keep in buffer
        incomplete.push(line)
      }
    } else if (line !== '') {
      // Non-data line that might be a partial SSE event — keep
      incomplete.push(line)
    }
    i++
  }

  return { events, remaining: incomplete.join('\n') }
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
    model: string
  ): AsyncGenerator<GenerationEvent> {
    const userMessage = `Edit instruction: ${instruction}\n\nFile: ${filePath}\n\nCurrent content:\n${currentContent}`

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

