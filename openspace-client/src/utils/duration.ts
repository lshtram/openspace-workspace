export interface TurnDurationBoundaries {
  startMs: number
  endMs: number
}

const MS_PER_SECOND = 1000
const SECONDS_PER_MINUTE = 60

function assertFiniteNonNegativeDuration(value: number): asserts value is number {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error("durationMs must be a finite, non-negative number")
  }
}

export function formatDurationLabel(durationMs: number): string {
  assertFiniteNonNegativeDuration(durationMs)

  if (durationMs < MS_PER_SECOND) return "< 1s"

  const totalSeconds = Math.floor(durationMs / MS_PER_SECOND)
  if (totalSeconds < SECONDS_PER_MINUTE) return `${totalSeconds}s`

  const minutes = Math.floor(totalSeconds / SECONDS_PER_MINUTE)
  const seconds = totalSeconds % SECONDS_PER_MINUTE
  return `${minutes}m ${seconds}s`
}

export function isValidTurnDurationBoundaries(boundaries: TurnDurationBoundaries): boolean {
  const { startMs, endMs } = boundaries
  return Number.isFinite(startMs) && Number.isFinite(endMs) && startMs > 0 && endMs >= startMs
}
