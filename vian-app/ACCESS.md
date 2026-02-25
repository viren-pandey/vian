# VIAN — Access & Commands Reference

---

## 🚀 Start Everything

Run these in **two separate terminals** from the project root:

### Terminal 1 — API Server (port 4000)
```powershell
cd "C:\Users\VIREN PANDEY\Desktop\Vian\vian-app"
pnpm --filter @vian/api dev
```

### Terminal 2 — Web App (port 3000)
```powershell
cd "C:\Users\VIREN PANDEY\Desktop\Vian\vian-app"
pnpm --filter @vian/web dev
```

---

## 🔗 Web App Pages

| Page | URL | Description |
|---|---|---|
| **Landing / Home** | http://localhost:3000 | Main page — type a prompt & generate |
| **Login** | http://localhost:3000/login | User login |
| **Register** | http://localhost:3000/register | Create account + request access |
| **Request Access** | http://localhost:3000/request-access | Beta access request form (no password) |
| **Studio** | http://localhost:3000/studio/[project-id] | Generated app IDE + live preview |
| **Settings** | http://localhost:3000/settings | User account settings |
| **Blog** | http://localhost:3000/blog | Public blog index |
| **Blog Post** | http://localhost:3000/blog/[slug] | Individual blog post |
| **Admin Panel** | http://localhost:3000/admin | Admin dashboard (beta requests + key health) |
| **Admin Login** | http://localhost:3000/admin/login | Admin login page |
| **Admin Blog** | http://localhost:3000/admin/blog | Manage all blog posts |
| **New Blog Post** | http://localhost:3000/admin/blog/new | Create a new blog post |
| **Edit Blog Post** | http://localhost:3000/admin/blog/[id]/edit | Edit an existing blog post |

---

## 🔗 API Endpoints

### Health
| Method | URL | Description |
|---|---|---|
| `GET` | http://localhost:4000/health | Health check — returns `{"status":"ok"}` |

### Auth (`/api/auth`)
| Method | URL | Description |
|---|---|---|
| `POST` | http://localhost:4000/api/auth/register | Create account + submit beta request |
| `POST` | http://localhost:4000/api/auth/login | Login → returns JWT access token |
| `GET` | http://localhost:4000/api/auth/me | Get current user (requires Bearer token) |
| `POST` | http://localhost:4000/api/auth/request-access | Submit beta request (no password) |
| `POST` | http://localhost:4000/api/auth/forgot-password | Send password reset email |
| `POST` | http://localhost:4000/api/auth/change-password | Change password (requires Bearer token) |

### Generation (`/api/generate`, `/api/edit`)
| Method | URL | Description |
|---|---|---|
| `POST` | http://localhost:4000/api/generate | Stream app generation via SSE |
| `POST` | http://localhost:4000/api/edit | Stream file edit via SSE |

### Projects (`/api/projects`)
| Method | URL | Description |
|---|---|---|
| `GET` | http://localhost:4000/api/projects | List all projects for current user |
| `POST` | http://localhost:4000/api/projects | Create new project |
| `GET` | http://localhost:4000/api/projects/:id | Get single project |
| `DELETE` | http://localhost:4000/api/projects/:id | Delete project |
| `POST` | http://localhost:4000/api/export | Export project as zip |

### Admin (`/api/admin`)
| Method | URL | Description |
|---|---|---|
| `GET` | http://localhost:4000/api/admin/keys | View all provider API key health |
| `GET` | http://localhost:4000/api/admin/requests | List all beta access requests |
| `GET` | http://localhost:4000/api/admin/users | List all users |
| `PATCH` | http://localhost:4000/api/admin/approve/:id | Approve a beta request |
| `PATCH` | http://localhost:4000/api/admin/reject/:id | Reject a beta request |
| `PATCH` | http://localhost:4000/api/admin/revoke/:id | Revoke a user's access |

