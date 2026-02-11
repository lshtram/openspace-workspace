export type SessionLike = {
  id: string
}

type SessionNavigationInput = {
  sessions: SessionLike[]
  activeSessionId?: string
  direction: "previous" | "next"
}

function assertSessionNavigationInput(input: SessionNavigationInput) {
  if (!Array.isArray(input.sessions)) {
    throw new Error("sessions must be an array")
  }
  if (input.direction !== "previous" && input.direction !== "next") {
    throw new Error("direction must be 'previous' or 'next'")
  }
}

export function getWrappedSessionNavigationTarget(input: SessionNavigationInput): string | undefined {
  assertSessionNavigationInput(input)
  const { sessions, activeSessionId, direction } = input
  if (sessions.length === 0) return undefined

  const activeIndex = activeSessionId ? sessions.findIndex((session) => session.id === activeSessionId) : -1
  if (sessions.length === 1) return sessions[0].id

  if (activeIndex < 0) {
    return direction === "next" ? sessions[0].id : sessions[sessions.length - 1].id
  }

  const delta = direction === "next" ? 1 : -1
  const nextIndex = (activeIndex + delta + sessions.length) % sessions.length
  return sessions[nextIndex]?.id
}
