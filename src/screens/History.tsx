import { useState } from 'react'
import { Action, QuietAction, QuietSlot } from '@/components/Action'
import { ConfirmRow } from '@/components/ConfirmRow'
import { Screen } from '@/components/Screen'
import { ROLES } from '@/domain/roles'
import { recapOf } from '@/domain/recap'
import type { RecapSection } from '@/domain/recap'
import type { FinishedGame } from '@/domain/types'
import { useStore } from '@/hooks/useStore'
import { cn } from '@/lib/utils'
import { formatDate, formatDuration, ordinal } from '@/lib/format'

/** One round of the game, as it actually played out. */
function Round({ section }: { section: RecapSection }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="eyebrow border-b border-border pb-2 text-muted-foreground">
        {section.title}
      </h3>
      <ul className="flex flex-col gap-1.5">
        {section.lines.map((line) => (
          <li
            key={line.key}
            className={cn(
              'text-sm leading-snug',
              line.tone === 'stamp' && 'text-stamp-bright',
              line.tone === 'muted' && 'text-muted-foreground',
            )}
          >
            {line.text}
          </li>
        ))}
      </ul>
    </section>
  )
}

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
            Ended on the {ordinal(open.dayNumber)} day ·{' '}
            {formatDuration(open.endedAt - open.startedAt)} ·{' '}
            {open.seats.filter((s) => s.alive).length} of {open.seats.length} left
            standing
          </p>
        </div>

        {/* Replayed from the log the host was writing all night without ever
            getting to read it back. */}
        <div className="flex flex-col gap-6 pb-9">
          {recapOf(open).map((section) => (
            <Round key={section.key} section={section} />
          ))}
        </div>

        <span className="eyebrow pb-3 text-muted-foreground">The table</span>
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
          <QuietSlot>
            {store.history.length > 0 ? (
              confirmClear ? (
                <ConfirmRow
                  question="Delete every past game?"
                  confirmLabel="Delete"
                  onCancel={() => setConfirmClear(false)}
                  onConfirm={() => {
                    dispatch({ type: 'CLEAR_HISTORY' })
                    setConfirmClear(false)
                  }}
                />
              ) : (
                <QuietAction onClick={() => setConfirmClear(true)}>
                  Clear history
                </QuietAction>
              )
            ) : null}
          </QuietSlot>
          <Action variant="quiet" marker={null} onClick={onBack}>
            Back
          </Action>
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
