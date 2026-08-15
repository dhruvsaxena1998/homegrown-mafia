import { createContext, useContext, useEffect, useReducer, useState } from 'react'
import type { ReactNode } from 'react'
import { reduce } from '@/domain/engine'
import type { Action } from '@/domain/engine'
import type { Store } from '@/domain/types'
import { loadStore, saveStore } from '@/storage/persist'

type Ctx = {
  store: Store
  dispatch: (action: Action) => void
  /** True once a write has failed. Surfaced by Screen so the host can react
   *  before closing the app on an unrepeatable deal. */
  saveFailed: boolean
}

const StoreContext = createContext<Ctx | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [store, dispatch] = useReducer(reduce, undefined, loadStore)
  const [saveFailed, setSaveFailed] = useState(false)

  useEffect(() => {
    setSaveFailed(!saveStore(store))
  }, [store])

  return <StoreContext value={{ store, dispatch, saveFailed }}>{children}</StoreContext>
}

export function useStore(): Ctx {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside StoreProvider')
  return ctx
}
