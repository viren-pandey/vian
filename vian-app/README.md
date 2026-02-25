# VIAN — AI App Generator

> Generate complete Next.js applications from natural language prompts. Built by Viren Pandey.

## Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Copy env and add your API keys
cp apps/api/.env.example apps/api/.env

# 3. Start everything
pnpm dev
```

- **Web:** http://localhost:3000
- **API:** http://localhost:4000

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Code Editor | Monaco Editor (`@monaco-editor/react`) |
| Preview | WebContainers (`@webcontainer/api`) |
| Backend | Express 4, TypeScript, tsx |
| AI | OpenAI GPT-4o / Anthropic Claude 3.5 |
| Monorepo | pnpm workspaces |
| Database | PostgreSQL + Prisma (optional) |

## Structure

```
vian-app/
├── apps/web      # Next.js 14 frontend
├── apps/api      # Express backend
└── packages/
    ├── shared-types  # Shared TypeScript interfaces
    └── prisma        # Database schema
```
