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

## MULTIPLE OPENAI KEYS — RATE-LIMIT AWARE ROTATION

VIAN has 10+ OpenAI API keys. The system must rotate between them automatically
using rate-limit aware switching. Never pause generation. Never fail silently.
If one key hits its limit, switch to the next healthy key instantly.

### .env.example

```env
# OpenAI Keys — Add as many as you have
OPENAI_API_KEY_1=sk-...
OPENAI_API_KEY_2=sk-...
OPENAI_API_KEY_3=sk-...
OPENAI_API_KEY_4=sk-...
OPENAI_API_KEY_5=sk-...
OPENAI_API_KEY_6=sk-...
OPENAI_API_KEY_7=sk-...
OPENAI_API_KEY_8=sk-...
OPENAI_API_KEY_9=sk-...
OPENAI_API_KEY_10=sk-...
# Add more as OPENAI_API_KEY_11, _12, etc.

# Anthropic
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

### KeyManager Service — Rate-Limit Aware Rotation

```typescript
// apps/api/src/services/KeyManager.ts

interface KeyState {
  key: string
  isHealthy: boolean
  rateLimitedUntil: number | null   // timestamp when key becomes usable again
  requestCount: number               // total requests made
  errorCount: number                 // consecutive errors
  lastUsed: number                   // timestamp of last use
}

export class KeyManager {
  private keys: KeyState[] = []
  private currentIndex: number = 0

  constructor() {
    const loadedKeys: string[] = []
    let i = 1
    while (process.env[`OPENAI_API_KEY_${i}`]) {
      loadedKeys.push(process.env[`OPENAI_API_KEY_${i}`]!)
      i++
    }
    // Fallback to single key
    if (loadedKeys.length === 0 && process.env.OPENAI_API_KEY) {
      loadedKeys.push(process.env.OPENAI_API_KEY)
    }
    if (loadedKeys.length === 0) {
      throw new Error('No OpenAI API keys found in environment variables.')
    }
    this.keys = loadedKeys.map((key) => ({
      key,
      isHealthy: true,
      rateLimitedUntil: null,
      requestCount: 0,
      errorCount: 0,
      lastUsed: 0,
    }))
    console.log(`KeyManager: Loaded ${this.keys.length} OpenAI API keys.`)
  }

  getNextKey(): string {
    const now = Date.now()
    const total = this.keys.length

    for (let attempt = 0; attempt < total; attempt++) {
      const index = (this.currentIndex + attempt) % total
      const k = this.keys[index]

      // Skip still-rate-limited keys
      if (k.rateLimitedUntil && now < k.rateLimitedUntil) continue

      // Restore recovered keys
      if (k.rateLimitedUntil && now >= k.rateLimitedUntil) {
        k.isHealthy = true
        k.rateLimitedUntil = null
        k.errorCount = 0
      }

      // Skip permanently broken keys
      if (!k.isHealthy && k.errorCount >= 5) continue

      // Use this key
      this.currentIndex = (index + 1) % total
      k.lastUsed = now
      k.requestCount++
      return k.key
    }

    // All keys limited — find fastest recovery
    const soonest = this.keys
      .filter((k) => k.rateLimitedUntil !== null)
      .sort((a, b) => (a.rateLimitedUntil ?? 0) - (b.rateLimitedUntil ?? 0))[0]

    if (soonest) {
      const waitMs = (soonest.rateLimitedUntil ?? 0) - now
      throw new Error(`All keys rate limited. Fastest recovery in ${Math.ceil(waitMs / 1000)}s.`)
    }

    throw new Error('No healthy OpenAI API keys available.')
  }

  markRateLimited(key: string, retryAfterSeconds: number = 60) {
    const k = this.keys.find((k) => k.key === key)
    if (!k) return
    k.isHealthy = false
    k.rateLimitedUntil = Date.now() + retryAfterSeconds * 1000
    k.errorCount++
    console.warn(`KeyManager: Key rate limited for ${retryAfterSeconds}s. ${this.getHealthyCount()} keys remaining.`)
  }

  markError(key: string) {
    const k = this.keys.find((k) => k.key === key)
    if (!k) return
    k.errorCount++
    if (k.errorCount >= 5) {
      k.isHealthy = false
      console.error(`KeyManager: Key disabled after 5 consecutive errors.`)
    }
  }

  markSuccess(key: string) {
    const k = this.keys.find((k) => k.key === key)
    if (!k) return
    k.errorCount = 0
    k.isHealthy = true
  }

  getHealthyCount(): number {
    const now = Date.now()
    return this.keys.filter(
      (k) => k.isHealthy || (k.rateLimitedUntil !== null && now >= k.rateLimitedUntil)
    ).length
  }

  getStatus() {
    const now = Date.now()
    return this.keys.map((k, i) => ({
      key: `Key #${i + 1}`,
      status: k.rateLimitedUntil && now < k.rateLimitedUntil
        ? `rate_limited (${Math.ceil(((k.rateLimitedUntil ?? 0) - now) / 1000)}s remaining)`
        : k.isHealthy ? 'healthy' : 'error',
      totalRequests: k.requestCount,
      consecutiveErrors: k.errorCount,
    }))
  }
}

// Singleton — shared across entire API server
export const keyManager = new KeyManager()
```

---

### LLM Service — Auto Rotates Keys on Rate Limit

```typescript
// apps/api/src/services/LLMService.ts
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { keyManager } from './KeyManager'

