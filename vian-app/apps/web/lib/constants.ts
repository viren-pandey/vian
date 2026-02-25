export const MODELS = [
  // ── Gemini — 5-key rotation (free tier) ─────────────────────────────────
  { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', provider: 'Google' as const },
  { id: 'gemini-1.5-pro',   label: 'Gemini 1.5 Pro',   provider: 'Google' as const },
  // ── Groq — Free tier ────────────────────────────────────────────────────────
  { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B',      provider: 'Groq (Free)' as const },
  { id: 'llama-3.1-8b-instant',    label: 'Llama 3.1 8B (Fast)', provider: 'Groq (Free)' as const },
  // ── DeepSeek ────────────────────────────────────────────────────────────────
  { id: 'deepseek-chat',     label: 'DeepSeek V3', provider: 'DeepSeek' as const },
  { id: 'deepseek-reasoner', label: 'DeepSeek R1', provider: 'DeepSeek' as const },
  // ── OpenAI ──────────────────────────────────────────────────────────────────
  { id: 'gpt-4o',      label: 'GPT-4o',      provider: 'OpenAI' as const },
  { id: 'gpt-4-turbo', label: 'GPT-4 Turbo', provider: 'OpenAI' as const },
  // ── Anthropic ───────────────────────────────────────────────────────────────
  { id: 'claude-3-5-sonnet', label: 'Claude 3.5 Sonnet', provider: 'Anthropic' as const },
] as const

export type ModelId = (typeof MODELS)[number]['id']

export const EXAMPLE_PROMPTS = [
  'Todo app with drag and drop',
  'E-commerce store with cart',
  'Blog with auth',
  'Analytics dashboard',
  'Kanban board',
  'Chat app with rooms',
]

export const API_BASE = '/api'
export const ALLOWED_FILE_PREFIXES = ['apps/web/', 'apps/api/', 'packages/']
