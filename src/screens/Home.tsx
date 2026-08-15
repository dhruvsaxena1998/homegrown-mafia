import { Action, QuietAction } from '@/components/Action'
import { Screen } from '@/components/Screen'
import { useStore } from '@/hooks/useStore'

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
          <Action onClick={onNewGame}>New game</Action>
          <QuietAction
            disabled={store.history.length === 0}
            onClick={onHistory}
          >
            {store.history.length > 0
              ? `Past games · ${store.history.length}`
              : 'No games played yet'}
          </QuietAction>
        </>
      }
    >
      <div className="flex flex-col gap-6 pb-20">
        <h1 className="display-xl leading-[0.82]">
          Night
          <br />
          fall
        </h1>
        <div className="h-px w-16 bg-stamp" />
        <p className="max-w-[26ch] text-[0.9375rem] leading-relaxed text-muted-foreground">
          One phone, one host, and everyone else in the dark. Deal the cards, run
          the night, and let the table argue.
        </p>
      </div>
    </Screen>
  )
}
