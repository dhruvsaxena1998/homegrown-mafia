import type { Alignment, RoleId } from './roles'

/** Someone in the saved roster. Persists across games. */
export type Person = {
  id: string
  name: string
}

/** A person dealt into the current game. Name is snapshotted so renaming
 *  or deleting the person later cannot corrupt a game in progress. */
export type Seat = {
  id: string // === Person.id
  name: string
  roleId: RoleId
  alive: boolean
}

export type DeathCause = 'mafia' | 'lynch' | 'host'

export type Phase =
  | { kind: 'deal'; index: number }
  | { kind: 'night'; step: number }
  | { kind: 'nightResult' }
  | { kind: 'day' }
  | { kind: 'dayResult' }
  | { kind: 'over'; winner: Alignment }

/** Targets collected during the current night, cleared each dusk. */
export type NightActions = {
  mafiaTarget: string | null
  detectiveQuery: string | null
  doctorSave: string | null
}

export const EMPTY_NIGHT: NightActions = {
  mafiaTarget: null,
  detectiveQuery: null,
  doctorSave: null,
}

export type LogEntry =
  | { t: 'dealt'; day: number }
  | { t: 'nightFell'; day: number }
  | { t: 'mafiaChose'; day: number; seatId: string | null }
  | { t: 'detectiveChecked'; day: number; seatId: string; result: Alignment }
  | { t: 'doctorSaved'; day: number; seatId: string | null }
  | { t: 'died'; day: number; seatId: string; cause: DeathCause }
  | { t: 'survived'; day: number; seatId: string }
  | { t: 'noDeath'; day: number }
  | { t: 'noLynch'; day: number }
  | { t: 'revived'; day: number; seatId: string }
  | { t: 'reshown'; day: number; seatId: string }
  | { t: 'ended'; day: number; winner: Alignment }

export type Game = {
  id: string
  startedAt: number
  hostId: string
  hostName: string
  revealRoleOnDeath: boolean
  seats: Seat[]
  /** 1-based. Night 1 is the opening phase. */
  dayNumber: number
  phase: Phase
  night: NightActions
  /** Result of the last night, held for the nightResult screen. */
  lastNightVictim: string | null
  lastNightSaved: string | null
  /** Result of the last day, held for the dayResult screen. */
  lastLynched: string | null
  doctorSelfSaveUsed: boolean
  log: LogEntry[]
}

export type FinishedGame = {
  id: string
  startedAt: number
  endedAt: number
  hostName: string
  winner: Alignment
  dayNumber: number
  seats: Seat[]
  log: LogEntry[]
}

export const STORE_VERSION = 1

export type Store = {
  version: number
  roster: Person[]
  game: Game | null
  /** Bounded undo stack for the host's Adjust panel. */
  past: Game[]
  history: FinishedGame[]
}

export const EMPTY_STORE: Store = {
  version: STORE_VERSION,
  roster: [],
  game: null,
  past: [],
  history: [],
}