### Blog (`/api/blog`)
| Method | URL | Description |
|---|---|---|
| `GET` | http://localhost:4000/api/blog | List all published posts |
| `GET` | http://localhost:4000/api/blog/latest | Get latest posts (query: `?limit=5`) |
| `GET` | http://localhost:4000/api/blog/:slug | Get single post by slug |
| `GET` | http://localhost:4000/api/blog/image/:filename | Serve uploaded image |
| `GET` | http://localhost:4000/api/blog/admin/all | Admin: list all posts (published + drafts) |
| `GET` | http://localhost:4000/api/blog/admin/:id | Admin: get single post by ID |
| `POST` | http://localhost:4000/api/blog/admin | Admin: create new post |
| `PUT` | http://localhost:4000/api/blog/admin/:id | Admin: update post |
| `DELETE` | http://localhost:4000/api/blog/admin/:id | Admin: delete post |
| `POST` | http://localhost:4000/api/blog/admin/cover | Admin: upload cover image |
| `POST` | http://localhost:4000/api/blog/admin/image | Admin: upload inline image |

---

## 🤖 Models Available

### Puter.js — Free & Unlimited (no API key, runs in browser)
| Model ID | Label | Notes |
|---|---|---|
| `puter-gemini-2.5-flash` | Gemini 2.5 Flash ⭐ **default** | Fast, free, unlimited via Puter.js |
| `puter-gemini-2.5-pro` | Gemini 2.5 Pro | Highest quality Gemini, free |
| `puter-gpt-4o` | GPT-4o | OpenAI via Puter.js, free |
| `puter-claude-sonnet-4-5` | Claude 3.5 Sonnet | Anthropic via Puter.js, free |

> Puter.js runs entirely in the browser. No API key needed.

### Server-side providers (require keys in .env)
| Model ID | Label | Provider | Cost |
|---|---|---|---|
| `gemini-2.0-flash` | Gemini 2.0 Flash | Google | Free (1500 req/day/key × 5 keys) |
| `gemini-1.5-pro` | Gemini 1.5 Pro | Google | Free tier |
| `llama-3.3-70b-versatile` | Llama 3.3 70B | Groq | Free |
| `llama-3.1-8b-instant` | Llama 3.1 8B Fast | Groq | Free |
| `deepseek-chat` | DeepSeek V3 | DeepSeek | ~$0.07/M tokens |
| `deepseek-reasoner` | DeepSeek R1 | DeepSeek | ~$0.55/M tokens |
| `gpt-4o` | GPT-4o | OpenAI | $5/M tokens |
| `gpt-4-turbo` | GPT-4 Turbo | OpenAI | $10/M tokens |
| `claude-3-5-sonnet` | Claude 3.5 Sonnet | Anthropic | $3/M tokens |

---

## 🔑 API Key Sources

| Provider | Dashboard | Keys in .env |
|---|---|---|
| **Gemini** | https://aistudio.google.com | `GEMINI_API_KEY_1` → `_5` (5-key rotation) |
| **Groq** | https://console.groq.com | `GROQ_API_KEY_1`, `GROQ_API_KEY_2` |
| **DeepSeek** | https://platform.deepseek.com | `DEEPSEEK_API_KEY` |
| **OpenAI** | https://platform.openai.com/api-keys | `OPENAI_API_KEY_1` → `_6` |
| **Anthropic** | https://console.anthropic.com | `ANTHROPIC_API_KEY` |

---

## 🔐 Admin Credentials

```
Email:    pandeyviren78@gmail.com
Password: _virenn7.vian
```

---

## 🛠 Useful Dev Commands

### Kill port conflicts
```powershell
# Kill port 4000 (API)
$p = Get-NetTCPConnection -LocalPort 4000 -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty OwningProcess; if ($p) { taskkill /PID $p /F }

# Kill port 3000 (Web)
$p = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty OwningProcess; if ($p) { taskkill /PID $p /F }
```

### Type-check
```powershell
# Check API
pnpm --filter @vian/api exec tsc --noEmit

# Check Web
pnpm --filter @vian/web exec tsc --noEmit
```

### Install dependencies
```powershell
pnpm install
```

### Add a package to API
```powershell
pnpm --filter @vian/api add <package-name>
```

### Add a package to Web
```powershell
pnpm --filter @vian/web add <package-name>
```

### Prisma — push schema to DB
```powershell
pnpm --filter @vian/prisma db push
```

