import { Vibrate } from 'lucide-react'
import { useHapticsDebug } from '@/hooks/useHaptics'
import { cn } from '@/lib/utils'

/**
 * A testing aid in the frame, next to rules and quit. Flipping it on plays an
 * audible click for every haptic beat, so the feedback can be heard on a
 * desktop that has no vibration motor. Off by default — in the dark, a sound
 * leaks information to the room.
 */
export function HapticsDebugToggle() {
  const { debug, toggle } = useHapticsDebug()

  return (
    <button
      type="button"
      aria-label={debug ? 'Turn haptic sound off' : 'Turn haptic sound on'}
      aria-pressed={debug}
      onClick={toggle}
      className={cn(
        'grid size-7 shrink-0 place-items-center rounded-full border border-border',
        'transition-colors active:bg-accent',
        debug ? 'text-stamp-bright' : 'text-muted-foreground',
      )}
    >
      <Vibrate className="size-3.5" aria-hidden />
    </button>
  )
}
