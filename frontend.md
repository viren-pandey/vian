# VIAN — AI Full-Stack App Generator
### Complete System Prompt for GitHub Copilot / Cursor / Claude
> Read every word of this document before writing a single line of code.
> This is not a suggestion. This is the contract.

---

## WHAT YOU ARE BUILDING

VIAN is an AI-powered full-stack web application generator.

The user types a prompt. VIAN generates a complete, running Next.js application — streamed file by file — with a live preview rendered in the browser using WebContainers. The user can then edit the app using AI chat and share or export the result.

Think: Bolt.new, but cleaner. More minimal. More focused.

---

## THE GOLDEN RULES

These rules override everything else. If any generated code violates these rules, it is wrong.

```
1. Never show JSON to the user. Ever.
2. Never show "Structured Plan", "Generation Progress", or any debug UI.
3. Preview MUST be a live running Next.js app — not an HTML file.
4. File structure MUST follow the monorepo schema below. Zero deviation.
5. Code must be production-ready. No TODOs. No placeholders. No empty functions.
6. Stream files one by one. Never dump everything at once.
7. page.tsx must render visible UI the moment it loads. No blank screens.
8. The UI must be minimal, clean, and fast. No clutter. No noise.
```

---

## VISUAL DESIGN SYSTEM — BOLT-INSPIRED, VIAN-REFINED

### Design Philosophy

VIAN's UI is built on one principle: **the app being generated is the hero — not the interface.**

Everything in the UI steps back. The code editor, the file explorer, the preview panel — they are tools, not decorations. The interface should feel like it disappears when you're working.

Inspiration:
- **Bolt.new** — Dark, focused, three-panel studio. Clean toolbar. No marketing in the workspace.
- **v0 by Vercel** — Minimal chat + preview. Typography-first. Lots of breathing room.
- **Flowise** — Functional density. Dark panels. Subtle borders. Professional.

The result: a dark, sharp, typographically refined tool. Confident without being loud.

---

### Color Palette

```css
:root {
  /* Backgrounds */
  --bg-base:        #0d0d0d;   /* Page background — near black */
  --bg-surface:     #141414;   /* Panel background */
  --bg-elevated:    #1a1a1a;   /* Hover states, selected items */
  --bg-overlay:     #222222;   /* Dropdowns, tooltips */

  /* Borders */
  --border-subtle:  #1f1f1f;   /* Between panels — barely visible */
  --border-default: #2a2a2a;   /* Input outlines, card edges */
  --border-strong:  #3a3a3a;   /* Active focus rings */

  /* Text */
  --text-primary:   #f0f0f0;   /* Main UI text */
  --text-secondary: #888888;   /* Labels, placeholders, breadcrumbs */
  --text-muted:     #555555;   /* Disabled, timestamps */
  --text-code:      #e2e8f0;   /* Code inside editor */

  /* Accent — Electric Blue */
  --accent:         #3b82f6;   /* Primary CTA, active file, cursor */
  --accent-hover:   #2563eb;   /* Hover on accent */
  --accent-dim:     #1d3a6e;   /* Subtle accent backgrounds */
  --accent-glow:    rgba(59, 130, 246, 0.15); /* Pulsing generation glow */

  /* Semantic */
  --success:        #22c55e;   /* File complete ✓ */
  --warning:        #f59e0b;   /* File warning */
  --error:          #ef4444;   /* File error ✗ */
  --generating:     #3b82f6;   /* File currently streaming ● */
}
```

---

### Typography

```css
/* Import in globals.css */
@import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600&family=Geist+Mono:wght@400;500&display=swap');

:root {
  --font-ui:   'Geist', -apple-system, sans-serif;       /* All UI text */
  --font-code: 'Geist Mono', 'Fira Code', monospace;     /* Editor, file paths, code */
}

/* Type scale */
--text-xs:   11px;   /* File tree labels, timestamps */
--text-sm:   12px;   /* Secondary UI, breadcrumbs */
--text-base: 13px;   /* Primary UI text — intentionally small and sharp */
--text-md:   14px;   /* Chat messages, input fields */
--text-lg:   16px;   /* Panel headers */
--text-xl:   20px;   /* Project name in toolbar */
```

