import { describe, expect, it } from "vitest"
import { getWrappedSessionNavigationTarget } from "./sessionNavigation"

describe("sessionNavigation", () => {
  const sessions = [{ id: "s1" }, { id: "s2" }, { id: "s3" }]

  it("wraps to last session when navigating previous from first", () => {
    const target = getWrappedSessionNavigationTarget({
      sessions,
      activeSessionId: "s1",
      direction: "previous",
    })
    expect(target).toBe("s3")
  })

  it("wraps to first session when navigating next from last", () => {
    const target = getWrappedSessionNavigationTarget({
      sessions,
      activeSessionId: "s3",
      direction: "next",
    })
    expect(target).toBe("s1")
  })

  it("falls back to first session for next when active session is missing", () => {
    const target = getWrappedSessionNavigationTarget({
      sessions,
      activeSessionId: "missing",
      direction: "next",
    })
    expect(target).toBe("s1")
  })
})
