import { useEffect, useRef, useState } from 'react'

/**
 * A wall-clock countdown for the day's argument. Driven by absolute time rather
 * than decrementing each tick, so it stays honest through background throttling
 * and is unaffected by the host pausing to let the room breathe.
 */
export function useCountdown(
  total: number,
  onExpire?: () => void,
  options?: { autoStartAfterMs?: number },
) {
  const autoStartAfterMs = options?.autoStartAfterMs ?? 0
  const [remaining, setRemaining] = useState(total)
  const [running, setRunning] = useState(false)
  const endRef = useRef(0)
  const intervalRef = useRef<number | null>(null)
  const expiredRef = useRef(false)
  const remainingRef = useRef(total)
  const onExpireRef = useRef(onExpire)
  onExpireRef.current = onExpire
  remainingRef.current = remaining

  const stopLoop = () => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  const update = () => {
    const left = Math.max(0, Math.round((endRef.current - Date.now()) / 1000))
    remainingRef.current = left
    setRemaining(left)
    if (left <= 0) {
      stopLoop()
      setRunning(false)
      if (!expiredRef.current) {
        expiredRef.current = true
        onExpireRef.current?.()
      }
    }
  }

  const start = () => {
    if (remainingRef.current <= 0) return
    expiredRef.current = false
    endRef.current = Date.now() + remainingRef.current * 1000
    setRunning(true)
    stopLoop()
    intervalRef.current = window.setInterval(update, 250)
  }

  const pause = () => {
    if (!running) return
    const left = Math.max(0, Math.round((endRef.current - Date.now()) / 1000))
    remainingRef.current = left
    setRemaining(left)
    setRunning(false)
    stopLoop()
  }

  const reset = () => {
    stopLoop()
    setRunning(false)
    expiredRef.current = false
    remainingRef.current = total
    setRemaining(total)
  }

  useEffect(() => stopLoop, [])

  useEffect(() => {
    if (autoStartAfterMs <= 0) return
    const id = window.setTimeout(() => start(), autoStartAfterMs)
    return () => clearTimeout(id)
    // Arm once for this countdown instance (one day argument).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStartAfterMs])

  return { remaining, running, start, pause, reset, expired: remaining <= 0 }
}
