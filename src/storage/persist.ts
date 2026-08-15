import { EMPTY_STORE, STORE_VERSION } from '@/domain/types'
import type { Store } from '@/domain/types'

const KEY = 'homegrown-mafia.store.v1'

/** Key used before the app was renamed. Read once, then folded into KEY. */
const LEGACY_KEY = 'nightfall.store.v1'

function readRaw(): string | null {
  const current = localStorage.getItem(KEY)
  if (current) return current

  // Carry a saved roster and past games across the rename rather than
  // silently starting someone from scratch.
  const legacy = localStorage.getItem(LEGACY_KEY)
  if (legacy) {
    localStorage.setItem(KEY, legacy)
    localStorage.removeItem(LEGACY_KEY)
    return legacy
  }
  return null
}

/**
 * A store written by a different version of the app.
 *
 * The roster and past games are flat records that survive almost any change,
 * so they are carried across. A game in progress depends on the exact shape of
 * every phase and log entry, so it is dropped rather than half-read — losing
 * tonight's deal is bad, but resuming into a corrupt one is worse.
 */
function migrate(parsed: Partial<Store>): Store {
  return {
    ...EMPTY_STORE,
    roster: Array.isArray(parsed.roster) ? parsed.roster : [],
    history: Array.isArray(parsed.history) ? parsed.history : [],
  }
}

/**
 * The whole store is written after every action. A game in progress cannot be
 * reconstructed if it is lost — the deal is unrepeatable — so persistence is
 * write-through rather than debounced.
 */
export function loadStore(): Store {
  try {
    const raw = readRaw()
    if (!raw) return EMPTY_STORE
    const parsed = JSON.parse(raw) as Store
    if (parsed.version !== STORE_VERSION) return migrate(parsed)
    return { ...EMPTY_STORE, ...parsed }
  } catch {
    return EMPTY_STORE
  }
}

/**
 * Returns false when the write did not land — storage full, or blocked in
 * private mode. The game continues in memory either way, but the host needs to
 * know the phone is now the only copy.
 */
export function saveStore(store: Store): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(store))
    return true
  } catch {
    return false
  }
}