---

### Spacing System

```css
/* Use these values only — never arbitrary spacing */
--space-1:  4px;
--space-2:  8px;
--space-3:  12px;
--space-4:  16px;
--space-5:  20px;
--space-6:  24px;
--space-8:  32px;
--space-10: 40px;
--space-12: 48px;
```

---

### Component Design Specs

#### Toolbar (Top Bar)
```
Height: 44px
Background: var(--bg-surface)
Border-bottom: 1px solid var(--border-subtle)
Padding: 0 16px

Left:   ◆ VIAN logo (16px, white) + project name (14px, --text-secondary)
Center: [nothing — intentionally empty]
Right:  Model selector dropdown + [Share] + [Export] buttons
```

#### File Explorer Panel
```
Width: 220px (fixed, not resizable on mobile)
Background: var(--bg-base)
Border-right: 1px solid var(--border-subtle)
Padding-top: 8px

Section header: 10px uppercase tracking-widest --text-muted
File row height: 28px
File row padding: 0 12px
File indent per level: 12px
Active file: background var(--bg-elevated), text var(--text-primary)
Hover: background rgba(255,255,255,0.03)

File status dot:
  ○ Queued:     6px circle, --text-muted, opacity 0.4
  ● Generating: 6px circle, var(--accent), pulse animation 1.5s infinite
  ✓ Complete:   10px checkmark icon, var(--success), opacity 0.8
  ✗ Error:      10px x icon, var(--error)
```

#### Code Editor Panel
```
Flex: 1 (takes remaining width between explorer and preview)
Background: var(--bg-base)
Font: var(--font-code), 13px, line-height 1.7

Tab bar:
  Height: 36px
  Background: var(--bg-surface)
  Border-bottom: 1px solid var(--border-subtle)
  Tab: padding 0 16px, --text-secondary
  Active tab: --text-primary + bottom border 1px var(--accent)
  Close button: × appears on hover only

Editor theme: Custom dark — background #0d0d0d, no line highlight
Line numbers: --text-muted
Scrollbar: 4px wide, var(--bg-overlay), no track
```

#### Preview Panel
```
Width: 40% (resizable)
Background: var(--bg-surface)
Border-left: 1px solid var(--border-subtle)

Preview header:
  Height: 36px
  Shows: ● Running  localhost:3000  [Refresh icon]
  Background: var(--bg-surface)
  Border-bottom: 1px solid var(--border-subtle)

iframe:
  Width: 100%
  Height: calc(100% - 36px)
  Border: none
  Background: white (the generated app renders here)

Loading state:
  Show subtle skeleton shimmer — not a spinner
  Text: "Starting dev server..." in --text-muted, center

Error state:
  Dark red background tint
  Error message in --text-secondary
  [Retry] button
```

#### Chat Panel (Bottom of Explorer)
```
Position: Fixed bottom of the left panel
Height: auto, max 200px
Background: var(--bg-surface)
Border-top: 1px solid var(--border-subtle)
Padding: 12px

Model selector:
  Style: ghost button, 12px, --text-muted
  Shows: "GPT-4o ▾" or "Claude 3.5 ▾"
  Dropdown on click — no border, no shadow

Input field:
  Background: var(--bg-elevated)
  Border: 1px solid var(--border-default)
  Border-radius: 8px
  Padding: 10px 12px
  Font: 13px var(--font-ui)
  Placeholder: "Edit your app..." in --text-muted
  On focus: border var(--border-strong), no glow

Send button:
  Icon only: arrow right 16px
  Background: var(--accent)
  Border-radius: 6px
  Width/height: 32px
  Hover: var(--accent-hover)
```