export class LLMService {
  private anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

  async *generateFiles(prompt: string, model: 'openai' | 'anthropic') {
    if (model === 'anthropic') {
      yield* this.streamAnthropic(prompt)
    } else {
      yield* this.streamOpenAI(prompt)
    }
  }

  private async *streamOpenAI(prompt: string) {
    const MAX_RETRIES = 3

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const currentKey = keyManager.getNextKey()
      const openai = new OpenAI({ apiKey: currentKey })

      try {
        const stream = await openai.chat.completions.create({
          model: 'gpt-4o',
          max_tokens: 4096,
          stream: true,
          messages: [
            { role: 'system', content: GENERATION_SYSTEM_PROMPT },
            { role: 'user', content: prompt },
          ],
        })

        let buffer = ''
        for await (const chunk of stream) {
          buffer += chunk.choices[0]?.delta?.content ?? ''
          const { parsed, remaining } = extractEvents(buffer)
          for (const event of parsed) {
            keyManager.markSuccess(currentKey)
            yield event
          }
          buffer = remaining
        }
        return // Done — exit retry loop

      } catch (err: any) {
        if (err?.status === 429) {
          const retryAfter = parseInt(err?.headers?.['retry-after'] ?? '60', 10)
          keyManager.markRateLimited(currentKey, retryAfter)
          if (attempt < MAX_RETRIES - 1) {
            console.log(`Key rate limited. Switching to next key. Attempt ${attempt + 1}/${MAX_RETRIES}`)
            continue // Retry with next key immediately — no delay
          }
        } else {
          keyManager.markError(currentKey)
        }
        throw err
      }
    }
  }

  private async *streamAnthropic(prompt: string) {
    const stream = this.anthropic.messages.stream({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      system: GENERATION_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    })
    let buffer = ''
    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta') {
        buffer += chunk.delta.text ?? ''
        const { parsed, remaining } = extractEvents(buffer)
        for (const event of parsed) yield event
        buffer = remaining
      }
    }
  }
}

function extractEvents(buffer: string) {
  const lines = buffer.split('\n')
  const parsed = []
  let remaining = ''
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      try { parsed.push(JSON.parse(line.slice(6))) }
      catch { remaining += line + '\n' }
    }
  }
  return { parsed, remaining }
}
```

---

### Key Health Dashboard (Admin Route)

```typescript
// GET /api/admin/keys — Monitor key health without exposing values
router.get('/admin/keys', (req, res) => {
  res.json({
    totalKeys: keyManager['keys'].length,
    healthyKeys: keyManager.getHealthyCount(),
    status: keyManager.getStatus(),
  })
})
```

---



---

## BRANDING RULES — ENFORCE ACROSS ALL FILES

### Every package.json in the monorepo MUST include:

```json
{
  "author": "Viren",
  "description": "VIAN by Viren — AI-powered full-stack app generator",
  
}
```

This applies to:
- `package.json` (root)
- `apps/web/package.json`
- `apps/api/package.json`
- `packages/shared-types/package.json`
- `packages/prisma/package.json`
- `packages/ui-lib/package.json`

---

### Footer Component — appears on every page

```typescript
// apps/web/components/ui/Footer.tsx

export default function Footer() {
  return (
    <footer className="w-full border-t border-[#1f1f1f] bg-[#0d0d0d] px-6 py-3">
      <div className="flex items-center justify-between">

        {/* Left — Branding */}
        <div className="flex items-center gap-2">
          <span className="text-[#3b82f6] text-sm font-semibold tracking-tight">
            ◆ VIAN
          </span>
          <span className="text-[#555555] text-xs">by Viren</span>
        </div>

        {/* Center — Version */}
        <span className="text-[#555555] text-xs font-mono">
          v1.0.0
        </span>

        {/* Right — Links */}
        <div className="flex items-center gap-4">
          <a
            href="#"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#555555] text-xs hover:text-[#888888] transition-colors"
          >
            Docs
          </a>
          <a
            href="https://github.com/viren/vian"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#555555] text-xs hover:text-[#888888] transition-colors"
          >
            GitHub
          </a>
          <span className="text-[#333333] text-xs">
            © {new Date().getFullYear()} VIAN by Viren
          </span>
        </div>

      </div>
    </footer>
  )
}
```

### Footer usage — add to every layout

```typescript
// apps/web/app/layout.tsx
import Footer from '@/components/ui/Footer'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#0d0d0d] font-ui flex flex-col min-h-screen">
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}
```

### Studio layout footer — slim version inside the 3-panel workspace

```typescript
// apps/web/app/studio/layout.tsx
import Footer from '@/components/ui/Footer'

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen bg-[#0d0d0d] overflow-hidden">

      {/* Toolbar */}
      <div className="h-[44px] flex-shrink-0 border-b border-[#1f1f1f] bg-[#141414]">
        {/* Toolbar content */}
      </div>

      {/* Main 3-panel area */}
      <div className="flex flex-1 overflow-hidden">
        {children}
      </div>

      {/* Status bar — replaces full footer in studio */}
      <div className="h-[24px] flex-shrink-0 border-t border-[#1f1f1f] bg-[#141414]
                      flex items-center justify-between px-4">
        <span className="text-[11px] font-mono text-[#555555]">
          ◆ VIAN by Viren
        </span>
        <span className="text-[11px] font-mono text-[#555555]">
          {/* Dynamic status: "● Generating page.tsx..." or "✓ 12 files ready" */}
        </span>
        <span className="text-[11px] font-mono text-[#555555]">
          v1.0.0
        </span>
      </div>

    </div>
  )
}
```

### README.md branding header

```markdown
# ◆ VIAN by Viren

