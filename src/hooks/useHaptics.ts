import { useCallback } from 'react'

function canVibrate(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function'
}

/**
 * Wrapper over `navigator.vibrate`, which is silently missing on iOS Safari and
 * some desktop browsers. Every call is a no-op there, so the game is unchanged.
 */
export function useHaptics() {
  const vibrate = useCallback((pattern: number | number[]) => {
    if (!canVibrate()) return
    try {
      navigator.vibrate(pattern)
    } catch {
      // Some engines throw rather than ignore; the beat is not worth a crash.
    }
  }, [])

  return {
    /** A role card blooms into view out of the dark. */
    reveal: useCallback(() => vibrate([15, 25, 15]), [vibrate]),
    /** Someone is named dead at dawn or on the gallows. */
    death: useCallback(() => vibrate([90]), [vibrate]),
    /** The game ends and the winning side is read out. */
    win: useCallback(() => vibrate([40, 30, 40, 30, 140]), [vibrate]),
    /** A soft beat — the argument timer running out. */
    alert: useCallback(() => vibrate([0, 60, 40, 60]), [vibrate]),
    vibrate,
  }
}