---

### Animation Specs

```css
/* File generating pulse */
@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: 0.4; transform: scale(0.85); }
}
.file-generating .status-dot {
  animation: pulse-dot 1.4s ease-in-out infinite;
  background: var(--accent);
  box-shadow: 0 0 6px var(--accent-glow);
}

/* File tree item appearing */
@keyframes file-appear {
  from { opacity: 0; transform: translateX(-4px); }
  to   { opacity: 1; transform: translateX(0); }
}
.file-item {
  animation: file-appear 0.15s ease-out forwards;
}

/* Preview fade in when ready */
@keyframes preview-ready {
  from { opacity: 0; }
  to   { opacity: 1; }
}
.preview-iframe.ready {
  animation: preview-ready 0.3s ease-out forwards;
}

/* Toolbar generation indicator */
@keyframes gen-shimmer {
  0%   { background-position: -200px 0; }
  100% { background-position: 200px 0; }
}
.generating-bar {
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    var(--accent) 50%,
    transparent 100%
  );
  background-size: 400px 1px;
  animation: gen-shimmer 1.5s linear infinite;
}
```

---

### Home Page (Prompt Input Screen)

```
Layout: Full screen, centered vertically and horizontally
Background: var(--bg-base)

Logo: ◆ VIAN — 24px, Geist, white, centered
Tagline: "Build full-stack apps with AI" — 14px, --text-secondary, centered
Spacing below tagline: 48px

Prompt input:
  Width: 640px max
  Min-height: 80px, auto-expand
  Background: var(--bg-surface)
  Border: 1px solid var(--border-default)
  Border-radius: 12px
  Padding: 16px
  Font: 15px var(--font-ui), --text-primary
  Placeholder: "What do you want to build?"
  On focus: border var(--accent), no outer glow

Below input (same row, right-aligned):
  Model selector (ghost) + [Generate →] button

Generate button:
  Background: var(--accent)
  Padding: 10px 20px
  Border-radius: 8px
  Font: 13px 500 weight
  Text: "Generate"
  Hover: var(--accent-hover), translateY(-1px)
  Active: translateY(0)

Below input (left-aligned, small):
  Example prompts as chips:
  "Todo app"  "E-commerce store"  "Blog with auth"  "Dashboard"
  Style: 11px, var(--bg-elevated), --text-muted, border-radius 20px
  On click: fills the prompt input
```

---

### Studio Page Layout (3-Panel)

```
Full viewport height
Display: flex, flex-direction: column

[Toolbar — 44px fixed]
[Main area — flex: 1, display: flex, flex-direction: row]
  [Explorer — 220px fixed width]
  [Editor — flex: 1]
  [Preview — 40% width]
[Status bar — 24px fixed bottom]

Status bar:
  Background: var(--bg-surface)
  Border-top: 1px solid var(--border-subtle)
  Font: 11px var(--font-code), --text-muted
  Left: "● 12 files generated"  or  "◌ Generating page.tsx..."
  Right: TypeScript errors count (green if 0, red if > 0)
```

---

### Tailwind Config

```typescript
// apps/web/tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base:     '#0d0d0d',
        surface:  '#141414',
        elevated: '#1a1a1a',
        overlay:  '#222222',
        accent:   '#3b82f6',
        border: {
          subtle:  '#1f1f1f',
          default: '#2a2a2a',
          strong:  '#3a3a3a',
        },
        text: {
          primary:   '#f0f0f0',
          secondary: '#888888',
          muted:     '#555555',
        },
      },
      fontFamily: {
        ui:   ['Geist', 'sans-serif'],
        code: ['Geist Mono', 'monospace'],
      },
      fontSize: {
        '2xs': '11px',
        xs:    '12px',
        sm:    '13px',
        base:  '14px',
      },
      animation: {
        'pulse-dot':  'pulse-dot 1.4s ease-in-out infinite',
        'file-appear': 'file-appear 0.15s ease-out forwards',
        'gen-shimmer': 'gen-shimmer 1.5s linear infinite',
      },
    },
  },
  plugins: [],
}

export default config
```

