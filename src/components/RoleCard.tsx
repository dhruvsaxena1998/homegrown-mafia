import { ROLES } from '@/domain/roles'
import type { Alignment, RoleId } from '@/domain/roles'
import { cn } from '@/lib/utils'

type Props = {
  roleId: RoleId
  allyNames: string[]
  /** 0 to 1. The card develops up out of the dark as the hold completes. */
  progress: number
}

/** Derived from alignment so a new role never states a wrong win condition. */
const WIN_TEXT: Record<Alignment, string> = {
  mafia: 'When the Mafia are as many as everyone else left alive.',
  town: 'When every last Mafia is voted out or gone.',
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

function Line({ label, children }: { label: string; children: string }) {
  return (
    <div className="flex gap-3">
      <span className="eyebrow w-[4.25rem] shrink-0 pt-[0.2rem] text-muted-foreground">
        {label}
      </span>
      <span className="flex-1 text-[0.8125rem] leading-snug">{children}</span>
    </div>
  )
}

/**
 * The one lit surface in the app. It stays illegible for most of the hold and
 * blooms at the end, so a glance over a shoulder never resolves into a role.
 */
export function RoleCard({ roleId, allyNames, progress }: Props) {
  const role = ROLES[roleId]
  const reduced = prefersReducedMotion()
  // Stays illegible for most of the hold, then blooms — a glance never resolves.
  const developed = reduced ? (progress >= 1 ? 1 : 0) : Math.pow(progress, 2.5)

  return (
    <div
      className="ground-reveal relative w-full overflow-hidden rounded-xl bg-background text-left text-foreground"
      style={{
        opacity: 0.04 + 0.96 * developed,
        filter: `blur(${(1 - developed) * 14}px)`,
        transform: `scale(${0.94 + 0.06 * developed})`,
      }}
      aria-hidden={developed < 1}
    >
      <div className="flex flex-col gap-4 px-6 py-7">
        <div className="flex items-baseline justify-between gap-3">
          <span className="eyebrow text-muted-foreground">Your role</span>
          {/* The Mafia card's headline already names the side; only town roles
              need telling which team they are on. */}
          {role.alignment === 'town' && (
            <span className="eyebrow text-muted-foreground">Town</span>
          )}
        </div>

        {/* Red is reserved for the Mafia. A Civilian card shouting danger both
            wastes the accent and misreads at a glance. */}
        <h2
          className={cn(
            'display-lg',
            role.alignment === 'mafia' ? 'text-stamp' : 'text-foreground',
          )}
        >
          {role.name}
        </h2>

        <p className="text-[0.875rem] leading-snug text-foreground/80">
          {role.cardText}
        </p>

        <div className="h-px w-full bg-foreground/15" />

        <div className="flex flex-col gap-2.5">
          <Line label="At night">{role.nightText}</Line>
          <Line label="By day">{role.dayText}</Line>
          <Line label="You win">{WIN_TEXT[role.alignment]}</Line>
        </div>

        {allyNames.length > 0 && (
          <>
            <div className="h-px w-full bg-foreground/15" />
            <div className="flex gap-3">
              <span className="eyebrow w-[4.25rem] shrink-0 pt-[0.2rem] text-muted-foreground">
                With you
              </span>
              <span className="flex flex-1 flex-col gap-0.5">
                {allyNames.map((name) => (
                  <span key={name} className="font-mono text-[0.8125rem] tracking-tight">
                    {name}
                  </span>
                ))}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