> AI-powered full-stack application generator.
> Generate, preview, edit, and deploy complete web apps from a single prompt.

Built by [Viren](https://github.com/viren) 
```

---


---


---

## LANDING PAGE — FULL UI SPEC & CODE

The landing page is the first thing every user sees. It must be:
- Stunning. Minimal. Dark.
- Instantly communicates what VIAN does in under 3 seconds
- No fluff. No stock photos. No generic SaaS layouts.
- Feels like a tool built by a developer, for developers
- Bolt.new meets Linear meets Vercel — sharp, confident, fast

---

### Landing Page Route

```
apps/web/app/page.tsx  ←  Public landing page
```

---

### Full Landing Page Component

```tsx
// apps/web/app/page.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Zap, Code2, Eye, Share2, ArrowRight,
  ChevronRight, Terminal, Layers, Lock
} from 'lucide-react'

// ─── Typing animation hook ───────────────────────────────────────────────────
function useTypingAnimation(phrases: string[], speed = 60, pause = 2000) {
  const [displayed, setDisplayed] = useState('')
  const [phraseIndex, setPhraseIndex] = useState(0)
  const [charIndex, setCharIndex] = useState(0)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const current = phrases[phraseIndex]
    const timeout = setTimeout(() => {
      if (!deleting) {
        setDisplayed(current.slice(0, charIndex + 1))
        if (charIndex + 1 === current.length) {
          setTimeout(() => setDeleting(true), pause)
        } else {
          setCharIndex((c) => c + 1)
        }
      } else {
        setDisplayed(current.slice(0, charIndex - 1))
        if (charIndex === 0) {
          setDeleting(false)
          setPhraseIndex((i) => (i + 1) % phrases.length)
        } else {
          setCharIndex((c) => c - 1)
        }
      }
    }, deleting ? speed / 2 : speed)
    return () => clearTimeout(timeout)
  }, [charIndex, deleting, phraseIndex, phrases, speed, pause])

  return displayed
}

// ─── Animated counter ─────────────────────────────────────────────────────────
function AnimatedNumber({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      let start = 0
      const step = Math.ceil(target / 60)
      const timer = setInterval(() => {
        start += step
        if (start >= target) { setCount(target); clearInterval(timer) }
        else setCount(start)
      }, 16)
      observer.disconnect()
    })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target])

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>
}