---

## PROJECT STRUCTURE — STRICT MONOREPO

```
vian-app/
├── apps/
│   ├── web/                          ← Next.js 14 App Router
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx              ← Landing / prompt input
│   │   │   ├── globals.css
│   │   │   └── studio/
│   │   │       ├── layout.tsx        ← Studio shell (Explorer + Editor + Preview)
│   │   │       └── [projectId]/
│   │   │           └── page.tsx      ← Active project view
│   │   ├── components/
│   │   │   ├── studio/
│   │   │   │   ├── FileExplorer.tsx
│   │   │   │   ├── CodeEditor.tsx
│   │   │   │   ├── PreviewPanel.tsx
│   │   │   │   ├── ChatPanel.tsx
│   │   │   │   └── StatusBar.tsx
│   │   │   └── ui/
│   │   │       ├── Button.tsx
│   │   │       ├── Input.tsx
│   │   │       └── Spinner.tsx
│   │   ├── hooks/
│   │   │   ├── useWebContainer.ts
│   │   │   ├── useGeneration.ts
│   │   │   ├── useFileTree.ts
│   │   │   └── useChat.ts
│   │   ├── lib/
│   │   │   ├── api.ts
│   │   │   ├── utils.ts
│   │   │   └── constants.ts
│   │   ├── stores/
│   │   │   └── projectStore.ts       ← Zustand global state
│   │   ├── next.config.js            ← MUST include COOP/COEP headers
│   │   ├── tailwind.config.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── api/                          ← Express backend
│       ├── src/
│       │   ├── index.ts
│       │   ├── routes/
│       │   │   ├── generate.ts       ← POST /api/generate (SSE)
│       │   │   ├── edit.ts           ← POST /api/edit (SSE)
│       │   │   ├── projects.ts       ← GET/POST /api/projects
│       │   │   └── export.ts         ← POST /api/export (zip)
│       │   ├── services/
│       │   │   ├── LLMService.ts     ← OpenAI + Anthropic router
│       │   │   ├── FileValidator.ts  ← Path + TypeScript validation
│       │   │   └── ProjectService.ts
│       │   └── middleware/
│       │       └── errorHandler.ts
│       ├── tsconfig.json
│       └── package.json
│
├── packages/
│   ├── shared-types/
│   │   ├── src/
│   │   │   └── index.ts              ← All shared TypeScript types
│   │   └── package.json
│   └── prisma/
│       ├── schema.prisma
│       └── package.json
│
├── package.json                      ← pnpm workspace root
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── .env.example
└── .gitignore
```

### FORBIDDEN PATHS — VALIDATOR MUST REJECT THESE

```
/frontend/        ← NEVER
/backend/         ← NEVER
/src/ at root     ← NEVER
/lib/ at root     ← NEVER
/components/ at root ← NEVER
Any path not starting with apps/, packages/, or a root config file ← NEVER
```

---

## TECH STACK — NON-NEGOTIABLE

| Layer | Technology | Version |
|---|---|---|
| Frontend Framework | Next.js App Router | 14.x |
| Language | TypeScript strict mode | 5.x |
| Styling | Tailwind CSS | 3.x |
| Preview Engine | @webcontainer/api | latest |
| Code Editor | @monaco-editor/react | latest |
| State | Zustand | 4.x |
| Backend | Express + TypeScript | 4.x |
| Database ORM | Prisma | 5.x |
| Database | PostgreSQL | — |
| Package Manager | pnpm workspaces | 8.x |
| Icons | lucide-react | latest |
| AI (OpenAI) | openai SDK | 4.x |
| AI (Anthropic) | @anthropic-ai/sdk | latest |

---

