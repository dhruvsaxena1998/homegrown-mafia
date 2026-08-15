import { useCallback, useEffect, useRef, useState } from 'react'

/** Enough to read as an animation, not enough to feel like a wait. */
export const DEAL_HOLD_MS = 300

/** Deliberate friction, used only where a re-read needs to be conspicuous. */
export const SLOW_HOLD_MS = 3000

type Hold = {
  /** 0 to 1 across the hold. Drives the develop animation, not just a timer. */
  progress: number
  holding: boolean
  revealed: boolean
  handlers: {
    onPointerDown: (e: React.PointerEvent) => void
    onPointerUp: () => void
    onPointerCancel: () => void
    onPointerLeave: () => void
    onContextMenu: (e: React.MouseEvent) => void
  }
}

/**
 * Press and hold to bring a role card up out of the dark; releasing sinks it
 * back instantly. Progress is driven frame by frame so the card develops
 * continuously rather than cross-fading between two states.
 */
export function useHoldToReveal(enabled = true, holdMs = DEAL_HOLD_MS): Hold {
  const [progress, setProgress] = useState(0)
  const [holding, setHolding] = useState(false)
  const frame = useRef<number | null>(null)
  const startedAt = useRef(0)

  const stop = useCallback(() => {
    if (frame.current !== null) cancelAnimationFrame(frame.current)
    frame.current = null
    setHolding(false)
    setProgress(0)
  }, [])

  const tick = useCallback(() => {
    const elapsed = performance.now() - startedAt.current
    const next = Math.min(1, elapsed / holdMs)
    setProgress(next)
    if (next < 1) frame.current = requestAnimationFrame(tick)
  }, [holdMs])

  const start = useCallback(
    (e: React.PointerEvent) => {
      if (!enabled) return
      e.preventDefault()
      setHolding(true)
      if (holdMs <= 0) {
        setProgress(1)
        return
      }
      startedAt.current = performance.now()
      frame.current = requestAnimationFrame(tick)
    },
    [enabled, holdMs, tick],
  )

  useEffect(() => () => stop(), [stop])

  return {
    progress,
    holding,
    revealed: progress >= 1,
    handlers: {
      onPointerDown: start,
      onPointerUp: stop,
      onPointerCancel: stop,
      onPointerLeave: stop,
      onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
    },
  }
}
