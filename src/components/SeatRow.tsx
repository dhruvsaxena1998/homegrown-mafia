import { cn } from '@/lib/utils'

type Props = {
  index: number
  name: string
  /** Right-aligned mono tag: ALIVE, DEAD, HOST, MAFIA… */
  tag?: string
  tagTone?: 'muted' | 'stamp' | 'plain'
  dead?: boolean
  selected?: boolean
  disabled?: boolean
  onClick?: () => void
}

/**
 * The recurring object in the app: one line of the host's roll call. A dead
 * player is struck through, the way a narrator crosses a name off a list.
 */
export function SeatRow({
  index,
  name,
  tag,
  tagTone = 'muted',
  dead = false,
  selected = false,
  disabled = false,
  onClick,
}: Props) {
  const interactive = Boolean(onClick) && !disabled

  return (
    <button
      type="button"
      disabled={!interactive}
      onClick={onClick}
      className={cn(
        'group flex w-full items-center gap-4 rounded-md border px-4 py-3.5 text-left',
        'transition-colors duration-150',
        selected
          ? 'border-foreground/45 bg-accent'
          : 'border-border bg-card/45',
        interactive && !selected && 'active:bg-accent',
        disabled && 'opacity-35',
        dead && 'opacity-45',
      )}
    >
      <span className="font-mono text-xs tabular-nums text-muted-foreground">
        {String(index).padStart(2, '0')}
      </span>

      <span
        className={cn(
          'min-w-0 flex-1 truncate text-[0.9375rem] font-medium',
          dead && 'line-through decoration-stamp decoration-1',
        )}
      >
        {name}
      </span>

      {tag && (
        <span
          className={cn(
            'eyebrow shrink-0',
            tagTone === 'stamp' && 'text-stamp-bright',
            tagTone === 'muted' && 'text-muted-foreground',
            tagTone === 'plain' && 'text-foreground/70',
          )}
        >
          {tag}
        </span>
      )}
    </button>
  )
}