## THE UI LAYOUT — EXACTLY THIS

```
┌─────────────────────────────────────────────────────────────────────┐
│  ◆ VIAN          my-todo-app                    [Share]  [Export]   │
├──────────────┬──────────────────────────────┬───────────────────────┤
│              │                              │                       │
│  EXPLORER    │  EDITOR                      │  PREVIEW              │
│              │                              │                       │
│  ▼ apps/     │  apps/web/app/page.tsx  ×    │  ┌─────────────────┐  │
│    ▼ web/    │                              │  │                 │  │
│      ● page  │  1  'use client'             │  │   [Live App]    │  │
│      ✓ layout│  2                           │  │                 │  │
│      ✓ globals  3  import { useState }...   │  │   Next.js       │  │
│    ▼ api/    │  4                           │  │   Running       │  │
│      ✓ index │  5  export default function  │  │   :3000         │  │
│  ▼ packages/ │  6  Page() {                 │  └─────────────────┘  │
│    ✓ schema  │  7    return (               │                       │
│              │  8      <main>               │  ● localhost:3000      │
├──────────────┤                              ├───────────────────────┤
│ MODEL        │  ...                         │                       │
│ [GPT-4o ▼]  │                              │                       │
│              │                              │                       │
│ > Edit the   │                              │                       │
│   button     │                              │                       │
│   color to   │                              │                       │
│   blue       │                              │                       │
│ [Send →]     │                              │                       │
└──────────────┴──────────────────────────────┴───────────────────────┘
```

### File Status Icons

| Icon | Meaning |
|---|---|
| `○` | Queued — not yet generated |
| `●` (pulsing blue) | Currently being written |
| `✓` | Complete — clickable |
| `✗` (red) | Error — click to see details |

### What is NEVER shown in the UI

- JSON of any kind
- "Structured Plan" panels
- "Generation Progress" cards
- "Stream: open" status
- "queued_sync" labels
- Raw API responses
- Debug information of any kind

---

## GENERATION PIPELINE — EXACT FLOW

```
USER SUBMITS PROMPT
        │
        ▼
┌───────────────────┐
│  1. PLAN          │  2 seconds
│                   │
│  LLM returns      │
│  file manifest    │  ← Internal only. Never shown to user.
│  [{path, order}]  │
│                   │
│  UI: file tree    │
│  appears with     │
│  grey ○ icons     │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│  2. STREAM        │  10–30 seconds
│                   │
│  For each file:   │
│  - SSE chunk →    │
│  - Write to       │
│    WebContainer   │
│  - ○ becomes ●   │
│    (pulsing)      │
│  - ● becomes ✓   │
│    on complete    │
│  - Editor shows   │
│    active file    │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│  3. BOOT          │  Parallel with step 2
│                   │
│  When             │
│  package.json     │
│  exists:          │
│  → npm install    │
│                   │
│  When page.tsx    │
│  exists:          │
│  → next dev       │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│  4. PREVIEW       │  Instant once server ready
│                   │
│  server-ready     │
│  event fires →    │
│  iframe.src = url │
│                   │
│  User sees live   │
│  Next.js app      │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│  5. EDIT          │  On demand
│                   │
│  User types in    │
│  chat panel →     │
│  LLM identifies   │
│  affected files → │
│  Only those files │
│  regenerated →    │
│  HMR refreshes    │
│  preview          │
└───────────────────┘
```

---

## WEBCONTAINER INTEGRATION — EXACT IMPLEMENTATION

This is the most critical part. Get this right and preview works forever.

### Step 1 — Required HTTP Headers in next.config.js

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
```

Without these two headers, WebContainer will not boot. Full stop.

### Step 2 — Boot WebContainer Once

```typescript
// hooks/useWebContainer.ts
import { WebContainer } from '@webcontainer/api'
import { useEffect, useRef, useState } from 'react'

