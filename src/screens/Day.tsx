import { useState } from 'react'
import { Action, QuietAction } from '@/components/Action'
import { Screen } from '@/components/Screen'
import { SeatRow } from '@/components/SeatRow'
import { AdjustSheet } from '@/components/AdjustSheet'
import { aliveCounts, livingSeats, seatNumber } from '@/domain/engine'
import type { Game } from '@/domain/types'
import { useStore } from '@/hooks/useStore'
import { ordinal } from '@/lib/format'

export function Day({ game }: { game: Game }) {
  const { dispatch } = useStore()
  const [selected, setSelected] = useState<string | null>(null)
  const living = livingSeats(game)
  const { mafia } = aliveCounts(game)

  return (
    <Screen
      ground="day"
      eyebrow={`${ordinal(game.dayNumber)} day · ${living.length} alive`}
      aside={<AdjustSheet game={game} />}
      footer={
        <>
          <Action
            disabled={!selected}
            marker={selected ? '\u2192' : null}
            onClick={() => selected && dispatch({ type: 'LYNCH', seatId: selected })}
          >
            {selected
              ? `Vote out ${living.find((s) => s.id === selected)?.name}`
              : 'Pick who the table voted out'}
          </Action>
          <QuietAction onClick={() => dispatch({ type: 'LYNCH', seatId: null })}>
            No one hangs today
          </QuietAction>
        </>
      }
    >
      <div className="flex flex-col gap-2 pb-6">
        <h1 className="display-lg">Daybreak</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Let them argue. Record the verdict when the table has settled on a name.
        </p>
        <p className="eyebrow pt-2 text-muted-foreground">
          {mafia} mafia still among {living.length}
        </p>
      </div>

      <div className="flex flex-col gap-2 pb-4">
        {living.map((seat) => (
          <SeatRow
            key={seat.id}
            index={seatNumber(game, seat.id)}
            name={seat.name}
            selected={seat.id === selected}
            tag={seat.id === selected ? 'Accused' : undefined}
            tagTone="stamp"
            onClick={() => setSelected(seat.id === selected ? null : seat.id)}
          />
        ))}
      </div>
    </Screen>
  )
}
