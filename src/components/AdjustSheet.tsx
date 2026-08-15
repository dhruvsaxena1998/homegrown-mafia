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
import { RoleCard } from '@/components/RoleCard'
import { HoldSeal } from '@/components/HoldSeal'
import { SLOW_HOLD_MS, useHoldToReveal } from '@/hooks/useHoldToReveal'
import { alliesFor, canUndo } from '@/domain/engine'
import type { Game, Seat } from '@/domain/types'
import { useStore } from '@/hooks/useStore'

type View = 'menu' | 'pick' | 'card'

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
  const [confirmAbandon, setConfirmAbandon] = useState(false)

  useEffect(() => {
    if (!open) {
      setView('menu')
      setPending(null)
      setShowing(null)
      setConfirmAbandon(false)
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button type="button" className="eyebrow text-muted-foreground">
          Adjust
        </button>
      </DialogTrigger>

      <DialogContent className="flex max-h-[85dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-md">
        <DialogHeader className="px-6 pt-6 pb-4 text-left">
          <DialogTitle className="display-lg text-2xl">
            {view === 'menu' ? 'Adjust' : view === 'pick' ? 'Show a card again' : showing?.name}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {view === 'menu'
              ? 'Fix a miscount without abandoning the game.'
              : view === 'pick'
                ? 'Only do this if someone genuinely missed their card.'
                : 'Hand the phone over before they hold.'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {view === 'menu' && (
            <div className="flex flex-col gap-6">
              <Button
                variant="secondary"
                disabled={!canUndo(store)}
                className="h-12 w-full"
                onClick={() => dispatch({ type: 'UNDO' })}
              >
                Undo last action
              </Button>

              <section className="flex flex-col gap-2">
                <span className="eyebrow text-muted-foreground">Roll call</span>
                {game.seats.map((seat, i) =>
                  pending === seat.id ? (
                    <div
                      key={seat.id}
                      className="flex items-center gap-2 rounded-md border border-stamp/40 bg-card px-3 py-2.5"
                    >
                      <span className="flex-1 truncate text-sm">
                        {seat.alive ? `Kill ${seat.name}?` : `Bring ${seat.name} back?`}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setPending(null)}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        variant={seat.alive ? 'destructive' : 'secondary'}
                        onClick={() => {
                          dispatch(
                            seat.alive
                              ? { type: 'ADJUST_KILL', seatId: seat.id }
                              : { type: 'ADJUST_REVIVE', seatId: seat.id },
                          )
                          setPending(null)
                        }}
                      >
                        {seat.alive ? 'Kill' : 'Revive'}
                      </Button>
                    </div>
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
              </section>

              <div className="flex flex-col gap-2">
                <Button
                  variant="ghost"
                  className="h-12 w-full text-muted-foreground"
                  onClick={() => setView('pick')}
                >
                  Show someone their card again
                </Button>

                {confirmAbandon ? (
                  <div className="flex items-center gap-2 rounded-md border border-stamp/40 bg-card px-3 py-2.5">
                    <span className="flex-1 text-sm">Abandon and lose the deal?</span>
                    <Button size="sm" variant="ghost" onClick={() => setConfirmAbandon(false)}>
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => dispatch({ type: 'ABANDON_GAME' })}
                    >
                      Abandon
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    className="h-12 w-full text-stamp-bright"
                    onClick={() => setConfirmAbandon(true)}
                  >
                    Abandon this game
                  </Button>
                )}
              </div>
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
  // Slow on purpose: a re-read is conspicuous, and everyone can see it taking.
  const hold = useHoldToReveal(true, SLOW_HOLD_MS)
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
