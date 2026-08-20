import type { ReactNode } from 'react'
import { RulesSheet } from '@/components/RulesSheet'
import { QuitGame } from '@/components/QuitGame'
import { HapticsDebugToggle } from '@/components/HapticsDebugToggle'
import { useStore } from '@/hooks/useStore'
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
  const { saveFailed } = useStore()

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
          <HapticsDebugToggle />
          <RulesSheet />
          <QuitGame />
        </span>
      </header>

      {/* Persistent, not a toast: if the deal only exists in memory the host
          needs to know for the rest of the game, not for four seconds. */}
      {saveFailed && (
        <div
          role="status"
          className="relative z-10 mx-6 mb-2 rounded-md border border-stamp/40 bg-card px-3 py-2"
        >
          <p className="text-xs leading-relaxed text-foreground/80">
            <span className="eyebrow text-stamp-bright">Not saved</span> — this
            phone has no storage room. Do not close the app; the game would be
            lost.
          </p>
        </div>
      )}

      <main
        className={cn(
          'relative z-10 flex flex-1 flex-col overflow-y-auto px-6 pb-2',
          className,
        )}
      >
        {children}
      </main>

      {/* The home-indicator inset is the only thing that should lift the action
          off the bottom edge — the 0.5rem floor is for phones reporting none. */}
      {footer && (
        <footer className="relative z-10 flex shrink-0 flex-col gap-2 px-6 pt-4 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
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
