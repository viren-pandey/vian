import clsx from 'clsx'

type BadgeVariant = 'default' | 'accent' | 'success' | 'warning' | 'error' | 'muted'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}

const variants: Record<BadgeVariant, string> = {
  default: 'bg-elevated text-text-secondary border-border-default',
  accent:  'bg-accent/10 text-accent border-accent/20',
  success: 'bg-success/10 text-success border-success/20',
  warning: 'bg-warning/10 text-warning border-warning/20',
  error:   'bg-error/10 text-error border-error/20',
  muted:   'bg-transparent text-text-muted border-border-subtle',
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-medium font-ui leading-none',
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}
