import clsx from 'clsx'

interface SkeletonProps {
  className?: string
  lines?: number
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        'bg-elevated rounded animate-pulse',
        className,
      )}
    />
  )
}

export function SkeletonText({ lines = 3, className }: SkeletonProps) {
  return (
    <div className={clsx('flex flex-col gap-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={clsx('h-3', i === lines - 1 ? 'w-3/4' : 'w-full')}
        />
      ))}
    </div>
  )
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={clsx('bg-surface border border-border-default rounded-lg p-4 space-y-3', className)}>
      <Skeleton className="h-3 w-1/3" />
      <SkeletonText lines={2} />
    </div>
  )
}
