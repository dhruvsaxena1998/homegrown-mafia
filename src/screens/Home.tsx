import { Action, QuietAction } from '@/components/Action'
import { Screen } from '@/components/Screen'
import { useStore } from '@/hooks/useStore'
import { APP_VERSION } from '@/lib/version'

export function Home({
  onNewGame,
  onHistory,
}: {
  onNewGame: () => void
  onHistory: () => void
}) {
  const { store } = useStore()

  return (
    <Screen
      ground="night"
      eyebrow="Pass and play · works offline"
      className="justify-end"
      footer={
        <>
          <QuietAction
            disabled={store.history.length === 0}
            onClick={onHistory}
          >
            {store.history.length > 0
              ? `Past games · ${store.history.length}`
              : 'No games played yet'}
          </QuietAction>
          <Action onClick={onNewGame}>New game</Action>
        </>
      }
    >
      <div className="flex flex-col gap-6 pb-20">
        {/* The accent lands on the word it belongs to, so the wordmark carries
            the red rather than a separate rule underneath it. */}
        <h1 className="display-xl leading-[0.82]">
          Homegrown
          <br />
          <span className="text-stamp">Mafia</span>
        </h1>
        <p className="max-w-[26ch] text-[0.9375rem] leading-relaxed text-muted-foreground">
          One phone, one host, and everyone else in the dark. Deal the cards, run
          the night, and let the table argue.
        </p>
        <span className="eyebrow text-muted-foreground">v{APP_VERSION}</span>
      </div>
    </Screen>
  )
}
