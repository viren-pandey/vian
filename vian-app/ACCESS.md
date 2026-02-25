# VIAN — Access & Commands Reference

---

## 🚀 Start Everything

Run these in **two separate terminals** from the project root (`vian-app/`):

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

## 🔗 App Links

| Page | URL | Description |
|---|---|---|
| **Landing / Home** | http://localhost:3000 | Main page — type a prompt & generate |
| **Studio** | http://localhost:3000/studio/[project-id] | Generated app IDE + preview |
| **Request Access** | http://localhost:3000/request-access | Beta access request form |
| **Login** | http://localhost:3000/login | User login |
| **Admin Dashboard** | http://localhost:3000/admin | Manage beta requests + view key health |

---

## 🔗 API Endpoints

| Method | URL | Description |
|---|---|---|
| `GET` | http://localhost:4000/health | Health check |
| `POST` | http://localhost:4000/api/generate | Stream file generation (SSE) |
| `POST` | http://localhost:4000/api/auth/request-access | Submit beta request |
| `POST` | http://localhost:4000/api/auth/login | Login |
| `GET` | http://localhost:4000/api/admin/beta-requests | List all beta requests |
| `PATCH` | http://localhost:4000/api/admin/beta-requests/:id | Approve/reject request |
| `GET` | http://localhost:4000/api/admin/key-health | View API key status |

---

## 🤖 Models Available

### Puter.js — Free & Unlimited (no API key, runs in browser)
| Model ID | Label | Notes |
|---|---|---|
| `puter-gemini-2.5-flash` | Gemini 2.5 Flash ⭐ **default** | Fast, free, unlimited via Puter.js |
| `puter-gemini-2.5-pro` | Gemini 2.5 Pro | Highest quality Gemini, free |
| `puter-gpt-4o` | GPT-4o | OpenAI via Puter.js, free |
| `puter-claude-sonnet-4-5` | Claude 3.5 Sonnet | Anthropic via Puter.js, free |

> Puter.js runs entirely in the browser. No API key needed. Include `<script src="https://js.puter.com/v2/">` — already wired in.

### Server-side providers (require keys in .env)
| Model ID | Label | Provider | Cost |
|---|---|---|---|
| `gemini-2.0-flash` | Gemini 2.0 Flash | Google | Free (1500 req/day/key × 5 keys) |
| `gemini-1.5-pro` | Gemini 1.5 Pro | Google | Free tier |
| `llama-3.3-70b-versatile` | Llama 3.3 70B | Groq | Free |
| `llama-3.1-8b-instant` | Llama 3.1 8B (Fast) | Groq | Free |
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

### Test generation via curl (PowerShell)
```powershell
$body = '{"prompt":"counter app","model":"gemini-2.0-flash","projectId":"test"}'
Invoke-WebRequest -Uri 'http://localhost:4000/api/generate' -Method POST -Body $body -ContentType 'application/json' -UseBasicParsing | Select-Object -ExpandProperty Content
```

---

## 📁 Project Structure

```
vian-app/
├── apps/
│   ├── web/          → Next.js 14 frontend (port 3000)
│   │   ├── app/      → Pages (page.tsx, studio/, admin/, etc.)
│   │   ├── stores/   → Zustand state (projectStore.ts)
│   │   └── lib/      → constants.ts, utils
│   └── api/          → Express backend (port 4000)
│       ├── src/
│       │   ├── services/   → LLMService.ts, KeyManager.ts
│       │   ├── routes/     → generate.ts, auth.ts, admin.ts
│       │   └── middleware/ → accessGuard.ts
│       └── .env            → All API keys go here
└── packages/
    └── prisma/       → DB schema + migrations
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
