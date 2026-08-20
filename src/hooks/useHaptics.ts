import { useSyncExternalStore } from 'react'
import { WebHaptics } from 'web-haptics'
import type { HapticInput } from 'web-haptics'

/**
 * Wrapper over WebHaptics. On Android it drives the Vibration API; on iOS —
 * which has no Vibration API — the library appends a hidden native switch and
 * toggles it, so the beat lands there too instead of silently doing nothing.
 *
 * A single shared instance: the library appends that hidden switch element the
 * first time it fires on an unsupported device, and one is all the page needs.
 * `debug` (audio clicks) and `showSwitch` (a visible toggle) stay off — this is
 * a social deduction game played in the dark, and audible/visual cues would
 * leak information to the room.
 */
let instance: WebHaptics | null = null

function engine(): WebHaptics | null {
  if (typeof window === 'undefined') return null
  if (!instance) instance = new WebHaptics()
  return instance
}

function fire(pattern: HapticInput): void {
  void engine()?.trigger(pattern)
}

// ---------------------------------------------------------------- debug audio

/**
 * `debug` plays an audible click for every beat instead of a silent no-op on
 * devices without a vibration motor — a way to hear the haptics on a desktop.
 * It is a testing aid, so it lives behind a header toggle, off by default.
 */
let debugEnabled = false
const debugListeners = new Set<() => void>()

export function setHapticsDebug(next: boolean): void {
  if (debugEnabled === next) return
  debugEnabled = next
  engine()?.setDebug(next)
  for (const listener of debugListeners) listener()
}

function subscribeDebug(listener: () => void): () => void {
  debugListeners.add(listener)
  return () => debugListeners.delete(listener)
}

export function useHapticsDebug() {
  const debug = useSyncExternalStore(subscribeDebug, () => debugEnabled)
  return { debug, setDebug: setHapticsDebug, toggle: () => setHapticsDebug(!debug) }
}

/**
 * Stable references — these never change identity between renders, so they are
 * safe in effect dependency arrays.
 */
export function useHaptics() {
  return {
    /** A role card blooms into view out of the dark. */
    reveal: () => fire([15, 25, 15]),
    /** Someone is named dead at dawn or on the gallows. */
    death: () => fire([90]),
    /** The game ends and the winning side is read out. */
    win: () => fire([40, 30, 40, 30, 140]),
    /** A soft beat — the argument timer running out. */
    alert: () => fire([0, 60, 40, 60]),
    vibrate: fire,
  }
}