export function useWebContainer() {
  const instanceRef = useRef<WebContainer | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'installing' | 'running' | 'error'>('idle')

  useEffect(() => {
    WebContainer.boot().then((instance) => {
      instanceRef.current = instance

      instance.on('server-ready', (port, url) => {
        setPreviewUrl(url)
        setStatus('running')
      })
    })
  }, [])

  async function writeFile(path: string, content: string) {
    if (!instanceRef.current) return
    const parts = path.split('/')
    const dir = parts.slice(0, -1).join('/')
    if (dir) {
      await instanceRef.current.fs.mkdir(dir, { recursive: true })
    }
    await instanceRef.current.fs.writeFile(path, content)
  }

  async function installAndRun() {
    if (!instanceRef.current) return
    setStatus('installing')

    const install = await instanceRef.current.spawn('npm', ['install'])
    await install.exit

    await instanceRef.current.spawn('npm', ['run', 'dev'])
  }

  return { writeFile, installAndRun, previewUrl, status }
}
```

### Step 3 — Stream Files Then Boot

```typescript
// hooks/useGeneration.ts
export function useGeneration() {
  const { writeFile, installAndRun, previewUrl, status } = useWebContainer()

  async function generate(prompt: string, model: 'openai' | 'anthropic') {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, model }),
    })

    const reader = response.body!.getReader()
    const decoder = new TextDecoder()
    let packageJsonWritten = false

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const lines = decoder.decode(value).split('\n').filter(Boolean)

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const event = JSON.parse(line.slice(6))

        if (event.type === 'file') {
          await writeFile(event.path, event.content)
          updateFileStatus(event.path, 'complete')

          if (event.path === 'apps/web/package.json' && !packageJsonWritten) {
            packageJsonWritten = true
            installAndRun() // Boot in parallel — do not await
          }
        }
      }
    }
  }

  return { generate, previewUrl, status }
}
```

---

## AI SYSTEM PROMPT — SEND THIS TO LLM ON EVERY GENERATION

```
You are VIAN's code generation engine. Your job is to generate complete, production-ready Next.js applications.

OUTPUT FORMAT:
Return a stream of Server-Sent Events. Each event has this shape:
data: {"type": "file", "path": "apps/web/app/page.tsx", "content": "...full file content..."}

Rules for output:
- Return ONLY SSE events. No markdown. No explanation. No preamble.
- One event per file.
- Stream files in dependency order (package.json first, then layout, then page).

Rules for file paths:
- ONLY use these path prefixes: apps/web/, apps/api/, packages/
- NEVER use: /frontend, /backend, /src at root, or any unlisted prefix
- Root-level files allowed: package.json, pnpm-workspace.yaml, tsconfig.base.json, .env.example

Rules for code quality:
- TypeScript strict mode. No `any`. No implicit types.
- All imports must resolve within the monorepo.
- No TODO comments. No placeholder functions. Every function must be complete.
- Tailwind CSS only — no inline styles, no separate CSS files (except globals.css).
- Approved packages only: next, react, react-dom, typescript, tailwindcss, lucide-react, clsx, prisma, @prisma/client, next-auth (only if auth requested)

Rules for page.tsx:
- Must be completely self-contained on first render.
- Must import only from react and next built-ins on first generation.
- Must render a real, visible, styled UI immediately.
- Must use Tailwind classes. No blank screens. No loading spinners as the only content.

File generation order (always follow this):
1. apps/web/package.json
2. pnpm-workspace.yaml
3. apps/web/next.config.js
4. apps/web/tailwind.config.ts
5. apps/web/tsconfig.json
6. apps/web/app/globals.css
7. apps/web/app/layout.tsx
8. apps/web/app/page.tsx       ← Most important. Render real UI here.
9. All components, hooks, lib files
10. apps/api/package.json
11. apps/api/src/index.ts
12. All API routes and services
13. packages/prisma/schema.prisma
```

---

## BACKEND SSE ENDPOINT — /api/generate

```typescript
// apps/api/src/routes/generate.ts
import { Router, Request, Response } from 'express'
import { LLMService } from '../services/LLMService'
import { FileValidator } from '../services/FileValidator'

