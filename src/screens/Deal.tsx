import { useEffect, useState } from 'react'
import { Screen } from '@/components/Screen'
import { Action, QuietAction, QuietSlot } from '@/components/Action'
import { ConfirmRow } from '@/components/ConfirmRow'
import { RoleCard } from '@/components/RoleCard'
import { useHoldToReveal } from '@/hooks/useHoldToReveal'
import { alliesFor, canUndo } from '@/domain/engine'
import type { Game } from '@/domain/types'
import { useStore } from '@/hooks/useStore'
import { useHaptics } from '@/hooks/useHaptics'
import { cn } from '@/lib/utils'

export function Deal({ game }: { game: Game }) {
  const { store, dispatch } = useStore()
  const haptics = useHaptics()
  const index = game.phase.kind === 'deal' ? game.phase.index : 0
  const seat = game.seats[index]

  const [everRevealed, setEverRevealed] = useState(false)
  const [confirmBack, setConfirmBack] = useState(false)
  const hold = useHoldToReveal(true, undefined, () => haptics.reveal())

  useEffect(() => {
    setEverRevealed(false)
    setConfirmBack(false)
  }, [index])
  useEffect(() => {
    if (hold.revealed) setEverRevealed(true)
  }, [hold.revealed])

  if (!seat) return null

  const allies = alliesFor(game, seat).map((s) => s.name)

  return (
    <Screen
      ground="night"
      eyebrow={`Card ${index + 1} of ${game.seats.length}`}
      footer={
        confirmBack ? (
          // Named, and confirmed, on purpose: stepping back re-opens someone
          // else's card, so it should be a deliberate move the table can see.
          <ConfirmRow
            question={`Go back to ${game.seats[index - 1]?.name}'s card?`}
            confirmLabel="Go back"
            tone="secondary"
            onCancel={() => setConfirmBack(false)}
            onConfirm={() => dispatch({ type: 'UNDO' })}
          />
        ) : (
          <>
            <QuietSlot>
              {index > 0 && canUndo(store) ? (
                <QuietAction onClick={() => setConfirmBack(true)}>
                  Back a card
                </QuietAction>
              ) : null}
            </QuietSlot>
            <Action
              variant={everRevealed ? 'solid' : 'quiet'}
              disabled={!everRevealed}
              marker={everRevealed ? '→' : null}
              onClick={() => dispatch({ type: 'DEAL_NEXT' })}
            >
              {everRevealed ? 'Done — pass on' : 'Read your card first'}
            </Action>
          </>
        )
      }
      className="justify-center"
    >
      <div className="flex flex-col gap-3 pb-7">
        <span className="eyebrow text-muted-foreground">Pass the phone to</span>
        <h1 className="display-lg">{seat.name}</h1>
      </div>

      {/* The card is its own button: hold it to read, let go and it goes dark. */}
      <button
        type="button"
        {...hold.handlers}
        aria-label={`Hold to display ${seat.name}'s card`}
        style={{ touchAction: 'none' }}
        className={cn(
          'relative block w-full rounded-xl border transition-colors duration-200',
          hold.revealed ? 'border-transparent' : 'border-dashed border-border',
        )}
      >
        <RoleCard roleId={seat.roleId} allyNames={allies} progress={hold.progress} />
        <span
          className={cn(
            'eyebrow absolute inset-0 grid place-items-center text-muted-foreground',
            'transition-opacity duration-150',
            hold.holding && 'opacity-0',
          )}
        >
          Hold to display your card
        </span>
      </button>

      <p className="pt-5 pb-4 text-center text-xs leading-relaxed text-muted-foreground">
        {everRevealed
          ? 'Hold it again if you need another look.'
          : 'Nobody else should be looking at this screen.'}
      </p>
    </Screen>
  )
}