### Prisma — open DB studio
```powershell
pnpm --filter @vian/prisma studio
```

### Test generation (PowerShell)
```powershell
$body = '{"prompt":"counter app","model":"gemini-2.0-flash","projectId":"test"}'
Invoke-WebRequest -Uri 'http://localhost:4000/api/generate' -Method POST -Body $body -ContentType 'application/json' -UseBasicParsing | Select-Object -ExpandProperty Content
```

### Test request-access (PowerShell)
```powershell
$body = '{"name":"Test User","email":"test@example.com","reason":"Testing"}'
Invoke-WebRequest -Uri 'http://localhost:4000/api/auth/request-access' -Method POST -Body $body -ContentType 'application/json' -UseBasicParsing | Select-Object StatusCode, Content
```

### Git — push from repo root
```powershell
cd "C:\Users\VIREN PANDEY\Desktop\Vian"
git add -A
git commit -m "your message"
git push origin main
```

---

## 📁 Project Structure

```
vian-app/
├── apps/
│   ├── web/                    → Next.js 14 frontend (port 3000)
│   │   ├── app/
│   │   │   ├── (auth)/         → login, register, request-access
│   │   │   ├── (studio)/       → studio/[projectId]
│   │   │   ├── (admin)/        → admin/, admin/blog, admin/blog/new, admin/blog/[id]/edit
│   │   │   ├── (marketing)/    → blog/, blog/[slug]
│   │   │   └── settings/
│   │   ├── components/
│   │   │   ├── auth/           → RequestAccessForm
│   │   │   ├── admin/blog/     → BlogEditor, EditorToolbar, ImageUploadModal, PostSettings
│   │   │   ├── marketing/      → BlogCard, Hero, Navbar, Footer
│   │   │   ├── studio/         → ChatPanel, CodeEditor, FileExplorer, PreviewPanel, etc.
│   │   │   └── ui/             → Button, Card, Input, Modal, Badge, Skeleton, Spinner
│   │   ├── hooks/
│   │   │   ├── useGeneration.ts   → boilerplate-first generation flow
│   │   │   ├── useWebContainer.ts → WebContainer writeFile/install/startDev API
│   │   │   └── useFileTree.ts
│   │   ├── lib/
│   │   │   ├── boilerplate.ts  → 9 mandatory files planted before AI generation
│   │   │   ├── prompts.ts      → Puter.js system prompts (Next.js App Router)
│   │   │   ├── api.ts          → fetch helpers
│   │   │   └── constants.ts
│   │   └── stores/             → appStore, authStore, projectStore (Zustand)
│   └── api/                    → Express backend (port 4000)
│       ├── src/
│       │   ├── routes/         → generation, edit, projects, export, auth, admin, blog
│       │   ├── services/       → LLMService, KeyManager, FileGenerator, FileValidator
│       │   └── middleware/     → auth, accessGuard, errorHandler
│       └── .env                → All API keys go here
└── packages/
    ├── prisma/                 → schema.prisma (User, BetaRequest, Project, BlogPost, BlogTag)
    └── shared-types/           → Shared TypeScript types
```

---

## 🗄 Database

```
PostgreSQL
Host:     localhost:5432
DB:       vian
User:     postgres
Password: virenn7
```

---

## ⚙️ Generation Architecture (madontay.md)

The WebContainer generates **Next.js 14 App Router** apps — not Vite.

**Flow:**
1. Plant 9 boilerplate files (package.json, next.config.js, tsconfig, tailwind, globals.css, layout.tsx, page.tsx, lib/utils.ts) — `lib/boilerplate.ts`
2. Fire `npm install` immediately (async — does NOT block)
3. Stream AI-generated files via SSE → write each to WebContainer
4. When `app/page.tsx` arrives → wait for install → run `npm run dev`
5. `server-ready` event fires → preview URL shown in PreviewPanel

**Protected files** (AI is blocked from overwriting):
- `package.json`, `next.config.js`, `tsconfig.json`, `postcss.config.js`

**Allowed AI output folders:** `app/`, `components/`, `lib/`, `hooks/`, `public/`
