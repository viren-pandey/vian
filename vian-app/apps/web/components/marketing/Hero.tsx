import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export function Hero() {
  return (
    <section className="flex flex-col items-center justify-center min-h-screen px-6 text-center pt-11">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Eyebrow */}
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-accent/20 bg-accent/5 text-xs text-accent font-ui">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-dot" />
          Now in beta
        </span>

        {/* Heading */}
        <h1 className="text-5xl font-semibold leading-tight tracking-tight text-text-primary font-ui">
          Build full-stack apps<br />
          <span className="text-accent">with a single prompt</span>
        </h1>

        {/* Sub */}
        <p className="text-base text-text-secondary font-ui max-w-lg mx-auto leading-relaxed">
          VIAN generates complete Next.js applications — frontend, backend, and database — in seconds. Just describe what you want.
        </p>

        {/* CTA */}
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/request-access"
            className="inline-flex items-center gap-2 h-10 px-5 rounded-lg bg-accent text-white text-sm font-medium font-ui hover:bg-accent-hover transition-colors duration-200"
          >
            Request access
            <ArrowRight size={14} />
          </Link>
          <Link
            href="/docs"
            className="inline-flex items-center gap-2 h-10 px-5 rounded-lg border border-border-default text-sm text-text-secondary font-ui hover:border-border-strong hover:text-text-primary transition-colors duration-200"
          >
            Read the docs
          </Link>
        </div>
      </div>
    </section>
  )
}
