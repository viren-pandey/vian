import clsx from 'clsx'
import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'ghost' | 'outline' | 'danger'
type Size    = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

const base =
  'inline-flex items-center justify-center gap-2 rounded font-ui font-medium transition-colors duration-200 focus:outline-none disabled:opacity-40 disabled:pointer-events-none select-none'

const variants: Record<Variant, string> = {
  primary: 'bg-accent text-white hover:bg-accent-hover',
  ghost:   'bg-transparent text-text-secondary hover:text-text-primary hover:bg-elevated',
  outline: 'border border-border-default text-text-secondary hover:border-border-strong hover:text-text-primary bg-transparent',
  danger:  'bg-error/10 text-error hover:bg-error/20 border border-error/20',
}

const sizes: Record<Size, string> = {
  sm: 'h-7 px-3 text-xs',
  md: 'h-8 px-4 text-sm',
  lg: 'h-9 px-5 text-sm',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={props.disabled ?? loading}
      className={clsx(base, variants[variant], sizes[size], className)}
    >
      {loading ? (
        <span className="w-3.5 h-3.5 border border-current border-t-transparent rounded-full animate-spin" />
      ) : null}
      {children}
    </button>
  )
}