const router = Router()

router.post('/', async (req: Request, res: Response) => {
  const { prompt, model } = req.body

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()

  const llm = new LLMService(model)
  const validator = new FileValidator()

  try {
    for await (const file of llm.generateFiles(prompt)) {
      // Validate path before sending
      if (!validator.isValidPath(file.path)) {
        continue // Skip invalid paths silently, retry internally
      }

      // Validate TypeScript syntax
      if (!validator.isValidTypeScript(file.content, file.path)) {
        const fixed = await llm.fixFile(file)
        res.write(`data: ${JSON.stringify({ type: 'file', ...fixed })}\n\n`)
        continue
      }

      res.write(`data: ${JSON.stringify({ type: 'file', ...file })}\n\n`)
    }

    res.write(`data: ${JSON.stringify({ type: 'complete' })}\n\n`)
    res.end()
  } catch (err) {
    res.write(`data: ${JSON.stringify({ type: 'error', message: String(err) })}\n\n`)
    res.end()
  }
})

export default router
```

---

## FILE PATH VALIDATOR

```typescript
// apps/api/src/services/FileValidator.ts
export class FileValidator {
  private readonly ALLOWED_PREFIXES = [
    'apps/web/',
    'apps/api/',
    'packages/',
  ]

  private readonly ALLOWED_ROOT_FILES = [
    'package.json',
    'pnpm-workspace.yaml',
    'tsconfig.base.json',
    '.env.example',
    '.gitignore',
    'README.md',
  ]

  isValidPath(filePath: string): boolean {
    if (this.ALLOWED_ROOT_FILES.includes(filePath)) return true
    return this.ALLOWED_PREFIXES.some((prefix) => filePath.startsWith(prefix))
  }

  isValidTypeScript(content: string, path: string): boolean {
    if (!path.endsWith('.ts') && !path.endsWith('.tsx')) return true
    // Basic syntax check — look for unmatched braces
    const open = (content.match(/{/g) || []).length
    const close = (content.match(/}/g) || []).length
    return Math.abs(open - close) < 3 // Allow small variance
  }
}
```

---

## AI EDIT SYSTEM

When user types in chat to edit the app:

1. Send only the relevant files (max 3) to LLM — not the entire project
2. LLM returns only changed files
3. Write only changed files to WebContainer
4. Next.js HMR auto-refreshes preview

```typescript
// Edit system prompt
const EDIT_SYSTEM_PROMPT = `
You are editing an existing Next.js application.

You will receive:
1. The user's edit instruction
2. The current content of affected files (maximum 3 files)

Return ONLY:
data: {"type": "file", "path": "...", "content": "...full updated content..."}

Rules:
- Return ONLY the files that actually changed
- Preserve all existing functionality not mentioned in the edit
- Keep exact same import paths and folder structure
- No markdown. No explanation. SSE events only.
`
```

---

## ZUSTAND STORE — PROJECT STATE

```typescript
// stores/projectStore.ts
import { create } from 'zustand'

interface FileNode {
  path: string
  content: string
  status: 'queued' | 'generating' | 'complete' | 'error'
}

interface ProjectStore {
  projectName: string
  files: Record<string, FileNode>
  activeFile: string | null
  isGenerating: boolean
  previewUrl: string | null
  model: 'openai' | 'anthropic'

  setProjectName: (name: string) => void
  setFile: (path: string, node: Partial<FileNode>) => void
  setActiveFile: (path: string) => void
  setIsGenerating: (val: boolean) => void
  setPreviewUrl: (url: string) => void
  setModel: (model: 'openai' | 'anthropic') => void
}

