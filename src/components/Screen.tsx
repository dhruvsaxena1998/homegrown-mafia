import type { ReactNode } from 'react'
import { RulesSheet } from '@/components/RulesSheet'
import { cn } from '@/lib/utils'

export type Ground = 'night' | 'day' | 'reveal'

const GROUND_CLASS: Record<Ground, string> = {
  night: 'ground-night',
  day: 'ground-day',
  reveal: 'ground-reveal',
}

type Props = {
  ground: Ground
  /** Small mono label naming where you are in the game's clock. */
  eyebrow?: string
  /** Sits opposite the eyebrow — the host's Adjust affordance, usually. */
  aside?: ReactNode
  children: ReactNode
  /** Primary action. Pinned to the bottom third, inside the safe area. */
  footer?: ReactNode
  className?: string
}

/**
 * Every screen is the same instrument: a thin case-file header, the content,
 * and one thumb-reachable action. The ground repaints with the phase.
 */
export function Screen({ ground, eyebrow, aside, children, footer, className }: Props) {
  return (
    <div
      className={cn(
        GROUND_CLASS[ground],
        'relative flex h-[100dvh] flex-col bg-background text-foreground',
        'transition-colors duration-700',
      )}
    >
      {ground === 'night' && (
        <div className="vignette pointer-events-none absolute inset-0 z-0" aria-hidden />
      )}

      <header className="relative z-10 flex items-center justify-between gap-3 px-6 pt-[max(1rem,env(safe-area-inset-top))] pb-3">
        <span className="eyebrow min-w-0 truncate text-muted-foreground">{eyebrow}</span>
        {/* Rules sit in the frame, not on a screen, so they are one tap away
            from wherever the game has got to. */}
        <span className="flex shrink-0 items-center gap-3.5">
          {aside}
          <RulesSheet />
        </span>
      </header>

      <main
        className={cn(
          'relative z-10 flex flex-1 flex-col overflow-y-auto px-6 pb-2',
          className,
        )}
      >
        {children}
      </main>

      {footer && (
        <footer className="relative z-10 flex flex-col gap-2 px-6 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          {/* Content scrolls under the action; fade it out rather than clip it. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 -top-10 h-10 bg-gradient-to-t from-background to-transparent"
          />
          {footer}
        </footer>
      )}
    </div>
  )
}
