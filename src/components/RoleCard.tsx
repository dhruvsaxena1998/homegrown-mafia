import { ROLES } from '@/domain/roles'
import type { RoleId } from '@/domain/roles'
import { cn } from '@/lib/utils'

type Props = {
  roleId: RoleId
  allyNames: string[]
  /** 0 to 1. The card develops up out of the dark as the hold completes. */
  progress: number
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * The one lit surface in the app. It stays illegible for most of the hold and
 * blooms at the end, so a glance over a shoulder never resolves into a role.
 *
 * Deliberately sparse. This is read once, in a dark loud room, by someone
 * holding a thumb down and aware the whole table is waiting on them — so it
 * carries only the role, one line of what it means, and the Mafia's allies.
 * How a role plays at night is re-narrated by the host every round anyway
 * (`wakePrompt`), and the full detail lives one tap away in the rules sheet.
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
      {/* Fixed min height so Mafia (allies block) and town cards match in the hand. */}
      <div className="flex min-h-[17.5rem] flex-col gap-5 px-6 py-9">
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
            'display-xl leading-[0.9]',
            role.alignment === 'mafia' ? 'text-stamp' : 'text-foreground',
          )}
        >
          {role.name}
        </h2>

        <p className="text-[0.9375rem] leading-snug text-foreground/75">
          {role.cardText}
        </p>

        {/* Always reserve the allies band so every role card is the same height.
            Only Mafia fills it — the only thing on this card nobody else will tell them. */}
        <div className="mt-auto flex min-h-[3.75rem] flex-col gap-3">
          {allyNames.length > 0 && (
            <>
              <div className="h-px w-full bg-foreground/15" />
              <div className="flex gap-3">
                <span className="eyebrow w-[4.25rem] shrink-0 pt-[0.2rem] text-muted-foreground">
                  With you
                </span>
                <span className="flex flex-1 flex-col gap-1">
                  {allyNames.map((name) => (
                    <span key={name} className="font-mono text-sm tracking-tight">
                      {name}
                    </span>
                  ))}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
