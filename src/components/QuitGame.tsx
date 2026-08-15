import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useStore } from '@/hooks/useStore'
import { cn } from '@/lib/utils'

/**
 * Sits beside the rules in the frame so ending a game is never more than one
 * tap plus a confirmation, from wherever the night has got to.
 *
 * Always confirms, and says plainly what is lost: this drops the deal without
 * archiving it, and the deal cannot be recreated.
 */
export function QuitGame() {
  const { store, dispatch } = useStore()
  const [open, setOpen] = useState(false)

  // Nothing to quit outside a game — the header still renders on Home,
  // Setup and History.
  if (!store.game) return null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label="End this game"
          className={cn(
            'grid size-7 shrink-0 place-items-center rounded-full border border-border',
            'font-mono text-xs text-muted-foreground transition-colors active:bg-accent',
          )}
        >
          ✕
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-left">
          <DialogTitle className="display-lg text-2xl">End this game?</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            The cards are thrown in and this game is not kept in past games.
            Everyone will need a fresh deal.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <Button
            variant="destructive"
            className="h-12 w-full"
            onClick={() => {
              dispatch({ type: 'ABANDON_GAME' })
              setOpen(false)
            }}
          >
            End it — start a new game
          </Button>
          <Button
            variant="ghost"
            className="h-11 w-full text-muted-foreground"
            onClick={() => setOpen(false)}
          >
            Keep playing
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
