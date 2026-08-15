import { Action } from '@/components/Action'
import { Screen } from '@/components/Screen'
import { AdjustSheet } from '@/components/AdjustSheet'
import { ROLES } from '@/domain/roles'
import { seatById } from '@/domain/engine'
import type { Game } from '@/domain/types'
import { useStore } from '@/hooks/useStore'
import { ordinal } from '@/lib/format'

/** Dawn. The night's outcome, read aloud by the host. */
export function NightResult({ game }: { game: Game }) {
  const { dispatch } = useStore()
  const victim = seatById(game, game.lastNightVictim)
  const saved = seatById(game, game.lastNightSaved)

  return (
    <Screen
      ground="day"
      eyebrow={`${ordinal(game.dayNumber)} dawn`}
      aside={<AdjustSheet game={game} />}
      className="justify-center"
      footer={
        <Action onClick={() => dispatch({ type: 'NIGHT_ACK' })}>
          Open the floor
        </Action>
      }
    >
      <div className="flex flex-col gap-5 pb-14">
        {victim ? (
          <>
            <span className="eyebrow text-muted-foreground">The town wakes to find</span>
            <h1 className="display-xl text-stamp-bright">{victim.name}</h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Killed in the night.
              {game.revealRoleOnDeath && ` They were the ${ROLES[victim.roleId].name}.`}
            </p>
          </>
        ) : (
          <>
            <span className="eyebrow text-muted-foreground">The town wakes</span>
            <h1 className="display-xl">Nobody died</h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {saved
                ? `Read this aloud as written. Only you know the Doctor reached ${saved.name} in time.`
                : 'Read this aloud as written.'}
            </p>
          </>
        )}
      </div>
    </Screen>
  )
}

/** The table has voted. */
export function DayResult({ game }: { game: Game }) {
  const { dispatch } = useStore()
  const lynched = seatById(game, game.lastLynched)

  return (
    <Screen
      ground="day"
      eyebrow={`${ordinal(game.dayNumber)} day · verdict`}
      aside={<AdjustSheet game={game} />}
      className="justify-center"
      footer={
        <Action onClick={() => dispatch({ type: 'DAY_ACK' })}>
          Night falls
        </Action>
      }
    >
      <div className="flex flex-col gap-5 pb-14">
        {lynched ? (
          <>
            <span className="eyebrow text-muted-foreground">The town votes out</span>
            <h1 className="display-xl text-stamp-bright">{lynched.name}</h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {game.revealRoleOnDeath
                ? `They were the ${ROLES[lynched.roleId].name}.`
                : 'Their role stays buried.'}
            </p>
          </>
        ) : (
          <>
            <span className="eyebrow text-muted-foreground">The town votes</span>
            <h1 className="display-xl">No one hangs</h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              The table could not agree. Everyone lives to see the night.
            </p>
          </>
        )}
      </div>
    </Screen>
  )
}
