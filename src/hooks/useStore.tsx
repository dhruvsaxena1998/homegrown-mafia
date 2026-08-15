import { createContext, useContext, useEffect, useReducer } from 'react'
import type { ReactNode } from 'react'
import { reduce } from '@/domain/engine'
import type { Action } from '@/domain/engine'
import type { Store } from '@/domain/types'
import { loadStore, saveStore } from '@/storage/persist'

type Ctx = { store: Store; dispatch: (action: Action) => void }

const StoreContext = createContext<Ctx | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [store, dispatch] = useReducer(reduce, undefined, loadStore)

  useEffect(() => {
    saveStore(store)
  }, [store])

  return <StoreContext value={{ store, dispatch }}>{children}</StoreContext>
}

export function useStore(): Ctx {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside StoreProvider')
  return ctx
}
