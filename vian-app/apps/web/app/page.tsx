'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Zap, Code2, Eye, Share2, ArrowRight,
  ChevronRight, Terminal, Layers, Lock,
} from 'lucide-react'
import { useProjectStore } from '@/stores/projectStore'
import { MODELS, type ModelId } from '@/lib/constants'

// ─── Typing animation hook ────────────────────────────────────────────────────
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
  const { reset, setProjectName, setModel: storeSetModel } = useProjectStore()
  const [prompt, setPrompt] = useState('')
  const [selectedModel, setSelectedModel] = useState<ModelId>('llama-3.3-70b-versatile')
  const [authUser, setAuthUser] = useState<{ name: string; email: string } | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('vian_user')
      if (raw) setAuthUser(JSON.parse(raw))
    } catch {}
  }, [])

  function handleSignOut() {
    localStorage.removeItem('vian_token')
    localStorage.removeItem('vian_user')
    document.cookie = 'vian_token=; path=/; max-age=0'
    setAuthUser(null)
    setDropdownOpen(false)
  }
  const typedText = useTypingAnimation([
    'a todo app with authentication',
    'an e-commerce store with Stripe',
    'a real-time chat application',
    'a dashboard with analytics',
    'a blog with markdown support',
    'a SaaS platform with billing',
  ])

  const examplePrompts = ['Todo app', 'E-commerce store', 'Blog with auth', 'Analytics dashboard', 'Chat application']

  function handleGenerate() {
    if (!prompt.trim()) return
    reset()
    storeSetModel(selectedModel)
    const name = prompt.trim().split(' ').slice(0, 4).join('-').toLowerCase().replace(/[^a-z0-9-]/g, '') || 'my-app'
    setProjectName(name)
    router.push(`/studio/${name}?prompt=${encodeURIComponent(prompt.trim())}`)
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-[#f0f0f0] overflow-x-hidden" style={{ fontFamily: "'Geist', sans-serif" }}>

      {/* grid background */}
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: `linear-gradient(rgba(59,130,246,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.03) 1px, transparent 1px)`, backgroundSize: '48px 48px' }} />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] pointer-events-none" style={{ background: 'radial-gradient(ellipse at center top, rgba(59,130,246,0.12) 0%, transparent 70%)' }} />

      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-[52px] flex items-center justify-between px-6 border-b border-[#1a1a1a] bg-[#0d0d0d]/80 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="text-[#3b82f6] text-lg font-semibold tracking-tight">◆</span>
          <span className="text-[#f0f0f0] text-sm font-semibold tracking-tight">VIAN</span>
          <span className="text-[#333333] text-xs font-mono ml-1">by Viren</span>
        </div>
        <div className="hidden md:flex items-center gap-6">
          {['Features', 'How it works'].map((link) => (
            <a key={link} href={`#${link.toLowerCase().replace(' ', '-')}`} className="text-[#888888] text-sm hover:text-[#f0f0f0] transition-colors">{link}</a>
          ))}
        </div>
        <div className="flex items-center gap-3">
          {authUser ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen((o) => !o)}
                className="flex items-center gap-2 text-sm bg-[#141414] border border-[#2a2a2a] hover:border-[#3a3a3a] rounded-lg px-3 py-1.5 transition-colors"
              >
                <span className="w-2 h-2 rounded-full bg-[#22c55e] flex-shrink-0" />
                <span className="text-[#888888] text-xs">Hello,</span>
                <span className="text-[#f0f0f0] text-xs font-medium">{authUser.name.split(' ')[0]}</span>
                <ChevronRight className="w-3 h-3 text-[#555555] rotate-90" />
              </button>
              {dropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-52 bg-[#141414] border border-[#2a2a2a] rounded-xl shadow-2xl z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-[#1f1f1f]">
                    <p className="text-[10px] text-[#555555] uppercase tracking-wider">Signed in as</p>
                    <p className="text-xs text-[#f0f0f0] font-medium truncate mt-1">{authUser.email}</p>
                  </div>
                  <a
                    href="/settings"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#888888] hover:text-[#f0f0f0] hover:bg-[#1a1a1a] transition-colors"
                  >
                    Settings
                  </a>
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left flex items-center gap-2 px-4 py-2.5 text-sm text-[#ef4444] hover:bg-[#1a1a1a] transition-colors"
                  >
                    Sign out
                  </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              <a href="/login" className="text-[#888888] text-sm hover:text-[#f0f0f0] transition-colors">Sign in</a>
              <a href="/request-access" className="flex items-center gap-1.5 bg-[#3b82f6] hover:bg-[#2563eb] text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors">
                Request Access <ChevronRight className="w-3 h-3" />
              </a>
            </>
          )}
        </div>
      </nav>

      {/* HERO */}
      <section className="relative pt-36 pb-24 px-6 flex flex-col items-center text-center">
        <div className="flex items-center gap-2 bg-[#141414] border border-[#2a2a2a] rounded-full px-4 py-1.5 mb-8 text-xs text-[#888888]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] animate-pulse" />
          Now in private beta
        </div>
        <h1 className="text-4xl md:text-6xl font-semibold tracking-tight leading-[1.1] max-w-3xl mb-6">
          Build full-stack apps<br /><span className="text-[#3b82f6]">with a single prompt.</span>
        </h1>
        <p className="text-[#888888] text-base md:text-lg max-w-xl mb-12 leading-relaxed">
          VIAN generates production-ready Next.js applications — streamed file by file, with a live preview. Edit with AI. Export instantly.
        </p>
        <div className="w-full max-w-2xl space-y-3">
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#555555]"><Terminal className="w-4 h-4" /></div>
            <input value={prompt} onChange={(e) => setPrompt(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
              placeholder={`Build me ${typedText}|`}
              className="w-full bg-[#141414] border border-[#2a2a2a] hover:border-[#3a3a3a] focus:border-[#3b82f6] rounded-xl pl-11 pr-36 py-4 text-sm text-[#f0f0f0] placeholder:text-[#444444] focus:outline-none transition-colors" />
            <button onClick={handleGenerate} className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2 bg-[#3b82f6] hover:bg-[#2563eb] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
              Generate <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            {MODELS.filter((m) => m.provider === 'Groq (Free)').map((m) => (
              <button key={m.id} onClick={() => setSelectedModel(m.id)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${selectedModel === m.id ? 'border-[#3b82f6] text-[#3b82f6] bg-[#1d3a6e]/30' : 'border-[#2a2a2a] text-[#555555] hover:text-[#888888]'}`}>
                {m.label}
                <span className="ml-1 text-[#22c55e] opacity-75">(free)</span>
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            {examplePrompts.map((p) => (
              <button key={p} onClick={() => setPrompt(`Build me a ${p.toLowerCase()}`)}
                className="text-xs text-[#555555] hover:text-[#888888] bg-[#141414] hover:bg-[#1a1a1a] border border-[#1f1f1f] hover:border-[#2a2a2a] px-3 py-1.5 rounded-full transition-all">
                {p}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-6 mt-12 text-[#555555] text-xs">
          <span>Powered by</span>
          <span className="text-[#888888]">Groq</span>
          <span className="text-[#333333]">·</span>
          <span className="text-[#888888]">Llama 3.3 70B</span>
          <span className="text-[#333333]">·</span>
          <span className="text-[#888888]">WebContainers</span>
        </div>
      </section>

      {/* TERMINAL MOCKUP */}
      <section className="px-6 pb-24 flex justify-center">
        <div className="w-full max-w-4xl rounded-xl border border-[#1f1f1f] bg-[#0d0d0d] overflow-hidden shadow-2xl shadow-black/50">
          <div className="flex items-center justify-between px-4 py-3 bg-[#141414] border-b border-[#1f1f1f]">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[#ef4444]/60" />
              <div className="w-3 h-3 rounded-full bg-[#f59e0b]/60" />
              <div className="w-3 h-3 rounded-full bg-[#22c55e]/60" />
            </div>
            <span className="text-[#555555] text-xs font-mono">VIAN Studio — my-todo-app</span>
            <span className="text-[#3b82f6] text-xs font-mono">● Running</span>
          </div>
          <div className="flex h-64 text-xs font-mono">
            <div className="w-44 border-r border-[#1f1f1f] p-3 space-y-1.5 text-[#555555]">
              <div className="text-[10px] uppercase tracking-widest text-[#333333] mb-2">Explorer</div>
              {[
                { name: '▼ apps/', indent: 0, status: '' },
                { name: 'page.tsx', indent: 2, status: 'done' },
                { name: 'layout.tsx', indent: 2, status: 'done' },
                { name: 'index.ts', indent: 2, status: 'active' },
                { name: 'schema.prisma', indent: 1, status: 'queued' },
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-1.5" style={{ paddingLeft: `${f.indent * 10}px` }}>
                  {f.status === 'done'   && <span className="text-[#22c55e] text-[10px]">✓</span>}
                  {f.status === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] animate-pulse inline-block" />}
                  {f.status === 'queued' && <span className="w-1.5 h-1.5 rounded-full bg-[#333333] inline-block" />}
                  {!f.status            && <span className="w-1.5 h-1.5 inline-block" />}
                  <span className={f.status === 'active' ? 'text-[#f0f0f0]' : ''}>{f.name}</span>
                </div>
              ))}
            </div>
            <div className="flex-1 border-r border-[#1f1f1f] p-4 text-[#555555] leading-relaxed">
              <div className="text-[10px] text-[#3b82f6] mb-3 border-b border-[#1f1f1f] pb-2">apps/api/src/index.ts</div>
              <div className="space-y-1">
                <div><span className="text-[#3b82f6]">import</span> <span className="text-[#f0f0f0]">{'{ express }'}</span> <span className="text-[#3b82f6]">from</span> <span className="text-[#22c55e]">&apos;express&apos;</span></div>
                <div><span className="text-[#3b82f6]">const</span> <span className="text-[#f0f0f0]">app</span> <span className="text-[#888888]">=</span> <span className="text-[#f59e0b]">express</span><span className="text-[#888888]">()</span></div>
                <div className="animate-pulse text-[#3b82f6]">█</div>
              </div>
            </div>
            <div className="w-56 flex flex-col">
              <div className="px-3 py-2 border-b border-[#1f1f1f] text-[10px] text-[#555555] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />localhost:3000
              </div>
              <div className="flex-1 bg-white/5 flex items-center justify-center">
                <span className="text-[#333333] text-[10px]">Live preview</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="px-6 pb-24">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-px bg-[#1f1f1f] rounded-xl overflow-hidden border border-[#1f1f1f]">
          {[
            { value: 30, suffix: 's', label: 'Avg generation time' },
            { value: 12, suffix: '+', label: 'Files per project' },
            { value: 100, suffix: '%', label: 'TypeScript strict' },
            { value: 2, suffix: ' AI models', label: 'GPT-4o & Claude' },
          ].map((stat) => (
            <div key={stat.label} className="bg-[#0d0d0d] p-6 text-center">
              <div className="text-2xl font-semibold text-[#f0f0f0] mb-1"><AnimatedNumber target={stat.value} suffix={stat.suffix} /></div>
              <div className="text-xs text-[#555555]">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="px-6 pb-24">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[#3b82f6] text-xs font-mono uppercase tracking-widest mb-3">Features</p>
            <h2 className="text-2xl md:text-3xl font-semibold text-[#f0f0f0]">Everything you need. Nothing you don&apos;t.</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {[
              { icon: <Zap className="w-4 h-4" />,   title: 'Instant generation', desc: 'Type a prompt. Get a complete, production-ready Next.js app in under 30 seconds.' },
              { icon: <Eye className="w-4 h-4" />,    title: 'Live preview',       desc: 'A real Next.js dev server runs in your browser via WebContainers. See your app live as each file is generated.' },
              { icon: <Code2 className="w-4 h-4" />,  title: 'AI-powered editing', desc: 'Chat to modify your app. VIAN identifies the affected files and surgically updates only what changed.' },
              { icon: <Layers className="w-4 h-4" />, title: 'Strict monorepo',    desc: 'Every project follows a clean pnpm monorepo structure.' },
              { icon: <Share2 className="w-4 h-4" />, title: 'Share & export',     desc: 'Share a read-only link or export the full codebase as a zip. Ready to deploy.' },
              { icon: <Lock className="w-4 h-4" />,   title: 'Beta access control',desc: 'Invite-only during beta. Every user is manually approved.' },
            ].map((feature) => (
              <div key={feature.title} className="bg-[#141414] border border-[#1f1f1f] hover:border-[#2a2a2a] rounded-xl p-6 transition-colors group">
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-[#3b82f6] group-hover:scale-110 transition-transform">{feature.icon}</div>
                  <h3 className="text-sm font-medium text-[#f0f0f0]">{feature.title}</h3>
                </div>
                <p className="text-xs text-[#555555] leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="px-6 pb-24">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[#3b82f6] text-xs font-mono uppercase tracking-widest mb-3">How it works</p>
            <h2 className="text-2xl md:text-3xl font-semibold text-[#f0f0f0]">From prompt to production in 4 steps.</h2>
          </div>
          <div className="space-y-3">
            {[
              { step: '01', title: 'Write your prompt',   desc: 'Describe what you want to build. Be specific or keep it simple — VIAN figures out the rest.' },
              { step: '02', title: 'Watch it generate',   desc: 'Files stream in one by one. Watch your project materialize in real time in the file explorer.' },
              { step: '03', title: 'Preview live',        desc: 'The moment your files are ready, a live Next.js server boots in your browser.' },
              { step: '04', title: 'Edit, share, export', desc: "Chat to refine your app. Share a link. Export a working zip when you're done." },
            ].map((item) => (
              <div key={item.step} className="flex gap-6 bg-[#141414] border border-[#1f1f1f] rounded-xl p-6 hover:border-[#2a2a2a] transition-colors">
                <span className="text-[#1d3a6e] text-2xl font-bold font-mono flex-shrink-0 w-8">{item.step}</span>
                <div>
                  <h3 className="text-sm font-medium text-[#f0f0f0] mb-1">{item.title}</h3>
                  <p className="text-xs text-[#555555] leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-24">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-[#141414] border border-[#1f1f1f] rounded-2xl p-12 relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 pointer-events-none" style={{ background: 'radial-gradient(ellipse, rgba(59,130,246,0.15) 0%, transparent 70%)' }} />
            <span className="text-[#3b82f6] text-2xl relative z-10">◆</span>
            <h2 className="text-xl md:text-2xl font-semibold text-[#f0f0f0] mt-4 mb-3 relative z-10">Ready to build something?</h2>
            <p className="text-[#555555] text-sm mb-8 relative z-10">VIAN is in private beta. Request access and start building full-stack apps with AI today.</p>
            <a href="/request-access" className="relative z-10 inline-flex items-center gap-2 bg-[#3b82f6] hover:bg-[#2563eb] text-white text-sm font-medium px-6 py-3 rounded-lg transition-colors">
              Request Beta Access <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#1a1a1a] px-6 py-8">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[#3b82f6] font-semibold">◆ VIAN</span>
            <span className="text-[#333333] text-xs">by Viren</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-[#555555]">
            <a href="#features" className="hover:text-[#888888] transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-[#888888] transition-colors">How it works</a>
            <a href="/request-access" className="hover:text-[#888888] transition-colors">Request Access</a>
          </div>
          <span className="text-xs text-[#555555]">Made with VIAN by Viren Pandeyy</span>
        </div>
      </footer>

    </div>
  )
}
