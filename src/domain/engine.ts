import { NIGHT_ORDER, ROLES } from './roles'
import type { Alignment, RoleDef, RoleId } from './roles'
import { distributionFor, isPlayableCount } from './distribution'
import { EMPTY_NIGHT, EMPTY_STORE, STORE_VERSION } from './types'
import type {
  DeathCause,
  FinishedGame,
  Game,
  LogEntry,
  Person,
  Seat,
  Store,
} from './types'

const UNDO_DEPTH = 30

/** `crypto.randomUUID` is secure-context only, so it is missing when the app is
 *  served over plain http on a LAN address. getRandomValues is always there. */
export function newId(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

const uid = newId

/** Fisher-Yates over crypto entropy. Card fairness is the whole point of the app. */
function shuffle<T>(input: T[]): T[] {
  const out = input.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = crypto.getRandomValues(new Uint32Array(1))[0] % (i + 1)
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

// ---------------------------------------------------------------- selectors

export function seatById(game: Game, id: string | null): Seat | undefined {
  return id ? game.seats.find((s) => s.id === id) : undefined
}

export function livingSeats(game: Game): Seat[] {
  return game.seats.filter((s) => s.alive)
}

/**
 * A seat's number in the deal, stable for the whole game. Filtered lists
 * renumber themselves otherwise, and the host calls people by number.
 */
export function seatNumber(game: Game, id: string): number {
  return game.seats.findIndex((s) => s.id === id) + 1
}

export function alignmentOf(seat: Seat): Alignment {
  return ROLES[seat.roleId].alignment
}

export function aliveCounts(game: Game): { mafia: number; town: number } {
  const alive = livingSeats(game)
  const mafia = alive.filter((s) => alignmentOf(s) === 'mafia').length
  return { mafia, town: alive.length - mafia }
}

export function checkWin(game: Game): Alignment | null {
  const { mafia, town } = aliveCounts(game)
  if (mafia === 0) return 'town'
  if (mafia >= town) return 'mafia'
  return null
}

/** Roles that still have a living holder, in wake order. */
export function activeNightRoles(game: Game): RoleDef[] {
  const alive = livingSeats(game)
  return NIGHT_ORDER.filter((role) => alive.some((s) => s.roleId === role.id))
}

export function currentNightRole(game: Game): RoleDef | null {
  if (game.phase.kind !== 'night') return null
  return activeNightRoles(game)[game.phase.step] ?? null
}

export function seatsWithRole(game: Game, roleId: RoleId): Seat[] {
  return game.seats.filter((s) => s.roleId === roleId)
}

/** The living Doctor, if any. Used to gate the once-per-game self save. */
export function doctorSeat(game: Game): Seat | undefined {
  return livingSeats(game).find((s) => s.roleId === 'doctor')
}

/** Who a given role may point at this night. */
export function targetableSeats(game: Game, role: RoleDef): Seat[] {
  return livingSeats(game).filter((seat) => {
    const isOwnRole = seat.roleId === role.id
    if (role.id === 'doctor') {
      const isSelf = seat.id === doctorSeat(game)?.id
      return isSelf ? role.canTargetSelf && !game.doctorSelfSaveUsed : true
    }
    // Mafia cannot eat their own; the Detective learns nothing from themselves.
    return !isOwnRole
  })
}

export function targetFor(game: Game, roleId: RoleId): string | null {
  if (roleId === 'mafia') return game.night.mafiaTarget
  if (roleId === 'detective') return game.night.detectiveQuery
  if (roleId === 'doctor') return game.night.doctorSave
  return null
}

/** Allies named on a Mafia card at deal time. */
export function alliesFor(game: Game, seat: Seat): Seat[] {
  if (!ROLES[seat.roleId].knowsAllies) return []
  return game.seats.filter((s) => s.roleId === seat.roleId && s.id !== seat.id)
}

export function canUndo(store: Store): boolean {
  return store.past.length > 0
}

// ------------------------------------------------------------------ actions

export type Action =
  /** Caller supplies the id so it can select the new person straight away. */
  | { type: 'ADD_PERSON'; id: string; name: string }
  | { type: 'RENAME_PERSON'; id: string; name: string }
  | { type: 'REMOVE_PERSON'; id: string }
  /** Swaps with the neighbour above (-1) or below (+1). The roster's order is
   *  the order the host reads names in, so it is worth controlling. */
  | { type: 'MOVE_PERSON'; id: string; delta: -1 | 1 }
  | {
      type: 'START_GAME'
      personIds: string[]
      hostId: string
      revealRoleOnDeath: boolean
      now: number
    }
  | { type: 'DEAL_NEXT' }
  | { type: 'RESHOW'; seatId: string }
  | { type: 'SET_TARGET'; roleId: RoleId; seatId: string | null }
  | { type: 'NIGHT_NEXT' }
  | { type: 'NIGHT_ACK' }
  | { type: 'LYNCH'; seatId: string | null }
  | { type: 'DAY_ACK' }
  | { type: 'ADJUST_KILL'; seatId: string }
  | { type: 'ADJUST_REVIVE'; seatId: string }
  | { type: 'UNDO' }
  | { type: 'ARCHIVE_GAME'; now: number }
  | { type: 'ABANDON_GAME' }
  | { type: 'CLEAR_HISTORY' }

/** Applies a game mutation and pushes the prior state onto the undo stack. */
function mutate(store: Store, fn: (game: Game) => Game): Store {
  if (!store.game) return store
  const next = fn(structuredClone(store.game))
  return {
    ...store,
    game: next,
    past: [store.game, ...store.past].slice(0, UNDO_DEPTH),
  }
}

function log(game: Game, entry: LogEntry): void {
  game.log.push(entry)
}

function kill(game: Game, seatId: string, cause: DeathCause): void {
  const seat = game.seats.find((s) => s.id === seatId)
  if (!seat || !seat.alive) return
  seat.alive = false
  log(game, { t: 'died', day: game.dayNumber, seatId, cause })
}

/** Dusk: clear the night's targets and wake the first living night role. */
function beginNight(game: Game): void {
  game.phase = { kind: 'night', step: 0 }
  game.night = { ...EMPTY_NIGHT }
  game.lastNightVictim = null
  game.lastNightSaved = null
  log(game, { t: 'nightFell', day: game.dayNumber })
}

function resolveNight(game: Game): void {
  const { mafiaTarget, detectiveQuery, doctorSave } = game.night

  log(game, { t: 'mafiaChose', day: game.dayNumber, seatId: mafiaTarget })
  if (detectiveQuery) {
    const target = seatById(game, detectiveQuery)
    if (target) {
      log(game, {
        t: 'detectiveChecked',
        day: game.dayNumber,
        seatId: detectiveQuery,
        result: alignmentOf(target),
      })
    }
  }
  log(game, { t: 'doctorSaved', day: game.dayNumber, seatId: doctorSave })

  if (doctorSave && doctorSave === doctorSeat(game)?.id) {
    game.doctorSelfSaveUsed = true
  }

  if (mafiaTarget && doctorSave === mafiaTarget) {
    game.lastNightVictim = null
    game.lastNightSaved = mafiaTarget
    log(game, { t: 'survived', day: game.dayNumber, seatId: mafiaTarget })
  } else if (mafiaTarget) {
    game.lastNightVictim = mafiaTarget
    game.lastNightSaved = null
    kill(game, mafiaTarget, 'mafia')
  } else {
    game.lastNightVictim = null
    game.lastNightSaved = null
    log(game, { t: 'noDeath', day: game.dayNumber })
  }

  game.phase = { kind: 'nightResult' }
}

/** Every elimination funnels through here so a win can never be missed. */
function settleOrContinue(game: Game, onContinue: () => void): void {
  const winner = checkWin(game)
  if (winner) {
    game.phase = { kind: 'over', winner }
    log(game, { t: 'ended', day: game.dayNumber, winner })
  } else {
    onContinue()
  }
}

function dealSeats(people: Person[]): Seat[] {
  const cards = distributionFor(people.length).flatMap(({ roleId, count }) =>
    Array.from({ length: count }, () => roleId),
  )
  const shuffled = shuffle(cards)
  return people.map((person, i) => ({
    id: person.id,
    name: person.name,
    roleId: shuffled[i],
    alive: true,
  }))
}

export function reduce(store: Store, action: Action): Store {
  switch (action.type) {
    case 'ADD_PERSON': {
      const name = action.name.trim()
      if (!name) return store
      return { ...store, roster: [...store.roster, { id: action.id, name }] }
    }

    case 'RENAME_PERSON': {
      const name = action.name.trim()
      if (!name) return store
      return {
        ...store,
        roster: store.roster.map((p) => (p.id === action.id ? { ...p, name } : p)),
      }
    }

    case 'REMOVE_PERSON':
      return { ...store, roster: store.roster.filter((p) => p.id !== action.id) }

    case 'MOVE_PERSON': {
      const from = store.roster.findIndex((p) => p.id === action.id)
      const to = from + action.delta
      if (from < 0 || to < 0 || to >= store.roster.length) return store
      const roster = store.roster.slice()
      ;[roster[from], roster[to]] = [roster[to], roster[from]]
      return { ...store, roster }
    }

    case 'START_GAME': {
      const playing = action.personIds
        .filter((id) => id !== action.hostId)
        .map((id) => store.roster.find((p) => p.id === id))
        .filter((p): p is Person => Boolean(p))
      const host = store.roster.find((p) => p.id === action.hostId)
      // The playable range is a rule, not a UI detail: below it the
      // distribution yields a negative Civilian count and deals a short deck.
      if (!host || !isPlayableCount(playing.length)) return store

      const game: Game = {
        id: uid(),
        startedAt: action.now,
        hostId: host.id,
        hostName: host.name,
        revealRoleOnDeath: action.revealRoleOnDeath,
        seats: dealSeats(playing),
        dayNumber: 1,
        phase: { kind: 'deal', index: 0 },
        night: { ...EMPTY_NIGHT },
        lastNightVictim: null,
        lastNightSaved: null,
        lastLynched: null,
        doctorSelfSaveUsed: false,
        log: [{ t: 'dealt', day: 1 }],
      }
      return { ...store, game, past: [] }
    }

    case 'DEAL_NEXT':
      return mutate(store, (game) => {
        if (game.phase.kind !== 'deal') return game
        const next = game.phase.index + 1
        if (next >= game.seats.length) beginNight(game)
        else game.phase = { kind: 'deal', index: next }
        return game
      })

    case 'RESHOW':
      return mutate(store, (game) => {
        log(game, { t: 'reshown', day: game.dayNumber, seatId: action.seatId })
        return game
      })

    case 'SET_TARGET':
      return mutate(store, (game) => {
        if (action.roleId === 'mafia') game.night.mafiaTarget = action.seatId
        if (action.roleId === 'detective') game.night.detectiveQuery = action.seatId
        if (action.roleId === 'doctor') game.night.doctorSave = action.seatId
        return game
      })

    case 'NIGHT_NEXT':
      return mutate(store, (game) => {
        if (game.phase.kind !== 'night') return game
        const next = game.phase.step + 1
        if (next >= activeNightRoles(game).length) resolveNight(game)
        else game.phase = { kind: 'night', step: next }
        return game
      })

    case 'NIGHT_ACK':
      return mutate(store, (game) => {
        settleOrContinue(game, () => {
          game.phase = { kind: 'day' }
        })
        return game
      })

    case 'LYNCH':
      return mutate(store, (game) => {
        game.lastLynched = action.seatId
        if (action.seatId) kill(game, action.seatId, 'lynch')
        else log(game, { t: 'noLynch', day: game.dayNumber })
        game.phase = { kind: 'dayResult' }
        return game
      })

    case 'DAY_ACK':
      return mutate(store, (game) => {
        settleOrContinue(game, () => {
          game.dayNumber += 1
          game.lastLynched = null
          beginNight(game)
        })
        return game
      })

    case 'ADJUST_KILL':
      return mutate(store, (game) => {
        kill(game, action.seatId, 'host')
        settleOrContinue(game, () => {})
        return game
      })

    case 'ADJUST_REVIVE':
      return mutate(store, (game) => {
        const seat = game.seats.find((s) => s.id === action.seatId)
        if (seat && !seat.alive) {
          seat.alive = true
          log(game, { t: 'revived', day: game.dayNumber, seatId: action.seatId })
        }
        return game
      })

    case 'UNDO': {
      const [prev, ...rest] = store.past
      if (!prev) return store
      return { ...store, game: prev, past: rest }
    }

    case 'ARCHIVE_GAME': {
      const game = store.game
      if (!game || game.phase.kind !== 'over') return store
      const finished: FinishedGame = {
        id: game.id,
        startedAt: game.startedAt,
        endedAt: action.now,
        hostName: game.hostName,
        winner: game.phase.winner,
        dayNumber: game.dayNumber,
        seats: game.seats,
        log: game.log,
      }
      return {
        ...store,
        game: null,
        past: [],
        history: [finished, ...store.history].slice(0, 50),
      }
    }

    case 'ABANDON_GAME':
      return { ...store, game: null, past: [] }

    case 'CLEAR_HISTORY':
      return { ...store, history: [] }

    default:
      return store
  }
}

export { EMPTY_STORE, STORE_VERSION }
