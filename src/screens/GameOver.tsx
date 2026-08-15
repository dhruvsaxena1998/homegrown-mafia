import { useState } from 'react'
import { Action, QuietAction } from '@/components/Action'
import { ConfirmRow } from '@/components/ConfirmRow'
import { Screen } from '@/components/Screen'
import { ROLES } from '@/domain/roles'
import type { Alignment } from '@/domain/roles'
import { canUndo } from '@/domain/engine'
import type { Game } from '@/domain/types'
import { useStore } from '@/hooks/useStore'
import { cn } from '@/lib/utils'
import { ordinal } from '@/lib/format'

const HEADLINE: Record<Alignment, string> = {
  mafia: 'Mafia win',
  town: 'Town wins',
}

const SUBHEAD: Record<Alignment, string> = {
  mafia: 'They matched the town in number. There is no one left to outvote them.',
  town: 'The last of the Mafia is gone. The street sleeps easy.',
}

export function GameOver({ game }: { game: Game }) {
  const { store, dispatch } = useStore()
  const [confirmUndo, setConfirmUndo] = useState(false)
  const winner = game.phase.kind === 'over' ? game.phase.winner : 'town'

  return (
    <Screen
      ground="reveal"
      eyebrow={`Ended on the ${ordinal(game.dayNumber)} day`}
      footer={
        confirmUndo ? (
          <ConfirmRow
            question="Take back the last action and keep playing?"
            confirmLabel="Undo"
            tone="secondary"
            onCancel={() => setConfirmUndo(false)}
            onConfirm={() => dispatch({ type: 'UNDO' })}
          />
        ) : (
          <>
            <Action onClick={() => dispatch({ type: 'ARCHIVE_GAME', now: Date.now() })}>
              Save and finish
            </Action>
            {/* A mistyped lynch or a stray tap in Roll Call can end a game that
                was not over. Undo restores an exact earlier state, which is the
                only recovery from here with a well-defined answer. */}
            {canUndo(store) && (
              <QuietAction onClick={() => setConfirmUndo(true)}>
                Undo last action
              </QuietAction>
            )}
          </>
        )
      }
    >
      <div className="flex flex-col gap-4 pb-8">
        <h1 className={cn('display-xl', winner === 'mafia' && 'text-stamp')}>
          {HEADLINE[winner]}
        </h1>
        <p className="max-w-[32ch] text-sm leading-relaxed text-muted-foreground">
          {SUBHEAD[winner]} Everyone can look now.
        </p>
      </div>

      <div className="flex flex-col pb-4">
        <span className="eyebrow border-b border-border pb-3 text-muted-foreground">
          The table
        </span>
        {game.seats.map((seat) => {
          const role = ROLES[seat.roleId]
          return (
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
                  role.alignment === 'mafia' ? 'text-stamp' : 'text-muted-foreground',
                )}
              >
                {role.name}
              </span>
            </div>
          )
        })}
        <div className="flex items-baseline justify-between gap-4 py-3.5">
          <span className="truncate text-[0.9375rem] font-medium text-muted-foreground">
            {game.hostName}
          </span>
          <span className="eyebrow shrink-0 text-muted-foreground">Host</span>
        </div>
      </div>
    </Screen>
  )
}
