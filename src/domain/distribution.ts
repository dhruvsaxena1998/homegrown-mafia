import type { RoleId } from './roles'

/** Playing count excludes the host, who sits out and narrates. */
export const MIN_PLAYING = 5
export const MAX_PLAYING = 20

/** Playing count including the host, who must be one of the selected people. */
export const MIN_SELECTED = MIN_PLAYING + 1
export const MAX_SELECTED = MAX_PLAYING + 1

type Band = { upTo: number; mafia: number }

/** Roughly one Mafia per three townsfolk. Data, not a formula, so it can be tuned. */
const MAFIA_BANDS: Band[] = [
  { upTo: 6, mafia: 1 },
  { upTo: 9, mafia: 2 },
  { upTo: 13, mafia: 3 },
  { upTo: 17, mafia: 4 },
  { upTo: 20, mafia: 5 },
]

/** The same bands, formatted for the rules sheet, so the two cannot drift. */
export function mafiaTable(): { range: string; mafia: number }[] {
  let from = MIN_PLAYING
  return MAFIA_BANDS.map((band) => {
    const range = from === band.upTo ? `${from}` : `${from}–${band.upTo}`
    from = band.upTo + 1
    return { range, mafia: band.mafia }
  })
}

export function mafiaCountFor(playing: number): number {
  const band = MAFIA_BANDS.find((b) => playing <= b.upTo)
  return band ? band.mafia : MAFIA_BANDS[MAFIA_BANDS.length - 1].mafia
}

export type Distribution = { roleId: RoleId; count: number }[]

/** The exact multiset of cards dealt at a given playing count. */
export function distributionFor(playing: number): Distribution {
  const mafia = mafiaCountFor(playing)
  const civilian = playing - mafia - 2 // one Detective, one Doctor at every size
  return [
    { roleId: 'mafia', count: mafia },
    { roleId: 'detective', count: 1 },
    { roleId: 'doctor', count: 1 },
    { roleId: 'civilian', count: civilian },
  ]
}

export function isPlayableCount(playing: number): boolean {
  return playing >= MIN_PLAYING && playing <= MAX_PLAYING
}
