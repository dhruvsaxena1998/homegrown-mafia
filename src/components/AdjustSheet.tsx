import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { SeatRow } from '@/components/SeatRow'
import { ConfirmRow } from '@/components/ConfirmRow'
import { RoleCard } from '@/components/RoleCard'
import { HoldSeal } from '@/components/HoldSeal'
import { SLOW_HOLD_MS, useHoldToReveal } from '@/hooks/useHoldToReveal'
import { alliesFor, canUndo } from '@/domain/engine'
import type { Game, Seat } from '@/domain/types'
import { useStore } from '@/hooks/useStore'
import { useHaptics } from '@/hooks/useHaptics'

type View = 'menu' | 'pick' | 'card' | 'rollcall'

/**
 * The host's escape hatch. Real games miscount, reveal by accident, and drop
 * phones — and the deal cannot be repeated, so every mistake needs a way back.
 */
export function AdjustSheet({ game }: { game: Game }) {
  const { store, dispatch } = useStore()
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<View>('menu')
  const [pending, setPending] = useState<string | null>(null)
  const [showing, setShowing] = useState<Seat | null>(null)

  useEffect(() => {
    if (!open) {
      setView('menu')
      setPending(null)
      setShowing(null)
    }
  }, [open])

  const title =
    view === 'menu'
      ? 'Adjust'
      : view === 'pick'
        ? 'Show a card again'
        : view === 'rollcall'
          ? 'Roll call'
          : showing?.name

  const description =
    view === 'menu'
      ? 'Fix a miscount without abandoning the game.'
      : view === 'pick'
        ? 'Only do this if someone genuinely missed their card.'
        : view === 'rollcall'
          ? 'Kill or revive when the table and the phone disagree.'
          : 'Hand the phone over before they hold.'

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button type="button" className="eyebrow text-muted-foreground">
          Adjust
        </button>
      </DialogTrigger>

      <DialogContent className="flex max-h-[85dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-md">
        <DialogHeader className="px-6 pt-6 pb-4 text-left">
          <DialogTitle className="display-lg text-2xl">{title}</DialogTitle>
          <DialogDescription className="text-sm">{description}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {view === 'menu' && (
            <div className="flex flex-col gap-3">
              <Button
                variant="secondary"
                disabled={!canUndo(store)}
                className="h-14 w-full text-base"
                onClick={() => dispatch({ type: 'UNDO' })}
              >
                Undo last action
              </Button>

              <Button
                className="h-14 w-full text-base"
                onClick={() => setView('pick')}
              >
                Show someone their card again
              </Button>

              <Button
                variant="ghost"
                className="mt-3 h-11 w-full text-muted-foreground"
                onClick={() => setView('rollcall')}
              >
                Fix roll call
              </Button>
            </div>
          )}

          {view === 'pick' && (
            <div className="flex flex-col gap-2">
              {game.seats.map((seat, i) => (
                <SeatRow
                  key={seat.id}
                  index={i + 1}
                  name={seat.name}
                  dead={!seat.alive}
                  onClick={() => {
                    setShowing(seat)
                    setView('card')
                    dispatch({ type: 'RESHOW', seatId: seat.id })
                  }}
                />
              ))}
              <Button
                variant="ghost"
                className="mt-2 h-11 w-full text-muted-foreground"
                onClick={() => setView('menu')}
              >
                Back
              </Button>
            </div>
          )}

          {view === 'rollcall' && (
            <div className="flex flex-col gap-2">
              {game.seats.map((seat, i) =>
                pending === seat.id ? (
                  <ConfirmRow
                    key={seat.id}
                    question={
                      seat.alive ? `Kill ${seat.name}?` : `Bring ${seat.name} back?`
                    }
                    confirmLabel={seat.alive ? 'Kill' : 'Revive'}
                    tone={seat.alive ? 'destructive' : 'secondary'}
                    onCancel={() => setPending(null)}
                    onConfirm={() => {
                      dispatch(
                        seat.alive
                          ? { type: 'ADJUST_KILL', seatId: seat.id }
                          : { type: 'ADJUST_REVIVE', seatId: seat.id },
                      )
                      setPending(null)
                    }}
                  />
                ) : (
                  <SeatRow
                    key={seat.id}
                    index={i + 1}
                    name={seat.name}
                    dead={!seat.alive}
                    tag={seat.alive ? 'Alive' : 'Dead'}
                    tagTone={seat.alive ? 'muted' : 'stamp'}
                    onClick={() => setPending(seat.id)}
                  />
                ),
              )}
              <Button
                variant="ghost"
                className="mt-2 h-11 w-full text-muted-foreground"
                onClick={() => {
                  setPending(null)
                  setView('menu')
                }}
              >
                Back
              </Button>
            </div>
          )}

          {view === 'card' && showing && (
            <ReshowCard game={game} seat={showing} onDone={() => setView('menu')} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ReshowCard({
  game,
  seat,
  onDone,
}: {
  game: Game
  seat: Seat
  onDone: () => void
}) {
  const haptics = useHaptics()
  // Slow on purpose: a re-read is conspicuous, and everyone can see it taking.
  const hold = useHoldToReveal(true, SLOW_HOLD_MS, () => haptics.reveal())
  const allies = alliesFor(game, seat).map((s) => s.name)

  return (
    <div className="flex flex-col items-center gap-7">
      <RoleCard roleId={seat.roleId} allyNames={allies} progress={hold.progress} />
      <HoldSeal
        progress={hold.progress}
        holding={hold.holding}
        handlers={hold.handlers}
        label="Hold three seconds"
      />
      <Button variant="ghost" className="h-11 w-full text-muted-foreground" onClick={onDone}>
        Done
      </Button>
    </div>
  )
}
