// Minimal type declarations for the Puter.js global (https://js.puter.com/v2/)
interface PuterAIStreamChunk {
  text?: string
  [key: string]: unknown
}

interface PuterAIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface PuterAIChatOptions {
  model?: string
  stream?: boolean
}

interface PuterAI {
  chat(
    messages: PuterAIMessage[] | string,
    options?: PuterAIChatOptions
  ): Promise<AsyncIterable<PuterAIStreamChunk> | PuterAIStreamChunk>
}

interface Puter {
  ai: PuterAI
}

declare global {
  interface Window {
    puter?: Puter
  }
  const puter: Puter | undefined
}

export {}
