import clsx from 'clsx'

type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg'

const sizes: Record<SpinnerSize, string> = {
  xs: 'w-3 h-3 border',
  sm: 'w-4 h-4 border',
  md: 'w-5 h-5 border-2',
  lg: 'w-7 h-7 border-2',
}

export function Spinner({ size = 'md', className }: { size?: SpinnerSize; className?: string }) {
  return (
    <span
      className={clsx(
        'inline-block rounded-full border-text-muted border-t-accent animate-spin',
        sizes[size],
        className,
      )}
    />
  )
}
