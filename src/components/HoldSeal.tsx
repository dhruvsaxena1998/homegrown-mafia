import { cn } from '@/lib/utils'

type Props = {
  progress: number
  holding: boolean
  label: string
  handlers: Record<string, unknown>
}

const SIZE = 116
const STROKE = 2
const R = (SIZE - STROKE) / 2
const C = 2 * Math.PI * R

/** The hold target. Sits low on the screen so a thumb reaches it one-handed. */
export function HoldSeal({ progress, holding, label, handlers }: Props) {
  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        {...handlers}
        aria-label={label}
        className={cn(
          'relative grid place-items-center rounded-full border border-border',
          'bg-card/60 transition-transform duration-200',
          holding && 'scale-95',
        )}
        style={{ width: SIZE, height: SIZE, touchAction: 'none' }}
      >
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="absolute inset-0 -rotate-90"
          aria-hidden
        >
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            stroke="var(--stamp)"
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - progress)}
          />
        </svg>
        <span className="eyebrow text-foreground/80">
          {progress >= 1 ? 'Read' : 'Hold'}
        </span>
      </button>

      <p className="eyebrow text-center text-muted-foreground">{label}</p>
    </div>
  )
}
