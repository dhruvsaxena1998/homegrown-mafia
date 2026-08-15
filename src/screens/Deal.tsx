import { useEffect, useState } from 'react'
import { Screen } from '@/components/Screen'
import { Action } from '@/components/Action'
import { RoleCard } from '@/components/RoleCard'
import { useHoldToReveal } from '@/hooks/useHoldToReveal'
import { alliesFor } from '@/domain/engine'
import type { Game } from '@/domain/types'
import { useStore } from '@/hooks/useStore'
import { cn } from '@/lib/utils'

export function Deal({ game }: { game: Game }) {
  const { dispatch } = useStore()
  const index = game.phase.kind === 'deal' ? game.phase.index : 0
  const seat = game.seats[index]

  const [everRevealed, setEverRevealed] = useState(false)
  const hold = useHoldToReveal(true)

  useEffect(() => setEverRevealed(false), [index])
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
        <Action
          variant={everRevealed ? 'solid' : 'quiet'}
          disabled={!everRevealed}
          marker={everRevealed ? '→' : null}
          onClick={() => dispatch({ type: 'DEAL_NEXT' })}
        >
          {everRevealed ? 'Done — pass on' : 'Read your card first'}
        </Action>
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
