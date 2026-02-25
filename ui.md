# VIAN — UI & Architecture Reference (as-built, Feb 2026)

> You are VIAN — the AI app generation engine created by Viren Pandeyy.
> This document is the single source of truth for the VIAN codebase structure, design rules, and behavior.

---

## 1. Actual Folder Structure (current)

```
vian-app/
├── apps/
│   ├── web/                             # Next.js 14 App Router frontend
│   │   ├── app/
│   │   │   ├── layout.tsx               # Root layout (minimal — each group manages its own)
│   │   │   ├── page.tsx                 # Landing page (public, auth-aware navbar)
│   │   │   ├── settings/
│   │   │   │   └── page.tsx             # Account settings (change password, profile, sign out)
│   │   │   ├── (auth)/
│   │   │   │   ├── login/page.tsx       # Login + forgot-password (3 views)
│   │   │   │   ├── register/page.tsx    # Register + success state
│   │   │   │   └── request-access/page.tsx  # Legacy direct access form
│   │   │   ├── (admin)/
│   │   │   │   └── admin/page.tsx       # Admin dashboard (inline auth, no middleware)
│   │   │   └── (studio)/
│   │   │       └── studio/
│   │   │           ├── layout.tsx
│   │   │           └── [projectId]/page.tsx  # Studio (generation, editing, preview)
│   │   ├── components/
│   │   │   └── studio/
│   │   │       ├── ChatPanel.tsx        # Prompt input — routes to onGenerate or onEdit
│   │   │       ├── CodeEditor.tsx       # File content viewer
│   │   │       ├── FileExplorer.tsx     # Left sidebar — file tree
│   │   │       ├── PreviewPanel.tsx     # Right panel — WebContainer iframe
│   │   │       └── StatusBar.tsx        # Bottom bar
│   │   ├── hooks/
│   │   │   ├── useGeneration.ts         # SSE generation + editFile + registerBoot
│   │   │   ├── useWebContainer.ts       # Boot, install, run dev server
│   │   │   └── useFileTree.ts
│   │   ├── lib/
│   │   │   ├── api-client.ts
│   │   │   ├── constants.ts             # API_BASE, MODELS
│   │   │   ├── prompts.ts
│   │   │   └── utils.ts                 # cn(), formatDate()
│   │   ├── stores/
│   │   │   └── projectStore.ts          # Zustand: files, activeFile, model, isGenerating, projectId
│   │   ├── types/puter.d.ts
│   │   ├── middleware.ts                # Protects /studio/* — redirects to /login
│   │   ├── next.config.js               # Proxy /api/* → :4000, COOP/COEP headers
│   │   ├── tailwind.config.js
│   │   ├── postcss.config.js
│   │   ├── tsconfig.json
│   │   └── package.json
│   └── api/                             # Express.js backend — port 4000
│       └── src/
│           ├── index.ts
│           ├── routes/
│           │   ├── auth.ts              # register, login, forgot-password, me, change-password
│           │   ├── admin.ts             # list, approve, reject, revoke, keys
│           │   ├── generation.ts        # SSE streaming generation
│           │   ├── edit.ts              # single-file AI edit
│           │   ├── projects.ts
│           │   └── export.ts
│           ├── middleware/
│           │   ├── auth.ts              # JWT Bearer verify
│           │   ├── accessGuard.ts       # Role check
│           │   └── errorHandler.ts
│           └── services/
│               ├── LLMService.ts        # Anthropic → OpenAI fallback routing
│               ├── FileGenerator.ts
│               ├── FileValidator.ts
│               └── KeyManager.ts        # Key rotation (6 OpenAI, 5 Gemini, 2 Groq)
├── packages/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── package.json
│   └── shared-types/src/index.ts
├── pnpm-workspace.yaml
├── tsconfig.json
└── package.json
```

---

## 2. Pages & Behavior

### `/` — Landing Page
- **Auth-aware navbar**: reads `vian_user` from localStorage
  - Logged out → "Sign in" + "Request Access"
  - Logged in → "Hello, [FirstName]" button (green dot) → dropdown:
    - Email display, Settings → `/settings`, Sign out
- Prompt input → navigates to `/studio/[slug]?prompt=...`
- Sections: Hero → Terminal mockup → Stats → Features → How it works → CTA → Footer

### `/login`
- 3 views: `login` / `forgot` / `forgot_sent`
- Status banners: `pending` / `rejected` / `no_account` / `invalid_password` / `error`
- On success: admin → `/admin`, user → `/`

### `/register`
- Fields: name, email, password, confirm, reason
- Success → "pending review" screen → link to `/login`

### `/settings`
- Requires localStorage `vian_user`; redirects to `/login` if missing
- Profile card (read-only), change-password form, sign out

### `/admin`
- No middleware — inline AdminLogin component
- Checks `vian_admin_token` / `vian_admin_user` in localStorage on mount
- Dashboard: Beta Requests (approve/reject/revoke) + API Keys tab
- Header shows admin email + pending count badge

### `/studio/[projectId]`
- Reads `?prompt=` from URL → auto-calls `generate(prompt)` once on mount
- Layout: `toolbar | FileExplorer | CodeEditor | [PreviewPanel + ChatPanel] | StatusBar`
- `registerBoot(boot)` wired in useEffect
- `ChatPanel` → `onGenerate` if no files, `onEdit` if files exist
- Protected by middleware (vian_token cookie)

---

## 3. Auth Flow

