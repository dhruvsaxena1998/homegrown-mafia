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
 * The whole store is written after every action. A game in progress cannot be
 * reconstructed if it is lost — the deal is unrepeatable — so persistence is
 * write-through rather than debounced.
 */
export function loadStore(): Store {
  try {
    const raw = readRaw()
    if (!raw) return EMPTY_STORE
    const parsed = JSON.parse(raw) as Store
    if (parsed.version !== STORE_VERSION) return EMPTY_STORE
    return { ...EMPTY_STORE, ...parsed }
  } catch {
    return EMPTY_STORE
  }
}

export function saveStore(store: Store): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(store))
  } catch {
    // Storage full or blocked (private mode). The game continues in memory.
  }
}
