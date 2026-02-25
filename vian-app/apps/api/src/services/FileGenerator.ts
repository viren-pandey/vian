import { callLLM, type SupportedModel } from './LLMService'
import type { GeneratedFile } from '@vian/shared-types'

const SYSTEM_PROMPT = `You are VIAN, an expert full-stack Next.js application generator.

When given a user prompt, generate a COMPLETE, production-ready Next.js 14 application.

RULES:
1. Always use the App Router (app/ directory)
2. Use TypeScript for ALL files
3. Use Tailwind CSS for styling
4. Include package.json with all required dependencies
5. Include next.config.js and tailwind.config.js
6. Generate REAL, working code — not placeholders
7. Respond ONLY with valid JSON in this exact format:

{
  "files": [
    {
      "path": "relative/path/to/file.tsx",
      "name": "file.tsx",
      "content": "...full file content...",
      "language": "typescript",
      "isDirectory": false
    }
  ]
}

DO NOT include markdown, explanations, or any text outside the JSON.`

export async function generateFiles(
  prompt: string,
  model: SupportedModel
): Promise<GeneratedFile[]> {
  const raw = await callLLM(
    model,
    [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Generate a complete Next.js 14 application for: ${prompt}`,
      },
    ],
    16384
  )

  // Strip markdown code fences if the LLM wraps the JSON
  const cleaned = raw
    .replace(/^```(?:json)?\n?/, '')
    .replace(/\n?```$/, '')
    .trim()

  let parsed: { files: GeneratedFile[] }
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    throw new Error(
      'LLM returned invalid JSON. Raw response: ' + raw.slice(0, 500)
    )
  }

  if (!Array.isArray(parsed.files)) {
    throw new Error('LLM response missing "files" array')
  }

  return parsed.files
}
