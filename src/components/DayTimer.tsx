import { useCountdown } from '@/hooks/useCountdown'
import { formatClock } from '@/lib/format'
import { cn } from '@/lib/utils'

/**
 * A soft aid, not a rule. The host still records the verdict by hand — this
 * just counts the floor down and beats once when it runs out, so nobody has to
 * watch the clock while the table is arguing.
 */
export function DayTimer({
  seconds,
  onExpire,
}: {
  seconds: number
  onExpire?: () => void
}) {
  const { remaining, running, start, pause, reset, expired } = useCountdown(
    seconds,
    onExpire,
  )

  return (
    <div className="mb-5 rounded-md border border-border bg-card/45 px-4 py-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="eyebrow text-muted-foreground">Argument timer</span>
          <span
            className={cn(
              'font-mono text-2xl tabular-nums leading-none',
              expired && 'text-stamp-bright',
            )}
          >
            {expired ? 'Time' : formatClock(remaining)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={running ? pause : start}
            aria-label={running ? 'Pause timer' : 'Start timer'}
            className="grid size-10 place-items-center rounded-md border border-border bg-background/40 font-mono text-sm transition-colors active:bg-accent"
          >
            {running ? '❚❚' : '▶'}
          </button>
          <button
            type="button"
            onClick={reset}
            aria-label="Reset timer"
            className="grid size-10 place-items-center rounded-md border border-border bg-background/40 font-mono text-sm transition-colors active:bg-accent"
          >
            ↺
          </button>
        </div>
      </div>
    </div>
  )
}
