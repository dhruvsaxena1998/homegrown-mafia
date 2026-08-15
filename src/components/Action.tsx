import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Props = {
  children: ReactNode
  onClick?: () => void
  variant?: 'solid' | 'quiet'
  disabled?: boolean
  /** Trailing mono glyph. Pass null to drop it on dead-end states. */
  marker?: string | null
  type?: 'button' | 'submit'
}

/**
 * The primary control. Shares its anatomy with SeatRow — label left, marker
 * right — so an action reads as the same kind of object as a name in the roll
 * call, in the same condensed voice as the headings.
 */
export function Action({
  children,
  onClick,
  variant = 'solid',
  disabled = false,
  marker = '→',
  type = 'button',
}: Props) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex h-16 w-full items-center justify-between gap-4 rounded-md border px-5',
        'font-display text-[1.375rem] leading-none tracking-[0.02em] uppercase',
        'transition-colors duration-150',
        variant === 'solid'
          ? 'border-transparent bg-primary text-primary-foreground active:bg-primary/85'
          : 'border-border text-foreground active:bg-accent',
        disabled && 'pointer-events-none opacity-35',
      )}
    >
      <span className="min-w-0 truncate text-left">{children}</span>
      {marker && (
        <span className="shrink-0 font-mono text-sm opacity-55">{marker}</span>
      )}
    </button>
  )
}

/** De-emphasised escape hatches: back, skip, clear. Speaks in the eyebrow voice. */
export function QuietAction({
  children,
  onClick,
  disabled = false,
}: {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'eyebrow h-11 w-full rounded-md text-muted-foreground transition-colors',
        'active:bg-accent active:text-foreground',
        disabled && 'pointer-events-none opacity-35',
      )}
    >
      {children}
    </button>
  )
}
