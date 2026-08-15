import { Action, QuietAction } from '@/components/Action'
import { Screen } from '@/components/Screen'
import { SeatRow } from '@/components/SeatRow'
import { AdjustSheet } from '@/components/AdjustSheet'
import {
  activeNightRoles,
  alignmentOf,
  currentNightRole,
  seatById,
  seatNumber,
  targetFor,
  targetableSeats,
} from '@/domain/engine'
import type { Game } from '@/domain/types'
import { useStore } from '@/hooks/useStore'
import { ordinal } from '@/lib/format'

export function Night({ game }: { game: Game }) {
  const { dispatch } = useStore()
  const role = currentNightRole(game)
  const step = game.phase.kind === 'night' ? game.phase.step : 0
  const total = activeNightRoles(game).length

  if (!role) return null

  const target = targetFor(game, role.id)
  const targetSeat = seatById(game, target)
  const options = targetableSeats(game, role)
  const eyebrow = `${ordinal(game.dayNumber)} night · ${step + 1} of ${total}`

  // The Detective's answer is the one piece of night information that has to
  // land unambiguously, so it takes the whole screen and the host signals it.
  const showVerdict = role.id === 'detective' && targetSeat

  return (
    <Screen
      ground="night"
      eyebrow={eyebrow}
      aside={<AdjustSheet game={game} />}
      footer={
        <>
          <Action onClick={() => dispatch({ type: 'NIGHT_NEXT' })}>
            {role.sleepPrompt}
          </Action>
          {target && (
            <QuietAction
              onClick={() => dispatch({ type: 'SET_TARGET', roleId: role.id, seatId: null })}
            >
              Clear choice
            </QuietAction>
          )}
        </>
      }
    >
      <div className="flex flex-col gap-2 pb-6">
        <h1 className="display-lg">{role.name}</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">{role.wakePrompt}</p>
      </div>

      {showVerdict ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 pb-10">
          <span className="eyebrow text-muted-foreground">{targetSeat.name} is</span>
          <p
            className={
              alignmentOf(targetSeat) === 'mafia'
                ? 'display-xl text-center text-stamp-bright'
                : 'display-xl text-center'
            }
          >
            {alignmentOf(targetSeat) === 'mafia' ? 'Mafia' : 'Not Mafia'}
          </p>
          <p className="max-w-[28ch] text-center text-sm leading-relaxed text-muted-foreground">
            {alignmentOf(targetSeat) === 'mafia'
              ? 'Give the Detective a thumbs up.'
              : 'Give the Detective a thumbs down.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2 pb-4">
          <span className="eyebrow pb-1 text-muted-foreground">{role.targetLabel}</span>
          {options.map((seat) => (
            <SeatRow
              key={seat.id}
              index={seatNumber(game, seat.id)}
              name={seat.name}
              selected={seat.id === target}
              tag={seat.id === target ? 'Chosen' : undefined}
              tagTone="plain"
              onClick={() =>
                dispatch({ type: 'SET_TARGET', roleId: role.id, seatId: seat.id })
              }
            />
          ))}
          {role.id === 'doctor' && game.doctorSelfSaveUsed && (
            <p className="eyebrow px-1 pt-2 text-muted-foreground">
              Self save already used
            </p>
          )}
        </div>
      )}
    </Screen>
  )
}