export const useProjectStore = create<ProjectStore>((set) => ({
  projectName: '',
  files: {},
  activeFile: null,
  isGenerating: false,
  previewUrl: null,
  model: 'openai',

  setProjectName: (name) => set({ projectName: name }),
  setFile: (path, node) =>
    set((state) => ({
      files: {
        ...state.files,
        [path]: { ...state.files[path], path, ...node } as FileNode,
      },
    })),
  setActiveFile: (path) => set({ activeFile: path }),
  setIsGenerating: (val) => set({ isGenerating: val }),
  setPreviewUrl: (url) => set({ previewUrl: url }),
  setModel: (model) => set({ model }),
}))
```

---

## ENVIRONMENT VARIABLES

```env
# .env.example

# AI Keys
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/vian

# Auth
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=http://localhost:3000

# API
API_URL=http://localhost:4000
```

---

## BUILD ORDER — FOLLOW THIS EXACTLY

Do not skip steps. Do not reorder. Build in this sequence.

```
PHASE 1 — Foundation (Do this first)
  □ 1. Set up pnpm monorepo with workspace config
  □ 2. Create apps/web (Next.js 14 + TypeScript + Tailwind)
  □ 3. Create apps/api (Express + TypeScript)
  □ 4. Create packages/shared-types
  □ 5. Create packages/prisma with schema
  □ 6. Set COOP/COEP headers in next.config.js

PHASE 2 — Backend (Do this second)
  □ 7. Build LLMService (OpenAI + Anthropic router)
  □ 8. Build FileValidator (path + TypeScript checks)
  □ 9. Build /api/generate SSE endpoint
  □ 10. Build /api/edit SSE endpoint
  □ 11. Build /api/projects (save + load)
  □ 12. Build /api/export (zip download)

PHASE 3 — Frontend Core (Do this third)
  □ 13. Build Zustand project store
  □ 14. Build useWebContainer hook
  □ 15. Build useGeneration hook (SSE consumer)
  □ 16. Build useChat hook (edit flow)
  □ 17. Build FileExplorer component
  □ 18. Build CodeEditor component (Monaco)
  □ 19. Build PreviewPanel component (iframe → WebContainer URL)
  □ 20. Build ChatPanel component
  □ 21. Build Studio layout (3-panel: Explorer + Editor + Preview)
  □ 22. Build Home page (prompt input)

PHASE 4 — Wire Everything (Do this fourth)
  □ 23. Connect useGeneration → FileExplorer (file status updates)
  □ 24. Connect useGeneration → CodeEditor (show active file)
  □ 25. Connect useWebContainer → PreviewPanel (iframe src = URL)
  □ 26. Connect useChat → targeted file regeneration
  □ 27. Wire model selector to API calls

PHASE 5 — Polish (Do this last)
  □ 28. Add Share feature (save to DB, generate URL)
  □ 29. Add Export feature (zip download)
  □ 30. Add error states (file error icon, retry button)
  □ 31. Add generation progress (bottom status bar)
  □ 32. Final UI polish (spacing, transitions, dark theme)
```

---

## SUCCESS CHECKLIST

The build is complete when every single one of these works:

```
□ User types a prompt and clicks Generate
□ File tree appears immediately with grey icons
□ Files light up one by one as they are written (pulsing dot → checkmark)
□ Preview panel shows a LIVE RUNNING Next.js app (not HTML, not blank)
□ User can switch between GPT-4o and Claude 3.5 Sonnet
□ User types an edit in chat — only changed files update — preview refreshes
□ User can export project as a working .zip
□ User can share a URL that opens the project in read-only view
□ No JSON is ever shown to the user in the main UI — ever
□ File structure always matches the monorepo schema exactly
□ TypeScript has zero errors across the entire codebase
□ pnpm install runs without errors from the root
□ The app cold-starts and shows preview within 45 seconds of clicking Generate
```

---

*VIAN — Built by Viren.*
*Architecture designed for production. Zero compromise on quality.*