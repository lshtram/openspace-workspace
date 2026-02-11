export type SessionNavigationDirection = "previous" | "next"

export type SessionNavigationInput = {
  orderedVisibleSessionIds: string[]
  activeSessionId?: string
  direction: SessionNavigationDirection
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

export function selectAdjacentSession(input: SessionNavigationInput): string | undefined {
  assert(input && typeof input === "object", "Session navigation input is required.")
  const { orderedVisibleSessionIds, activeSessionId, direction } = input
  assert(Array.isArray(orderedVisibleSessionIds), "orderedVisibleSessionIds must be an array.")
  assert(direction === "previous" || direction === "next", "direction must be 'previous' or 'next'.")

  const total = orderedVisibleSessionIds.length
  if (total === 0) return undefined

  const activeIndex = activeSessionId ? orderedVisibleSessionIds.indexOf(activeSessionId) : -1
  if (activeIndex < 0) {
    return direction === "next" ? orderedVisibleSessionIds[0] : orderedVisibleSessionIds[total - 1]
  }

  const delta = direction === "next" ? 1 : -1
  const nextIndex = (activeIndex + delta + total) % total
  return orderedVisibleSessionIds[nextIndex]
}