```
Register → POST /api/auth/register
  Creates User (PENDING) + BetaRequest; bcrypt 12 rounds

Login → POST /api/auth/login
  Admin env vars checked first → ULTIMATE_ADMIN bypass
  Errors: no_account | invalid_password | pending | rejected
  Success → JWT (7d) → cookie + localStorage
  Admin → /admin | User → /

Admin approves → PATCH /api/admin/approve/:id
  Sets BetaRequest.status = APPROVED, User.role = APPROVED

Change password → POST /api/auth/change-password (Bearer)
  Verifies current bcrypt → hashes + saves new

Middleware (middleware.ts)
  Protects /studio/* only → checks vian_token cookie
  Admin route has NO middleware (self-contained)
```

---

## 4. API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | — | Create account + beta request |
| POST | `/api/auth/login` | — | JWT login |
| POST | `/api/auth/forgot-password` | — | Stub (always 200) |
| POST | `/api/auth/change-password` | Bearer | Update password |
| GET  | `/api/auth/me` | Bearer | Current user |
| POST | `/api/auth/request-access` | — | Legacy request only |
| GET  | `/api/admin/requests` | Admin | List beta requests |
| PATCH | `/api/admin/approve/:id` | Admin | Approve user |
| PATCH | `/api/admin/reject/:id` | Admin | Reject user |
| PATCH | `/api/admin/revoke/:id` | Admin | Revoke user |
| POST | `/api/generate` | — | SSE generation stream |
| POST | `/api/edit` | — | Single-file edit |

---

## 5. Database

**Prisma + PostgreSQL 18 — port 5432, DB: `vian`**

```prisma
enum UserRole { ULTIMATE_ADMIN, APPROVED, PENDING, REJECTED }

model User {
  id           String   @id @default(cuid())
  email        String   @unique
  name         String
  role         UserRole @default(PENDING)
  passwordHash String?
  createdAt    DateTime @default(now())
}

model BetaRequest {
  id        String   @id @default(cuid())
  name      String
  email     String   @unique
  reason    String
  status    String   @default("PENDING")
  createdAt DateTime @default(now())
}

model Project {
  id        String   @id @default(cuid())
  name      String
  createdAt DateTime @default(now())
}
```

---

## 6. Environment (apps/api/.env)

```
PORT=4000
CORS_ORIGIN=http://localhost:3000
DATABASE_URL=postgresql://postgres:virenn7@localhost:5432/vian
JWT_ACCESS_SECRET=9f3dKx7LmPq2Zr8Vt1Yw4Bn6Hs0Uc5Ej
ADMIN_EMAIL=pandeyviren78@gmail.com
ADMIN_PASSWORD=_virenn7.vian
LLM_PRIMARY_PROVIDER=anthropic
LLM_FALLBACK_PROVIDER=openai
ANTHROPIC_MODEL=claude-sonnet-4-6
OPENAI_MODEL=gpt-4o
```

---

## 7. Hooks

### `useGeneration.ts`
- `generate(prompt)` — POST `/api/generate` → SSE → `setFile()` per event → `boot()` on package.json or complete
- `editFile(instruction)` — POST `/api/edit`
- `registerBoot(fn)` — stores WebContainer boot fn in ref

### `useWebContainer.ts`
- `boot(flatFiles)` — mount files → `pnpm install` → `pnpm dev`
- Returns `{ status, previewUrl }` — status: `idle | booting | installing | running | error`

---

## 8. Zustand Store (`projectStore.ts`)

| Field | Type | Description |
|-------|------|-------------|
| `files` | `Record<string, FileNode>` | All generated files |
| `activeFile` | `string \| null` | Currently viewed file |
| `model` | `ModelId` | Selected LLM |
| `projectId` | `string \| null` | Current project |
| `isGenerating` | `boolean` | SSE in progress |
| `errorMessage` | `string \| null` | Last error |

---

## 9. Design System

```css
:root {
  --bg-base:       #0d0d0d;
  --bg-surface:    #141414;
  --bg-elevated:   #1a1a1a;
  --border-subtle: #1f1f1f;
  --border-mid:    #2a2a2a;
  --text-primary:  #f0f0f0;
  --text-muted:    #888888;
  --text-faint:    #555555;
  --accent:        #3b82f6;
  --accent-hover:  #2563eb;
  --green:         #22c55e;
  --red:           #ef4444;
  --yellow:        #f59e0b;
}
```

- **Fonts**: Geist Sans (UI), Geist Mono (code/paths)
- **Radius**: `rounded-lg` inputs, `rounded-xl` cards, `rounded-full` pills
- **Motion**: framer-motion subtly only — fades, slides — never flashy
- **Dark mode only** — no toggle, no light theme

---

## 10. Dev Commands

```powershell
# Start API
cd vian-app; pnpm --filter @vian/api dev

# Start web
cd vian-app; pnpm --filter @vian/web dev

# Prisma push
cd packages/prisma; npx prisma db push

# Kill port
$p = Get-NetTCPConnection -LocalPort 4000 -EA SilentlyContinue | Select -First 1 -Exp OwningProcess
if ($p) { taskkill /PID $p /F }
```

---

## 11. Branding (locked — everywhere)

**package.json** (every package):
```json
{ "author": "Viren Pandeyy", "description": "Made with VIAN by Viren" }
```

**Footer** (every page/layout):
```tsx
<footer className="border-t border-[#1a1a1a] px-6 py-6 text-center">
  <p className="text-xs text-[#555555]">Made with VIAN by Viren Pandeyy</p>
</footer>
```

---

## 12. Generation Rules (locked)

- Next.js 14+ App Router monorepo — exact structure above — no exceptions
- Route groups: `(marketing)` `(auth)` `(studio)` `(admin)` — never flatten
- File order: `globals.css` → `tailwind.config` → `layout.tsx` → components → pages
- One file at a time via SSE — no dumps
- Dark mode only, VIAN studio layout vibe always
- Branding in every package.json + footer — always

---

*Last updated: February 25, 2026 — VIAN by Viren Pandeyy*
