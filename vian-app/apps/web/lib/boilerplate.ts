export interface BoilerplateFile {
  path:    string
  content: string
}

/**
 * VIAN Mandatory Boilerplate
 * These files are planted into the WebContainer BEFORE the AI generation starts.
 * npm install runs in the background while AI streams files.
 * Dev server starts the moment AI delivers app/page.tsx.
 */
export const BOILERPLATE_FILES: BoilerplateFile[] = [
  {
    path: 'package.json',
    content: JSON.stringify(
      {
        name: 'vian-app',
        version: '0.1.0',
        private: true,
        scripts: {
          dev:   'next dev',
          build: 'next build',
          start: 'next start',
          lint:  'next lint',
        },
        dependencies: {
          next:           '14.2.5',
          react:          '18.3.1',
          'react-dom':    '18.3.1',
          clsx:           '2.1.1',
          'lucide-react': '0.395.0',
        },
        devDependencies: {
          '@types/node':      '20.14.2',
          '@types/react':     '18.3.3',
          '@types/react-dom': '18.3.0',
          autoprefixer:       '10.4.19',
          postcss:            '8.4.38',
          tailwindcss:        '3.4.4',
          typescript:         '5.4.5',
        },
      },
      null,
      2,
    ),
  },

  {
    path: 'next.config.js',
    content: `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
          { key: 'Cross-Origin-Opener-Policy',   value: 'same-origin'  },
        ],
      },
    ]
  },
}
module.exports = nextConfig`,
  },

  {
    path: 'tsconfig.json',
    content: JSON.stringify(
      {
        compilerOptions: {
          target:            'ES2017',
          lib:               ['dom', 'dom.iterable', 'esnext'],
          allowJs:           true,
          skipLibCheck:      true,
          strict:            true,
          noEmit:            true,
          esModuleInterop:   true,
          module:            'esnext',
          moduleResolution:  'bundler',
          resolveJsonModule: true,
          isolatedModules:   true,
          jsx:               'preserve',
          incremental:       true,
          plugins:           [{ name: 'next' }],
          paths:             { '@/*': ['./*'] },
        },
        include:  ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
        exclude:  ['node_modules'],
      },
      null,
      2,
    ),
  },

  {
    path: 'postcss.config.js',
    content: `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`,
  },

  {
    path: 'tailwind.config.ts',
    content: `import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background:  'hsl(var(--background))',
        foreground:  'hsl(var(--foreground))',
        primary:     { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary:   { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        muted:       { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent:      { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        card:        { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
        border:      'hsl(var(--border))',
        input:       'hsl(var(--input))',
        ring:        'hsl(var(--ring))',
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      keyframes: {
        'fade-in':  { from: { opacity: '0' }, to: { opacity: '1' } },
        'fade-up':  { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        'scale-in': { from: { opacity: '0', transform: 'scale(0.95)' }, to: { opacity: '1', transform: 'scale(1)' } },
        shimmer:    { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
      animation: {
        'fade-in':  'fade-in 0.3s ease-out',
        'fade-up':  'fade-up 0.4s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
        shimmer:    'shimmer 2s linear infinite',
      },
    },
  },
  plugins: [],
}

export default config`,
  },

  {
    path: 'app/globals.css',
    content: `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 224 71.4% 4.1%;
    --card: 0 0% 100%;
    --card-foreground: 224 71.4% 4.1%;
    --primary: 220.9 39.3% 11%;
    --primary-foreground: 210 20% 98%;
    --secondary: 220 14.3% 95.9%;
    --secondary-foreground: 220.9 39.3% 11%;
    --muted: 220 14.3% 95.9%;
    --muted-foreground: 220 8.9% 46.1%;
    --accent: 220 14.3% 95.9%;
    --accent-foreground: 220.9 39.3% 11%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 20% 98%;
    --border: 220 13% 91%;
    --input: 220 13% 91%;
    --ring: 224 71.4% 4.1%;
    --radius: 0.5rem;
    --font-sans: system-ui, -apple-system, 'Segoe UI', sans-serif;
    --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
  }

  .dark {
    --background: 224 71.4% 4.1%;
    --foreground: 210 20% 98%;
    --card: 222 47% 7%;
    --card-foreground: 210 20% 98%;
    --primary: 210 20% 98%;
    --primary-foreground: 220.9 39.3% 11%;
    --secondary: 215 27.9% 16.9%;
    --secondary-foreground: 210 20% 98%;
    --muted: 215 27.9% 16.9%;
    --muted-foreground: 217.9 10.6% 64.9%;
    --accent: 215 27.9% 16.9%;
    --accent-foreground: 210 20% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 20% 98%;
    --border: 215 27.9% 16.9%;
    --input: 215 27.9% 16.9%;
    --ring: 216 12.2% 83.9%;
  }
}

*, *::before, *::after { box-sizing: border-box; }

body {
  background-color: hsl(var(--background));
  color: hsl(var(--foreground));
  font-family: var(--font-sans);
  font-feature-settings: "rlig" 1, "calt" 1;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  min-height: 100vh;
}

h1, h2, h3, h4, h5, h6 { font-weight: 600; letter-spacing: -0.02em; }
a { color: inherit; text-decoration: none; }

/* Scrollbar */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: hsl(var(--border)); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: hsl(var(--muted-foreground)); }

/* Skeleton shimmer */
.skeleton {
  background: linear-gradient(90deg,hsl(var(--muted)) 25%,hsl(var(--secondary)) 50%,hsl(var(--muted)) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
@keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }

/* Focus ring helper */
.focus-ring { @apply outline-none ring-2 ring-ring ring-offset-2 ring-offset-background; }`,
  },

  {
    path: 'app/layout.tsx',
    content: `import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'My App',
  description: 'Generated by VIAN',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <head>
        <script dangerouslySetInnerHTML={{ __html: \`
          window.onerror = function(msg, src, line, col, err) {
            window.parent && window.parent.postMessage({ type: 'preview-error', message: (err && err.message) || msg }, '*');
          };
          window.addEventListener('unhandledrejection', function(e) {
            window.parent && window.parent.postMessage({ type: 'preview-error', message: e.reason && e.reason.message ? e.reason.message : String(e.reason) }, '*');
          });
        \` }} />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">{children}</body>
    </html>
  )
}`,
  },

  {
    path: 'app/page.tsx',
    content: `export default function Page() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-background gap-3">
      <div
        style={{
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          background: 'hsl(var(--primary))',
          animation: 'pulse 1.4s ease-in-out infinite',
        }}
      />
      <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '13px', fontFamily: 'monospace' }}>
        Generating your app\u2026
      </p>
      <style>{\`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.75); }
        }
      \`}</style>
    </main>
  )
}`,
  },

  {
    path: 'lib/utils.ts',
    content: `import { type ClassValue, clsx } from 'clsx'

export function cn(...inputs: ClassValue[]) { return clsx(inputs) }

// ── Date ──────────────────────────────────────────────────────────────────────
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(date))
}
export function formatDateShort(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(date))
}
export function timeAgo(date: string | Date): string {
  const secs = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  const intervals: [number, string][] = [[31536000,'year'],[2592000,'month'],[86400,'day'],[3600,'hour'],[60,'minute']]
  for (const [s, label] of intervals) {
    const n = Math.floor(secs / s)
    if (n >= 1) return n === 1 ? \`1 \${label} ago\` : \`\${n} \${label}s ago\`
  }
  return 'just now'
}

// ── Numbers ───────────────────────────────────────────────────────────────────
export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
}
export function formatCompact(n: number): string {
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n)
}

// ── Strings ───────────────────────────────────────────────────────────────────
export function slugify(text: string): string {
  return text.toLowerCase().trim().replace(/[^\\w\\s-]/g,'').replace(/[\\s_-]+/g,'-').replace(/^-+|-+$/g,'')
}
export function capitalize(s: string): string { return s.charAt(0).toUpperCase() + s.slice(1) }
export function truncate(s: string, max: number, suffix = '...'): string {
  return s.length <= max ? s : s.slice(0, max - suffix.length) + suffix
}
export function initials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

// ── Arrays ────────────────────────────────────────────────────────────────────
export function groupBy<T>(arr: T[], key: keyof T): Record<string, T[]> {
  return arr.reduce((acc, item) => {
    const k = String(item[key])
    ;(acc[k] ??= []).push(item)
    return acc
  }, {} as Record<string, T[]>)
}
export function unique<T>(arr: T[], key?: keyof T): T[] {
  if (!key) return [...new Set(arr)]
  const seen = new Set<unknown>()
  return arr.filter(item => { const v = item[key]; if (seen.has(v)) return false; seen.add(v); return true })
}
export function chunk<T>(arr: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) => arr.slice(i * size, i * size + size))
}

// ── Misc ──────────────────────────────────────────────────────────────────────
export function generateId(prefix = ''): string {
  const r = Math.random().toString(36).slice(2, 9)
  return prefix ? \`\${prefix}_\${r}\` : r
}
export function debounce<T extends (...args: unknown[]) => unknown>(fn: T, delay: number): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay) }
}
export const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))`,
  },

  {
    path: 'lib/types.ts',
    content: `// ── API ───────────────────────────────────────────────────────────────────────
export interface ApiResponse<T = unknown> { data: T; message?: string; success: boolean }
export interface PaginatedResponse<T> {
  data: T[]; total: number; page: number; pageSize: number; totalPages: number; hasMore: boolean
}

// ── Entities ──────────────────────────────────────────────────────────────────
export interface User {
  id: string; name: string; email: string; avatar?: string
  role: 'admin' | 'user' | 'guest'; createdAt: string; updatedAt: string
}
export interface Session { user: User; token: string; expiresAt: string }

// ── UI ────────────────────────────────────────────────────────────────────────
export type Status    = 'idle' | 'loading' | 'success' | 'error'
export type SortDir   = 'asc' | 'desc'
export type Theme     = 'light' | 'dark' | 'system'
export interface SelectOption { value: string; label: string; disabled?: boolean }
export interface NavItem { label: string; href: string; icon?: React.ElementType; badge?: string | number }`,
  },

  {
    path: 'lib/constants.ts',
    content: `export const APP_NAME    = 'My App'
export const APP_VERSION = '1.0.0'
export const API_BASE    = process.env.NEXT_PUBLIC_API_URL ?? '/api'

export const DEFAULT_PAGE_SIZE = 10
export const MAX_PAGE_SIZE     = 100

export const ROUTES = {
  home:      '/',
  login:     '/login',
  register:  '/register',
  dashboard: '/dashboard',
  settings:  '/settings',
  profile:   '/profile',
} as const`,
  },

  {
    path: 'lib/api-client.ts',
    content: `import type { ApiResponse } from './types'

const BASE = process.env.NEXT_PUBLIC_API_URL ?? '/api'

async function req<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(\`\${BASE}\${path}\`, {
    headers: { 'Content-Type': 'application/json', ...(opts.headers ?? {}) },
    ...opts,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }))
    throw Object.assign(new Error(err.message ?? 'Request failed'), { status: res.status })
  }
  const json: ApiResponse<T> = await res.json()
  return json.data
}

export const api = {
  get:    <T>(path: string, init?: RequestInit) => req<T>(path, { ...init, method: 'GET' }),
  post:   <T>(path: string, body: unknown, init?: RequestInit) =>
            req<T>(path, { ...init, method: 'POST', body: JSON.stringify(body) }),
  put:    <T>(path: string, body: unknown, init?: RequestInit) =>
            req<T>(path, { ...init, method: 'PUT', body: JSON.stringify(body) }),
  patch:  <T>(path: string, body: unknown, init?: RequestInit) =>
            req<T>(path, { ...init, method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string, init?: RequestInit) => req<T>(path, { ...init, method: 'DELETE' }),
}`,
  },
]
