import { EMPTY_STORE, STORE_VERSION } from '@/domain/types'
import type { Store } from '@/domain/types'

const KEY = 'nightfall.store.v1'

/**
 * The whole store is written after every action. A game in progress cannot be
 * reconstructed if it is lost — the deal is unrepeatable — so persistence is
 * write-through rather than debounced.
 */
export function loadStore(): Store {
  try {
    const raw = localStorage.getItem(KEY)
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
