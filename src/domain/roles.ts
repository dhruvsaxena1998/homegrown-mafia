export type Alignment = 'mafia' | 'town'

export type RoleId = 'mafia' | 'detective' | 'doctor' | 'civilian'

/**
 * The seam Phase 2 roles slot into: a role is data, not a screen. The night
 * sequence iterates every role with `wakesAtNight` sorted by `wakeOrder`, so
 * adding a role means adding an entry here plus a count rule in distribution.ts.
 */
export type RoleDef = {
  id: RoleId
  name: string
  alignment: Alignment
  /** Shown on the dealt card. Second person, present tense. */
  cardText: string
  /** What this role actually does when the lights go out. */
  nightText: string
  /** How to play it once everyone is arguing. */
  dayText: string
  /** Card also names the other holders of this role (Mafia see their partners). */
  knowsAllies: boolean
  wakesAtNight: boolean
  /** Ascending. Only meaningful when wakesAtNight. */
  wakeOrder: number
  canTargetSelf: boolean
  /** Read aloud by the host when this role wakes. */
  wakePrompt: string
  /** Read aloud when this role goes back to sleep. */
  sleepPrompt: string
  /** Labels the target picker during this role's turn. */
  targetLabel: string
}

export const ROLES: Record<RoleId, RoleDef> = {
  mafia: {
    id: 'mafia',
    name: 'Mafia',
    alignment: 'mafia',
    cardText: 'You kill by night. By day, you are just another neighbour.',
    nightText: 'Wake with the other Mafia and agree on one person to kill.',
    dayText: 'Blend in. Vote with the crowd and never let the table settle on you.',
    knowsAllies: true,
    wakesAtNight: true,
    wakeOrder: 10,
    canTargetSelf: false,
    wakePrompt: 'Mafia, wake. Agree on who dies tonight.',
    sleepPrompt: 'Mafia, close your eyes.',
    targetLabel: 'Who did the Mafia choose?',
  },
  detective: {
    id: 'detective',
    name: 'Detective',
    alignment: 'town',
    cardText: 'Each night you may learn one player’s allegiance.',
    nightText: 'Point at one player. The host tells you whether they are Mafia.',
    dayText: 'You know what nobody else does. Say too much and you die tonight.',
    knowsAllies: false,
    wakesAtNight: true,
    wakeOrder: 20,
    canTargetSelf: false,
    wakePrompt: 'Detective, wake. Point to who you suspect.',
    sleepPrompt: 'Detective, close your eyes.',
    targetLabel: 'Who did the Detective point to?',
  },
  doctor: {
    id: 'doctor',
    name: 'Doctor',
    alignment: 'town',
    cardText: 'Each night you may shield one player from the Mafia.',
    nightText: 'Point at one player. If the Mafia chose them, they live. You may save yourself once.',
    dayText: 'Never say who you saved — it paints a target on both of you.',
    knowsAllies: false,
    wakesAtNight: true,
    wakeOrder: 30,
    canTargetSelf: true,
    wakePrompt: 'Doctor, wake. Point to who you save.',
    sleepPrompt: 'Doctor, close your eyes.',
    targetLabel: 'Who did the Doctor save?',
  },
  civilian: {
    id: 'civilian',
    name: 'Civilian',
    alignment: 'town',
    cardText: 'You have no power but your judgement. Use it well.',
    nightText: 'Nothing. Keep your eyes shut and listen.',
    dayText: 'Listen, argue, vote. Numbers are the only weapon you have.',
    knowsAllies: false,
    wakesAtNight: false,
    wakeOrder: 99,
    canTargetSelf: false,
    wakePrompt: '',
    sleepPrompt: '',
    targetLabel: '',
  },
}

export const ROLE_IDS = Object.keys(ROLES) as RoleId[]

/** Roles that take a night turn, in the order the host wakes them. */
export const NIGHT_ORDER: RoleDef[] = ROLE_IDS.map((id) => ROLES[id])
  .filter((r) => r.wakesAtNight)
  .sort((a, b) => a.wakeOrder - b.wakeOrder)
