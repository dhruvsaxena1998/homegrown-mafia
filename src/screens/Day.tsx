import { useMemo, useState } from 'react'
import { Action, QuietAction, QuietSlot } from '@/components/Action'
import { Screen } from '@/components/Screen'
import { SeatRow } from '@/components/SeatRow'
import { AdjustSheet } from '@/components/AdjustSheet'
import { DayTimer } from '@/components/DayTimer'
import { aliveCounts, livingSeats, seatNumber } from '@/domain/engine'
import type { Game, Seat } from '@/domain/types'
import { useStore } from '@/hooks/useStore'
import { useHaptics } from '@/hooks/useHaptics'
import { ordinal } from '@/lib/format'

type Mode = 'argue' | 'vote' | 'tied' | 'confirm'

/**
 * Day is two beats: free argument, then a host-driven roll-call vote.
 * Ballots stay on the phone until someone actually hangs — ties wipe the slate
 * and the table votes again from scratch.
 */
export function Day({ game }: { game: Game }) {
  const { dispatch } = useStore()
  const haptics = useHaptics()
  const living = livingSeats(game)
  const { mafia } = aliveCounts(game)

  const [mode, setMode] = useState<Mode>('argue')
  /** One entry per living voter, in seat order, once they have cast. */
  const [ballots, setBallots] = useState<Record<string, string>>({})
  const [round, setRound] = useState(1)

  const voters = living
  const voterIndex = Object.keys(ballots).length
  const currentVoter = voters[voterIndex] ?? null
  const allIn = voterIndex >= voters.length && voters.length > 0

  const tallies = useMemo(() => countVotes(ballots), [ballots])
  const leaders = useMemo(() => leadingIds(tallies), [tallies])
  const soleLeader =
    allIn && leaders.length === 1
      ? living.find((s) => s.id === leaders[0]) ?? null
      : null

  const cast = (targetId: string) => {
    if (!currentVoter) return
    const next = { ...ballots, [currentVoter.id]: targetId }
    const nextCount = Object.keys(next).length
    setBallots(next)
    if (nextCount < voters.length) return

    const nextTallies = countVotes(next)
    const nextLeaders = leadingIds(nextTallies)
    if (nextLeaders.length === 1) {
      haptics.alert()
      setMode('confirm')
    } else {
      haptics.alert()
      setMode('tied')
    }
  }

  const undoBallot = () => {
    if (voterIndex === 0) return
    const prev = voters[voterIndex - 1]
    const next = { ...ballots }
    delete next[prev.id]
    setBallots(next)
    setMode('vote')
  }

  const restartVote = () => {
    setBallots({})
    setRound((r) => r + 1)
    setMode('vote')
  }

  const beginVote = () => {
    setBallots({})
    setRound(1)
    setMode('vote')
  }

  const eyebrow = `${ordinal(game.dayNumber)} day · ${living.length} alive`

  if (mode === 'vote' && currentVoter) {
    return (
      <Screen
        ground="day"
        eyebrow={eyebrow}
        aside={<AdjustSheet game={game} />}
        footer={
          <>
            <QuietSlot>
              {voterIndex > 0 ? (
                <QuietAction onClick={undoBallot}>Undo last ballot</QuietAction>
              ) : null}
            </QuietSlot>
            <QuietAction onClick={() => setMode('argue')}>Back to argument</QuietAction>
          </>
        }
      >
        <VoteHeader
          round={round}
          voter={currentVoter}
          voterNumber={seatNumber(game, currentVoter.id)}
          step={voterIndex + 1}
          total={voters.length}
        />
        <TallyStrip living={living} tallies={tallies} game={game} />
        <div className="flex flex-col gap-2 pb-4">
          <span className="eyebrow pb-1 text-muted-foreground">
            {currentVoter.name} votes for
          </span>
          {living.map((seat) => (
            <SeatRow
              key={seat.id}
              index={seatNumber(game, seat.id)}
              name={seat.name}
              tag={tallies[seat.id] ? String(tallies[seat.id]) : undefined}
              tagTone="plain"
              onClick={() => cast(seat.id)}
            />
          ))}
        </div>
      </Screen>
    )
  }

  if (mode === 'tied') {
    return (
      <Screen
        ground="day"
        eyebrow={eyebrow}
        aside={<AdjustSheet game={game} />}
        footer={
          <>
            <QuietAction onClick={() => dispatch({ type: 'LYNCH', seatId: null })}>
              No one hangs today
            </QuietAction>
            <Action onClick={restartVote}>Vote again</Action>
          </>
        }
      >
        <div className="flex flex-col gap-2 pb-6">
          <h1 className="display-lg">Tied</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            No single name led. Wipe the board and take the vote from the top.
          </p>
        </div>
        <TallyStrip living={living} tallies={tallies} game={game} highlight={leaders} />
        <div className="flex flex-col gap-2 pb-4">
          {living.map((seat) => (
            <SeatRow
              key={seat.id}
              index={seatNumber(game, seat.id)}
              name={seat.name}
              tag={tallies[seat.id] ? `${tallies[seat.id]} vote${tallies[seat.id] === 1 ? '' : 's'}` : '0'}
              tagTone={leaders.includes(seat.id) ? 'stamp' : 'muted'}
              selected={leaders.includes(seat.id)}
            />
          ))}
        </div>
      </Screen>
    )
  }

  if (mode === 'confirm' && soleLeader) {
    return (
      <Screen
        ground="day"
        eyebrow={eyebrow}
        aside={<AdjustSheet game={game} />}
        footer={
          <>
            <QuietAction onClick={() => dispatch({ type: 'LYNCH', seatId: null })}>
              No one hangs today
            </QuietAction>
            <QuietAction onClick={restartVote}>Revote</QuietAction>
            <Action
              marker="→"
              onClick={() => dispatch({ type: 'LYNCH', seatId: soleLeader.id })}
            >
              Vote out {soleLeader.name}
            </Action>
          </>
        }
      >
        <div className="flex flex-col gap-2 pb-6">
          <h1 className="display-lg">The table has spoken</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {soleLeader.name} led with {tallies[soleLeader.id]} of {voters.length}{' '}
            {voters.length === 1 ? 'vote' : 'votes'}. Confirm to eliminate them.
          </p>
        </div>
        <div className="flex flex-col gap-2 pb-4">
          {living.map((seat) => (
            <SeatRow
              key={seat.id}
              index={seatNumber(game, seat.id)}
              name={seat.name}
              tag={tallies[seat.id] ? `${tallies[seat.id]}` : '0'}
              tagTone={seat.id === soleLeader.id ? 'stamp' : 'muted'}
              selected={seat.id === soleLeader.id}
            />
          ))}
        </div>
      </Screen>
    )
  }

  return (
    <Screen
      ground="day"
      eyebrow={eyebrow}
      aside={<AdjustSheet game={game} />}
      footer={
        <>
          <QuietAction onClick={() => dispatch({ type: 'LYNCH', seatId: null })}>
            No one hangs today
          </QuietAction>
          <Action marker="→" onClick={beginVote}>
            Start the vote
          </Action>
        </>
      }
    >
      <div className="flex flex-col gap-2 pb-6">
        <h1 className="display-lg">Daybreak</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Let them argue. When the floor is ready, take the vote seat by seat.
        </p>
        <p className="eyebrow pt-2 text-muted-foreground">
          {mafia} mafia still among {living.length}
        </p>
      </div>

      {game.dayTimerSeconds > 0 && (
        <DayTimer seconds={game.dayTimerSeconds} onExpire={() => haptics.alert()} />
      )}

      <div className="flex flex-col gap-2 pb-4">
        {living.map((seat) => (
          <SeatRow
            key={seat.id}
            index={seatNumber(game, seat.id)}
            name={seat.name}
          />
        ))}
      </div>
    </Screen>
  )
}

