import { useState } from 'react'
import { Home } from '@/screens/Home'
import { Setup } from '@/screens/Setup'
import { History } from '@/screens/History'
import { Deal } from '@/screens/Deal'
import { Night } from '@/screens/Night'
import { Day } from '@/screens/Day'
import { DayResult, NightResult } from '@/screens/Announce'
import { GameOver } from '@/screens/GameOver'
import { useStore } from '@/hooks/useStore'
import { useWakeLock } from '@/hooks/useWakeLock'
import type { Game } from '@/domain/types'

function GameRouter({ game }: { game: Game }) {
  switch (game.phase.kind) {
    case 'deal':
      return <Deal game={game} />
    case 'night':
      return <Night game={game} />
    case 'nightResult':
      return <NightResult game={game} />
    case 'day':
      return <Day game={game} />
    case 'dayResult':
      return <DayResult game={game} />
    case 'over':
      return <GameOver game={game} />
  }
}

export default function App() {
  const { store } = useStore()
  const [view, setView] = useState<'home' | 'setup' | 'history'>('home')

  useWakeLock(Boolean(store.game))

  // A game in progress always wins: reopening the app resumes exactly where
  // the host left off, because the deal cannot be recreated.
  if (store.game) return <GameRouter game={store.game} />

  if (view === 'setup') return <Setup onCancel={() => setView('home')} />
  if (view === 'history') return <History onBack={() => setView('home')} />

  return <Home onNewGame={() => setView('setup')} onHistory={() => setView('history')} />
}
