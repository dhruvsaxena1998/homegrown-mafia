import { useState } from 'react'
import { Action, QuietAction } from '@/components/Action'
import { Button } from '@/components/ui/button'
import { Screen } from '@/components/Screen'
import { ROLES } from '@/domain/roles'
import type { FinishedGame } from '@/domain/types'
import { useStore } from '@/hooks/useStore'
import { cn } from '@/lib/utils'
import { formatDate, ordinal } from '@/lib/format'

export function History({ onBack }: { onBack: () => void }) {
  const { store, dispatch } = useStore()
  const [open, setOpen] = useState<FinishedGame | null>(null)
  const [confirmClear, setConfirmClear] = useState(false)

  if (open) {
    return (
      <Screen
        ground="reveal"
        eyebrow={`${formatDate(open.startedAt)} · hosted by ${open.hostName}`}
        footer={
          <Action variant="quiet" marker={null} onClick={() => setOpen(null)}>
            Back to past games
          </Action>
        }
      >
        <div className="flex flex-col gap-3 pb-8">
          <h1 className={cn('display-lg', open.winner === 'mafia' && 'text-stamp')}>
            {open.winner === 'mafia' ? 'Mafia win' : 'Town wins'}
          </h1>
          <p className="text-sm text-muted-foreground">
            Ended on the {ordinal(open.dayNumber)} day.
          </p>
        </div>

        <div className="flex flex-col pb-4">
          {open.seats.map((seat) => (
            <div
              key={seat.id}
              className="flex items-baseline justify-between gap-4 border-b border-border py-3.5"
            >
              <span
                className={cn(
                  'truncate text-[0.9375rem] font-medium',
                  !seat.alive && 'text-foreground/45 line-through decoration-stamp',
                )}
              >
                {seat.name}
              </span>
              <span
                className={cn(
                  'eyebrow shrink-0',
                  ROLES[seat.roleId].alignment === 'mafia'
                    ? 'text-stamp'
                    : 'text-muted-foreground',
                )}
              >
                {ROLES[seat.roleId].name}
              </span>
            </div>
          ))}
        </div>
      </Screen>
    )
  }

  return (
    <Screen
      ground="night"
      eyebrow={`${store.history.length} played`}
      footer={
        <>
          <Action variant="quiet" marker={null} onClick={onBack}>
            Back
          </Action>
          {store.history.length > 0 &&
            (confirmClear ? (
              <div className="flex items-center gap-2 rounded-md border border-stamp/40 bg-card px-3 py-2.5">
                <span className="flex-1 text-sm">Delete every past game?</span>
                <Button size="sm" variant="ghost" onClick={() => setConfirmClear(false)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    dispatch({ type: 'CLEAR_HISTORY' })
                    setConfirmClear(false)
                  }}
                >
                  Delete
                </Button>
              </div>
            ) : (
              <QuietAction onClick={() => setConfirmClear(true)}>
                Clear history
              </QuietAction>
            ))}
        </>
      }
    >
      <h1 className="display-lg pb-6">Past games</h1>

      <div className="flex flex-col gap-2 pb-4">
        {store.history.map((finished) => (
          <button
            key={finished.id}
            type="button"
            onClick={() => setOpen(finished)}
            className="flex items-center gap-4 rounded-md border border-border bg-card/45 px-4 py-4 text-left active:bg-accent"
          >
            <span className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="truncate text-[0.9375rem] font-medium">
                {finished.seats.length} players · {formatDate(finished.startedAt)}
              </span>
              <span className="truncate text-xs text-muted-foreground">
                Hosted by {finished.hostName}
              </span>
            </span>
            <span
              className={cn(
                'eyebrow shrink-0',
                finished.winner === 'mafia' ? 'text-stamp-bright' : 'text-muted-foreground',
              )}
            >
              {finished.winner === 'mafia' ? 'Mafia' : 'Town'}
            </span>
          </button>
        ))}
      </div>
    </Screen>
  )
}
