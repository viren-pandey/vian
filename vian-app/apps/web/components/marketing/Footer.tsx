export function Footer() {
  return (
    <footer className="border-t border-border-subtle py-8 px-6">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-accent text-sm">◆</span>
          <span className="text-xs font-semibold text-text-primary font-ui">VIAN</span>
          <span className="text-xs text-text-muted font-ui">by Viren</span>
        </div>
        <p className="text-xs text-text-muted font-ui">
          © {new Date().getFullYear()} Viren. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
