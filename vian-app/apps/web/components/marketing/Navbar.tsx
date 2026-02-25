'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'

const LINKS = [
  { label: 'Studio', href: '/studio' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Docs', href: '/docs' },
]

export function Navbar() {
  const pathname = usePathname()

  return (
    <nav className="fixed top-0 inset-x-0 z-40 h-11 flex items-center justify-between px-6 bg-base/80 backdrop-blur-md border-b border-border-subtle">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2">
        <span className="text-accent font-semibold">◆</span>
        <span className="text-sm font-semibold tracking-tight text-text-primary font-ui">VIAN</span>
      </Link>

      {/* Nav links */}
      <div className="flex items-center gap-6">
        {LINKS.map(({ label, href }) => (
          <Link
            key={href}
            href={href}
            className={clsx(
              'text-xs font-ui transition-colors duration-200',
              pathname === href ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary',
            )}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* CTA */}
      <Link
        href="/request-access"
        className="h-7 px-3 rounded bg-accent text-white text-xs font-medium font-ui hover:bg-accent-hover transition-colors duration-200"
      >
        Request access
      </Link>
    </nav>
  )
}
