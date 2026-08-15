import { ROLES } from './roles'
import type { FinishedGame } from './types'

/** `stamp` is reserved for blood — deaths and the winning side. */
export type LineTone = 'plain' | 'stamp' | 'muted'

export type RecapLine = { key: string; text: string; tone: LineTone }
export type RecapSection = { key: string; title: string; lines: RecapLine[] }

/**
 * Replays the event log into the round-by-round account the host never gets to
 * give. Everything here was already recorded during play; nothing is inferred.
 *
 * Safe to show in full because a game only reaches history once it is over —
 * the Detective's reads and the Doctor's saves are no longer live information.
 */
export function recapOf(game: FinishedGame): RecapSection[] {
  const seatOf = (id: string) => game.seats.find((s) => s.id === id)
  const nameOf = (id: string) => seatOf(id)?.name ?? 'Someone'

  /** Deaths name the role, since the whole table can see the cards by now. */
  const withRole = (id: string) => {
    const seat = seatOf(id)
    return seat ? `${seat.name} (${ROLES[seat.roleId].name})` : nameOf(id)
  }

  const sections: RecapSection[] = []
  let current: RecapSection | null = null

  // Dawn has no event of its own, so the day section opens lazily: the night's
  // outcome arms it, and whatever is logged next — a lynch, or a host
  // correction made mid-argument — lands under Day rather than Night.
  let dawnOf: number | null = null

  const open = (key: string, title: string) => {
    dawnOf = null
    current = { key, title, lines: [] }
    sections.push(current)
  }

  const openDay = (day: number) => {
    if (current?.key !== `d${day}`) open(`d${day}`, `Day ${day}`)
  }

  const push = (text: string, tone: LineTone = 'plain') => {
    if (dawnOf !== null) openDay(dawnOf)
    if (!current) open('deal', 'The deal')
    current!.lines.push({ key: `${current!.key}-${current!.lines.length}`, text, tone })
  }

  for (const entry of game.log) {
    switch (entry.t) {
      case 'dealt':
        open('deal', 'The deal')
        push(`${game.seats.length} cards dealt.`, 'muted')
        break

      case 'nightFell':
        open(`n${entry.day}`, `Night ${entry.day}`)
        break

      case 'mafiaChose':
        push(
          entry.seatId
            ? `Mafia chose ${nameOf(entry.seatId)}.`
            : 'Mafia chose no one.',
          entry.seatId ? 'plain' : 'muted',
        )
        break

      case 'detectiveChecked':
        push(
          `Detective checked ${nameOf(entry.seatId)} — ${
            entry.result === 'mafia' ? 'Mafia' : 'not Mafia'
          }.`,
        )
        break

      case 'doctorSaved':
        push(
          entry.seatId
            ? `Doctor shielded ${nameOf(entry.seatId)}.`
            : 'Doctor shielded no one.',
          entry.seatId ? 'plain' : 'muted',
        )
        break

      case 'survived':
        push(`${nameOf(entry.seatId)} was attacked and lived.`)
        dawnOf = entry.day
        break

      case 'noDeath':
        push('Nobody died.', 'muted')
        dawnOf = entry.day
        break

      case 'died':
        if (entry.cause === 'lynch') openDay(entry.day)
        push(
          entry.cause === 'mafia'
            ? `${withRole(entry.seatId)} was killed.`
            : entry.cause === 'lynch'
              ? `${withRole(entry.seatId)} was voted out.`
              : `${withRole(entry.seatId)} was removed by the host.`,
          'stamp',
        )
        // A Mafia kill is the last thing that happens before dawn; a lynch or a
        // host correction is not.
        if (entry.cause === 'mafia') dawnOf = entry.day
        break

      case 'noLynch':
        openDay(entry.day)
        push('The town voted nobody out.', 'muted')
        break

      case 'revived':
        push(`${nameOf(entry.seatId)} was brought back by the host.`, 'muted')
        break

      case 'reshown':
        push(`${nameOf(entry.seatId)} read their card again.`, 'muted')
        break

      case 'ended':
        open('end', 'The end')
        push(entry.winner === 'mafia' ? 'Mafia win.' : 'Town wins.', 'stamp')
        break
    }
  }

  return sections.filter((s) => s.lines.length > 0)
}