function VoteHeader({
  round,
  voter,
  voterNumber,
  step,
  total,
}: {
  round: number
  voter: Seat
  voterNumber: number
  step: number
  total: number
}) {
  return (
    <div className="flex flex-col gap-2 pb-5">
      <p className="eyebrow text-muted-foreground">
        Vote{round > 1 ? ` · round ${round}` : ''} · {step} of {total}
      </p>
      <h1 className="display-lg">{voter.name}</h1>
      <p className="text-sm leading-relaxed text-muted-foreground">
        Seat {String(voterNumber).padStart(2, '0')}. Tap who they name.
      </p>
    </div>
  )
}

function TallyStrip({
  living,
  tallies,
  game,
  highlight = [],
}: {
  living: Seat[]
  tallies: Record<string, number>
  game: Game
  highlight?: string[]
}) {
  const named = living.filter((s) => (tallies[s.id] ?? 0) > 0)
  if (named.length === 0) return null

  return (
    <div className="mb-5 flex flex-wrap gap-2">
      {named
        .slice()
        .sort((a, b) => (tallies[b.id] ?? 0) - (tallies[a.id] ?? 0))
        .map((seat) => (
          <span
            key={seat.id}
            className={
              highlight.includes(seat.id)
                ? 'rounded-md border border-stamp/40 bg-card px-2.5 py-1 font-mono text-xs text-stamp-bright'
                : 'rounded-md border border-border bg-card/45 px-2.5 py-1 font-mono text-xs text-muted-foreground'
            }
          >
            {seatNumber(game, seat.id).toString().padStart(2, '0')} {seat.name} ·{' '}
            {tallies[seat.id]}
          </span>
        ))}
    </div>
  )
}

function countVotes(ballots: Record<string, string>): Record<string, number> {
  const out: Record<string, number> = {}
  for (const targetId of Object.values(ballots)) {
    out[targetId] = (out[targetId] ?? 0) + 1
  }
  return out
}

/** Seat ids sharing the highest tally. Empty when nobody has a vote yet. */
function leadingIds(tallies: Record<string, number>): string[] {
  const entries = Object.entries(tallies)
  if (entries.length === 0) return []
  const top = Math.max(...entries.map(([, n]) => n))
  if (top <= 0) return []
  return entries.filter(([, n]) => n === top).map(([id]) => id)
}