// ─── Main Landing Page ────────────────────────────────────────────────────────
export default function LandingPage() {
  const router = useRouter()
  const [prompt, setPrompt] = useState('')
  const typedText = useTypingAnimation([
    'a todo app with authentication',
    'an e-commerce store with Stripe',
    'a real-time chat application',
    'a dashboard with analytics',
    'a blog with markdown support',
    'a SaaS platform with billing',
  ])

  const examplePrompts = [
    'Todo app',
    'E-commerce store',
    'Blog with auth',
    'Analytics dashboard',
    'Chat application',
  ]

  function handleGenerate() {
    if (!prompt.trim()) return
    router.push(`/request-access?prompt=${encodeURIComponent(prompt)}`)
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-[#f0f0f0] font-['Geist',sans-serif] overflow-x-hidden">

      {/* ── Subtle grid background ── */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: \`
            linear-gradient(rgba(59,130,246,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59,130,246,0.03) 1px, transparent 1px)
          \`,
          backgroundSize: '48px 48px',
        }}
      />

      {/* ── Blue radial glow top center ── */}
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center top, rgba(59,130,246,0.12) 0%, transparent 70%)',
        }}
      />

      {/* ══════════════════════════════════════════
          NAVBAR
      ══════════════════════════════════════════ */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-[52px] flex items-center justify-between px-6
                      border-b border-[#1a1a1a] bg-[#0d0d0d]/80 backdrop-blur-md">

        {/* Logo */}
        <div className="flex items-center gap-2">
          <span className="text-[#3b82f6] text-lg font-semibold tracking-tight">◆</span>
          <span className="text-[#f0f0f0] text-sm font-semibold tracking-tight">VIAN</span>
          <span className="text-[#333333] text-xs font-mono ml-1">by Viren</span>
        </div>

        {/* Nav Links */}
        <div className="hidden md:flex items-center gap-6">
          {['Features', 'How it works', 'Pricing', 'Docs'].map((link) => (
            <a
              key={link}
              href={`#${link.toLowerCase().replace(' ', '-')}`}
              className="text-[#888888] text-sm hover:text-[#f0f0f0] transition-colors"
            >
              {link}
            </a>
          ))}
        </div>

        {/* CTA */}
        <div className="flex items-center gap-3">
          <a href="/login" className="text-[#888888] text-sm hover:text-[#f0f0f0] transition-colors">
            Sign in
          </a>
          <a
            href="/request-access"
            className="flex items-center gap-1.5 bg-[#3b82f6] hover:bg-[#2563eb]
                       text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Request Access
            <ChevronRight className="w-3 h-3" />
          </a>
        </div>
      </nav>

      {/* ══════════════════════════════════════════
          HERO
      ══════════════════════════════════════════ */}
      <section className="relative pt-36 pb-24 px-6 flex flex-col items-center text-center">

        {/* Beta badge */}
        <div className="flex items-center gap-2 bg-[#141414] border border-[#2a2a2a]
                        rounded-full px-4 py-1.5 mb-8 text-xs text-[#888888]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] animate-pulse" />
          Now in private beta
        </div>

        {/* Headline */}
        <h1 className="text-4xl md:text-6xl font-semibold tracking-tight leading-[1.1]
                       max-w-3xl mb-6">
          Build full-stack apps
          <br />
          <span className="text-[#3b82f6]">with a single prompt.</span>
        </h1>

        {/* Subheadline */}
        <p className="text-[#888888] text-base md:text-lg max-w-xl mb-12 leading-relaxed">
          VIAN generates production-ready Next.js applications — streamed file by file,
          with a live preview. Edit with AI. Export instantly.
        </p>

        {/* Prompt Input */}
        <div className="w-full max-w-2xl space-y-3">
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#555555]">
              <Terminal className="w-4 h-4" />
            </div>
            <input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
              placeholder={`Build me ${typedText}|`}
              className="w-full bg-[#141414] border border-[#2a2a2a] hover:border-[#3a3a3a]
                         focus:border-[#3b82f6] rounded-xl pl-11 pr-36 py-4 text-sm
                         text-[#f0f0f0] placeholder:text-[#444444]
                         focus:outline-none transition-colors"
            />
            <button
              onClick={handleGenerate}
              className="absolute right-2 top-1/2 -translate-y-1/2
                         flex items-center gap-2 bg-[#3b82f6] hover:bg-[#2563eb]
                         text-white text-sm font-medium px-4 py-2 rounded-lg
                         transition-all hover:-translate-y-[calc(50%+1px)]"
            >
              Generate
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Example prompt chips */}
          <div className="flex flex-wrap gap-2 justify-center">
            {examplePrompts.map((p) => (
              <button
                key={p}
                onClick={() => setPrompt(`Build me a ${p.toLowerCase()}`)}
                className="text-xs text-[#555555] hover:text-[#888888] bg-[#141414]
                           hover:bg-[#1a1a1a] border border-[#1f1f1f] hover:border-[#2a2a2a]
                           px-3 py-1.5 rounded-full transition-all"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Social proof */}
        <div className="flex items-center gap-6 mt-12 text-[#555555] text-xs">
          <span>Powered by</span>
          <span className="text-[#888888]">GPT-4o</span>
          <span className="text-[#333333]">·</span>
          <span className="text-[#888888]">Claude 3.5 Sonnet</span>
          <span className="text-[#333333]">·</span>
          <span className="text-[#888888]">WebContainers</span>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FAKE TERMINAL / CODE PREVIEW
      ══════════════════════════════════════════ */}
      <section className="px-6 pb-24 flex justify-center">
        <div className="w-full max-w-4xl rounded-xl border border-[#1f1f1f] bg-[#0d0d0d]
                        overflow-hidden shadow-2xl shadow-black/50">

          {/* Window chrome */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#141414]
                          border-b border-[#1f1f1f]">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[#ef4444]/60" />
              <div className="w-3 h-3 rounded-full bg-[#f59e0b]/60" />
              <div className="w-3 h-3 rounded-full bg-[#22c55e]/60" />
            </div>
            <span className="text-[#555555] text-xs font-mono">VIAN Studio — my-todo-app</span>
            <span className="text-[#3b82f6] text-xs font-mono">● Running</span>
          </div>

          {/* 3-panel mockup */}
          <div className="flex h-64 text-xs font-mono">

            {/* Explorer */}
            <div className="w-44 border-r border-[#1f1f1f] p-3 space-y-1.5 text-[#555555]">
              <div className="text-[10px] uppercase tracking-widest text-[#333333] mb-2">Explorer</div>
              {[
                { name: '▼ apps/', indent: 0, status: null },
                { name: '▼ web/', indent: 1, status: null },
                { name: 'page.tsx', indent: 2, status: 'done' },
                { name: 'layout.tsx', indent: 2, status: 'done' },
                { name: 'globals.css', indent: 2, status: 'done' },
                { name: '▼ api/', indent: 1, status: null },
                { name: 'index.ts', indent: 2, status: 'active' },
                { name: '▼ packages/', indent: 0, status: null },
                { name: 'schema.prisma', indent: 1, status: 'queued' },
              ].map((f, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5"
                  style={{ paddingLeft: `${f.indent * 10}px` }}
                >
                  {f.status === 'done' && <span className="text-[#22c55e] text-[10px]">✓</span>}
                  {f.status === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] animate-pulse inline-block" />}
                  {f.status === 'queued' && <span className="w-1.5 h-1.5 rounded-full bg-[#333333] inline-block" />}
                  {!f.status && <span className="w-1.5 h-1.5 inline-block" />}
                  <span className={f.status === 'active' ? 'text-[#f0f0f0]' : ''}>{f.name}</span>
                </div>
              ))}
            </div>

            {/* Editor */}
            <div className="flex-1 border-r border-[#1f1f1f] p-4 text-[#555555] leading-relaxed">
              <div className="text-[10px] text-[#3b82f6] mb-3 border-b border-[#1f1f1f] pb-2">
                apps/api/src/index.ts
              </div>
              <div className="space-y-1">
                <div><span className="text-[#3b82f6]">import</span> <span className="text-[#f0f0f0]">&#123; Hono &#125;</span> <span className="text-[#3b82f6]">from</span> <span className="text-[#22c55e]">'hono'</span></div>
                <div><span className="text-[#3b82f6]">import</span> <span className="text-[#f0f0f0]">&#123; cors &#125;</span> <span className="text-[#3b82f6]">from</span> <span className="text-[#22c55e]">'hono/cors'</span></div>
                <div className="text-[#333333]">&nbsp;</div>
                <div><span className="text-[#3b82f6]">const</span> <span className="text-[#f0f0f0]">app</span> <span className="text-[#888888]">=</span> <span className="text-[#f59e0b]">new</span> <span className="text-[#f0f0f0]">Hono()</span></div>
                <div className="text-[#333333]">&nbsp;</div>
                <div><span className="text-[#f0f0f0]">app</span><span className="text-[#888888]">.</span><span className="text-[#f59e0b]">use</span><span className="text-[#888888]">(</span><span className="text-[#22c55e]">'/*'</span><span className="text-[#888888]">,</span> <span className="text-[#f0f0f0]">cors()</span><span className="text-[#888888]">)</span></div>
                <div className="animate-pulse text-[#3b82f6]">█</div>
              </div>
            </div>

            {/* Preview */}
            <div className="w-56 flex flex-col">
              <div className="px-3 py-2 border-b border-[#1f1f1f] text-[10px] text-[#555555] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
                localhost:3000
              </div>
              <div className="flex-1 bg-white/5 flex items-center justify-center">
                <span className="text-[#333333] text-[10px]">Live preview</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          STATS
      ══════════════════════════════════════════ */}
      <section className="px-6 pb-24">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-px
                        bg-[#1f1f1f] rounded-xl overflow-hidden border border-[#1f1f1f]">
          {[
            { value: 30, suffix: 's', label: 'Avg generation time' },
            { value: 12, suffix: '+', label: 'Files per project' },
            { value: 100, suffix: '%', label: 'TypeScript strict' },
            { value: 2, suffix: ' AI models', label: 'GPT-4o & Claude' },
          ].map((stat) => (
            <div key={stat.label} className="bg-[#0d0d0d] p-6 text-center">
              <div className="text-2xl font-semibold text-[#f0f0f0] mb-1">
                <AnimatedNumber target={stat.value} suffix={stat.suffix} />
              </div>
              <div className="text-xs text-[#555555]">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FEATURES
      ══════════════════════════════════════════ */}
      <section id="features" className="px-6 pb-24">
        <div className="max-w-4xl mx-auto">

          <div className="text-center mb-16">
            <p className="text-[#3b82f6] text-xs font-mono uppercase tracking-widest mb-3">
              Features
            </p>
            <h2 className="text-2xl md:text-3xl font-semibold text-[#f0f0f0]">
              Everything you need. Nothing you don't.
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            {[
              {
                icon: <Zap className="w-4 h-4" />,
                title: 'Instant generation',
                desc: 'Type a prompt. Get a complete, production-ready Next.js app in under 30 seconds. No waiting, no configuration.',
              },
              {
                icon: <Eye className="w-4 h-4" />,
                title: 'Live preview',
                desc: 'A real Next.js dev server runs in your browser via WebContainers. See your app live as each file is generated.',
              },
              {
                icon: <Code2 className="w-4 h-4" />,
                title: 'AI-powered editing',
                desc: 'Chat to modify your app. VIAN identifies the affected files and surgically updates only what changed.',
              },
              {
                icon: <Layers className="w-4 h-4" />,
                title: 'Strict monorepo',
                desc: 'Every project follows a clean pnpm monorepo structure. Frontend, backend, database schema — all in one place.',
              },
              {
                icon: <Share2 className="w-4 h-4" />,
                title: 'Share & export',
                desc: 'Share a read-only link to your project or export the full codebase as a working zip. Ready to deploy.',
              },
              {
                icon: <Lock className="w-4 h-4" />,
                title: 'Beta access control',
                desc: 'Invite-only during beta. Every user is manually approved, ensuring high-quality feedback and usage.',
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="bg-[#141414] border border-[#1f1f1f] hover:border-[#2a2a2a]
                           rounded-xl p-6 transition-colors group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-[#3b82f6] group-hover:scale-110 transition-transform">
                    {feature.icon}
                  </div>
                  <h3 className="text-sm font-medium text-[#f0f0f0]">{feature.title}</h3>
                </div>
                <p className="text-xs text-[#555555] leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════════ */}
      <section id="how-it-works" className="px-6 pb-24">
        <div className="max-w-2xl mx-auto">

          <div className="text-center mb-16">
            <p className="text-[#3b82f6] text-xs font-mono uppercase tracking-widest mb-3">
              How it works
            </p>
            <h2 className="text-2xl md:text-3xl font-semibold text-[#f0f0f0]">
              From prompt to production in 4 steps.
            </h2>
          </div>

          <div className="space-y-3">
            {[
              {
                step: '01',
                title: 'Write your prompt',
                desc: 'Describe what you want to build. Be specific or keep it simple — VIAN figures out the rest.',
              },
              {
                step: '02',
                title: 'Watch it generate',
                desc: 'Files stream in one by one. Watch your project materialize in real time in the file explorer.',
              },
              {
                step: '03',
                title: 'Preview live',
                desc: 'The moment your files are ready, a live Next.js server boots in your browser. No deployments needed.',
              },
              {
                step: '04',
                title: 'Edit, share, export',
                desc: 'Chat to refine your app. Share a link with your team. Export a working zip when you're done.',
              },
            ].map((item, i) => (
              <div
                key={item.step}
                className="flex gap-6 bg-[#141414] border border-[#1f1f1f]
                           rounded-xl p-6 hover:border-[#2a2a2a] transition-colors"
              >
                <span className="text-[#1d3a6e] text-2xl font-bold font-mono flex-shrink-0 w-8">
                  {item.step}
                </span>
                <div>
                  <h3 className="text-sm font-medium text-[#f0f0f0] mb-1">{item.title}</h3>
                  <p className="text-xs text-[#555555] leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          CTA SECTION
      ══════════════════════════════════════════ */}
      <section className="px-6 pb-24">
        <div className="max-w-2xl mx-auto text-center">
          <div
            className="bg-[#141414] border border-[#1f1f1f] rounded-2xl p-12 relative overflow-hidden"
          >
            {/* Glow */}
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse, rgba(59,130,246,0.15) 0%, transparent 70%)',
              }}
            />

            <span className="text-[#3b82f6] text-2xl relative z-10">◆</span>
            <h2 className="text-xl md:text-2xl font-semibold text-[#f0f0f0] mt-4 mb-3 relative z-10">
              Ready to build something?
            </h2>
            <p className="text-[#555555] text-sm mb-8 relative z-10">
              VIAN is in private beta. Request access and start building
              full-stack apps with AI today.
            </p>
            <a
              href="/request-access"
              className="relative z-10 inline-flex items-center gap-2 bg-[#3b82f6]
                         hover:bg-[#2563eb] text-white text-sm font-medium
                         px-6 py-3 rounded-lg transition-colors"
            >
              Request Beta Access
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════ */}
      <footer className="border-t border-[#1a1a1a] px-6 py-8">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center
                        justify-between gap-4">

          {/* Branding */}
          <div className="flex items-center gap-2">
            <span className="text-[#3b82f6] font-semibold">◆ VIAN</span>
            <span className="text-[#333333] text-xs">by Viren</span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6 text-xs text-[#555555]">
            <a href="#features" className="hover:text-[#888888] transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-[#888888] transition-colors">How it works</a>
            <a href="/request-access" className="hover:text-[#888888] transition-colors">Request Access</a>
          </div>

          {/* Copyright */}
          <span className="text-xs text-[#333333]">
            © {new Date().getFullYear()} VIAN by Viren. All rights reserved.
          </span>
        </div>
      </footer>

    </div>
  )
}
```

---

### globals.css additions for landing page

```css
/* apps/web/app/globals.css */
@import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  scroll-behavior: smooth;
}

body {
  background: #0d0d0d;
  color: #f0f0f0;
  font-family: 'Geist', -apple-system, sans-serif;
  -webkit-font-smoothing: antialiased;
}

/* Custom scrollbar */
::-webkit-scrollbar        { width: 4px; height: 4px; }
::-webkit-scrollbar-track  { background: transparent; }
::-webkit-scrollbar-thumb  { background: #2a2a2a; border-radius: 2px; }
::-webkit-scrollbar-thumb:hover { background: #3a3a3a; }

/* Selection */
::selection { background: rgba(59,130,246,0.3); color: #f0f0f0; }
```

---

### Sections Summary

| Section | Purpose |
|---|---|
| Navbar | Fixed, blur backdrop, logo + nav links + Request Access CTA |
| Hero | Headline + typing animation prompt input + example chips |
| Terminal mockup | Fake 3-panel studio preview showing generation in progress |
| Stats bar | 4 animated counters: generation time, files, TS strict, AI models |
| Features | 6 feature cards with icons — minimal hover effect |
| How it works | 4 numbered steps in card layout |
| CTA | Final call to action with blue glow accent |
| Footer | Branding + nav links + copyright |

---

## BETA ACCESS SYSTEM — ADMIN CONTROLLED

VIAN is invite-only during beta. Only Viren (the ultimate admin) can approve or reject
users who request access. No one can download, export, or use generation features
without being approved. This is enforced at the database and API level — not just the UI.

---

### Database Schema (Prisma)

```prisma
// packages/prisma/schema.prisma

enum UserRole {
  ULTIMATE_ADMIN   // Viren only — full access, can approve/reject anyone
  APPROVED         // Approved beta user — full feature access
  PENDING          // Requested access — waiting for admin approval
  REJECTED         // Rejected by admin — no feature access
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  password      String?   // hashed
  role          UserRole  @default(PENDING)
  
  // Beta request fields
  requestedAt   DateTime  @default(now())  // when they applied
  approvedAt    DateTime?                  // when admin approved
  rejectedAt    DateTime?                  // when admin rejected
  rejectReason  String?                    // optional reason for rejection
  approvedBy    String?                    // admin user id who approved

  // Usage
  projects      Project[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@map("users")
}

model Project {
  id          String   @id @default(cuid())
  name        String
  prompt      String
  files       Json     // stored generated files
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("projects")
}

model BetaRequest {
  id          String   @id @default(cuid())
  email       String   @unique
  name        String
  reason      String   // "Why do you want access?"
  status      UserRole @default(PENDING)
  createdAt   DateTime @default(now())

  @@map("beta_requests")
}
```

---

### Environment — Admin Seed

```env
# .env
# This email is automatically seeded as ULTIMATE_ADMIN on first run
ADMIN_EMAIL=viren@youremail.com
ADMIN_PASSWORD=your-secure-password-here
```

---

### Admin Seed Script

```typescript
// apps/api/src/scripts/seedAdmin.ts
// Run once on first deploy: pnpm ts-node src/scripts/seedAdmin.ts

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD

  if (!email || !password) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env')
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    console.log('Admin already exists. Skipping.')
    return
  }

  const hashed = await bcrypt.hash(password, 12)

  await prisma.user.create({
    data: {
      email,
      name: 'Viren',
      password: hashed,
      role: 'ULTIMATE_ADMIN',
      approvedAt: new Date(),
    },
  })

  console.log(`✓ Ultimate admin created: ${email}`)
}

seedAdmin()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

---

### Middleware — Access Guard

```typescript
// apps/api/src/middleware/accessGuard.ts
import { Request, Response, NextFunction } from 'express'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

// Blocks all generation/export/download if user is not APPROVED or ULTIMATE_ADMIN
export async function requireApproved(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) return res.status(401).json({ error: 'Unauthorized' })

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as { userId: string }
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } })

    if (!user) return res.status(401).json({ error: 'User not found' })

    if (user.role === 'PENDING') {
      return res.status(403).json({
        error: 'pending_approval',
        message: 'Your beta access request is pending approval. You will be notified by email.',
      })
    }

    if (user.role === 'REJECTED') {
      return res.status(403).json({
        error: 'access_rejected',
        message: user.rejectReason ?? 'Your beta access request was not approved.',
      })
    }

    if (user.role !== 'APPROVED' && user.role !== 'ULTIMATE_ADMIN') {
      return res.status(403).json({ error: 'Access denied' })
    }

    // Attach user to request for downstream use
    (req as any).user = user
    next()

  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

// Only Viren (ULTIMATE_ADMIN) can access admin routes
export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) return res.status(401).json({ error: 'Unauthorized' })

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as { userId: string }
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } })

    if (!user || user.role !== 'ULTIMATE_ADMIN') {
      return res.status(403).json({ error: 'Admin access only' })
    }

    (req as any).user = user
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid token' })
  }
}
```

---

### Apply Guards to Routes

```typescript
// apps/api/src/index.ts
import { requireApproved, requireAdmin } from './middleware/accessGuard'

// Protected routes — approved beta users only
app.use('/api/generate', requireApproved)
app.use('/api/edit',     requireApproved)
app.use('/api/export',   requireApproved)  // ← download blocked until approved
app.use('/api/projects', requireApproved)

// Admin only routes — Viren only
app.use('/api/admin',    requireAdmin)
```

---

### Admin Routes — Viren's Control Panel

```typescript
// apps/api/src/routes/admin.ts
import { Router } from 'express'
import { PrismaClient } from '@prisma/client'

const router = Router()
const prisma = new PrismaClient()

// GET /api/admin/requests — see all pending beta requests
router.get('/requests', async (req, res) => {
  const requests = await prisma.user.findMany({
    where: { role: 'PENDING' },
    orderBy: { requestedAt: 'asc' },
    select: {
      id: true,
      email: true,
      name: true,
      requestedAt: true,
    },
  })
  res.json({ total: requests.length, requests })
})

// GET /api/admin/users — see all approved users
router.get('/users', async (req, res) => {
  const users = await prisma.user.findMany({
    where: { role: { in: ['APPROVED', 'REJECTED'] } },
    orderBy: { approvedAt: 'desc' },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      approvedAt: true,
      rejectedAt: true,
      rejectReason: true,
    },
  })
  res.json(users)
})

// POST /api/admin/approve/:userId — approve a user
router.post('/approve/:userId', async (req, res) => {
  const admin = (req as any).user
  const user = await prisma.user.update({
    where: { id: req.params.userId },
    data: {
      role: 'APPROVED',
      approvedAt: new Date(),
      approvedBy: admin.id,
    },
  })
  // TODO: Send approval email to user
  res.json({ success: true, user: { email: user.email, role: user.role } })
})

// POST /api/admin/reject/:userId — reject a user
router.post('/reject/:userId', async (req, res) => {
  const { reason } = req.body
  const user = await prisma.user.update({
    where: { id: req.params.userId },
    data: {
      role: 'REJECTED',
      rejectedAt: new Date(),
      rejectReason: reason ?? 'Beta access not approved at this time.',
    },
  })
  res.json({ success: true, user: { email: user.email, role: user.role } })
})

// POST /api/admin/revoke/:userId — revoke an approved user
router.post('/revoke/:userId', async (req, res) => {
  const user = await prisma.user.update({
    where: { id: req.params.userId },
    data: { role: 'REJECTED', rejectedAt: new Date() },
  })
  res.json({ success: true, user: { email: user.email, role: user.role } })
})

export default router
```

---

### Beta Request Page (Frontend)

```typescript
// apps/web/app/request-access/page.tsx
// Public page — anyone can request access

'use client'

import { useState } from 'react'

export default function RequestAccess() {
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)

    await fetch('/api/auth/request-access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name:   form.get('name'),
        email:  form.get('email'),
        reason: form.get('reason'),
      }),
    })

    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="text-[#3b82f6] text-2xl">◆</div>
          <h2 className="text-[#f0f0f0] text-lg font-medium">Request received</h2>
          <p className="text-[#888888] text-sm max-w-sm">
            We'll review your request and notify you by email when you're approved.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">

        {/* Header */}
        <div className="text-center space-y-2">
          <span className="text-[#3b82f6] text-xl font-semibold">◆ VIAN</span>
          <p className="text-[#888888] text-xs">by Viren</p>
          <h1 className="text-[#f0f0f0] text-xl font-medium pt-2">Request Beta Access</h1>
          <p className="text-[#555555] text-sm">
            VIAN is currently invite-only. Fill out the form and we'll be in touch.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[#888888] text-xs uppercase tracking-widest">Name</label>
            <input
              name="name"
              required
              placeholder="Your name"
              className="w-full bg-[#141414] border border-[#2a2a2a] rounded-lg
                         px-4 py-3 text-[#f0f0f0] text-sm placeholder:text-[#555555]
                         focus:outline-none focus:border-[#3b82f6] transition-colors"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[#888888] text-xs uppercase tracking-widest">Email</label>
            <input
              name="email"
              type="email"
              required
              placeholder="you@example.com"
              className="w-full bg-[#141414] border border-[#2a2a2a] rounded-lg
                         px-4 py-3 text-[#f0f0f0] text-sm placeholder:text-[#555555]
                         focus:outline-none focus:border-[#3b82f6] transition-colors"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[#888888] text-xs uppercase tracking-widest">
              Why do you want access?
            </label>
            <textarea
              name="reason"
              required
              rows={4}
              placeholder="Tell us what you're building..."
              className="w-full bg-[#141414] border border-[#2a2a2a] rounded-lg
                         px-4 py-3 text-[#f0f0f0] text-sm placeholder:text-[#555555]
                         focus:outline-none focus:border-[#3b82f6] transition-colors resize-none"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#3b82f6] hover:bg-[#2563eb] text-white text-sm
                       font-medium py-3 rounded-lg transition-colors"
          >
            Request Access
          </button>
        </form>

      </div>
    </div>
  )
}
```

---

### Admin Dashboard Page (Frontend — Viren Only)

```typescript
// apps/web/app/admin/page.tsx
// Protected — only renders for ULTIMATE_ADMIN

'use client'

import { useEffect, useState } from 'react'

interface PendingUser {
  id: string
  email: string
  name: string
  requestedAt: string
}

export default function AdminDashboard() {
  const [pending, setPending] = useState<PendingUser[]>([])

  useEffect(() => {
    fetch('/api/admin/requests', {
      headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
    })
      .then((r) => r.json())
      .then((data) => setPending(data.requests))
  }, [])

  async function approve(userId: string) {
    await fetch(`/api/admin/approve/${userId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
    })
    setPending((prev) => prev.filter((u) => u.id !== userId))
  }

  async function reject(userId: string) {
    const reason = prompt('Rejection reason (optional):')
    await fetch(`/api/admin/reject/${userId}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason }),
    })
    setPending((prev) => prev.filter((u) => u.id !== userId))
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] p-8">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[#f0f0f0] text-lg font-medium">Admin Dashboard</h1>
            <p className="text-[#555555] text-xs mt-1">◆ VIAN by Viren</p>
          </div>
          <span className="text-[#3b82f6] text-xs font-mono bg-[#1d3a6e] px-3 py-1 rounded-full">
            ULTIMATE ADMIN
          </span>
        </div>

        {/* Pending Requests */}
        <div className="space-y-3">
          <h2 className="text-[#888888] text-xs uppercase tracking-widest">
            Pending Requests ({pending.length})
          </h2>

          {pending.length === 0 && (
            <p className="text-[#555555] text-sm">No pending requests.</p>
          )}

          {pending.map((user) => (
            <div
              key={user.id}
              className="bg-[#141414] border border-[#1f1f1f] rounded-lg p-4
                         flex items-center justify-between"
            >
              <div>
                <p className="text-[#f0f0f0] text-sm font-medium">{user.name}</p>
                <p className="text-[#888888] text-xs">{user.email}</p>
                <p className="text-[#555555] text-xs mt-1">
                  Requested {new Date(user.requestedAt).toLocaleDateString()}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => approve(user.id)}
                  className="bg-[#22c55e] hover:bg-[#16a34a] text-white
                             text-xs px-4 py-2 rounded-lg transition-colors"
                >
                  Approve
                </button>
                <button
                  onClick={() => reject(user.id)}
                  className="bg-[#1a1a1a] hover:bg-[#222222] text-[#888888]
                             border border-[#2a2a2a] text-xs px-4 py-2
                             rounded-lg transition-colors"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
```

---

### User Flow Summary

```
PUBLIC USER:
  1. Visits VIAN → sees landing page with "Request Access" button
  2. Fills out name, email, reason → status set to PENDING in DB
  3. Sees "Request received" confirmation
  4. Cannot access studio, generate, export, or download anything

VIREN (ULTIMATE ADMIN):
  1. Logs into /admin with his credentials
  2. Sees list of all PENDING users
  3. Clicks Approve → user role set to APPROVED in DB
     OR clicks Reject → user role set to REJECTED with optional reason
  4. Approved user gets access to full VIAN studio
  5. Viren can revoke any approved user at any time

APPROVED BETA USER:
  1. Receives approval (manually notified or via email)
  2. Logs in → full access to generate, preview, edit, export, download
  3. Access can be revoked by Viren at any time
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