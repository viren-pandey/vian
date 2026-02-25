import clsx from 'clsx'
import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export function Input({ label, error, hint, className, id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-xs text-text-secondary font-ui">
          {label}
        </label>
      )}
      <input
        id={inputId}
        {...props}
        className={clsx(
          'h-8 px-3 rounded bg-elevated border text-sm text-text-primary placeholder-text-muted font-ui',
          'transition-colors duration-200 outline-none',
          error
            ? 'border-error focus:border-error'
            : 'border-border-default focus:border-border-strong',
          props.disabled && 'opacity-40 pointer-events-none',
          className,
        )}
      />
      {error && <p className="text-xs text-error font-ui">{error}</p>}
      {hint && !error && <p className="text-xs text-text-muted font-ui">{hint}</p>}
    </div>
  )
}
