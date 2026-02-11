import { describe, expect, it } from "vitest"
import { selectAdjacentSession } from "./session-navigation"

describe("selectAdjacentSession", () => {
  it("returns undefined when no sessions are visible", () => {
    expect(
      selectAdjacentSession({
        orderedVisibleSessionIds: [],
        direction: "next",
      }),
    ).toBeUndefined()
  })

  it("selects first/last when active session is missing", () => {
    const ids = ["a", "b", "c"]
    expect(
      selectAdjacentSession({
        orderedVisibleSessionIds: ids,
        activeSessionId: "missing",
        direction: "next",
      }),
    ).toBe("a")
    expect(
      selectAdjacentSession({
        orderedVisibleSessionIds: ids,
        activeSessionId: "missing",
        direction: "previous",
      }),
    ).toBe("c")
  })

  it("wraps around when moving to next session", () => {
    const ids = ["a", "b", "c"]
    expect(
      selectAdjacentSession({
        orderedVisibleSessionIds: ids,
        activeSessionId: "c",
        direction: "next",
      }),
    ).toBe("a")
  })

  it("wraps around when moving to previous session", () => {
    const ids = ["a", "b", "c"]
    expect(
      selectAdjacentSession({
        orderedVisibleSessionIds: ids,
        activeSessionId: "a",
        direction: "previous",
      }),
    ).toBe("c")
  })
})
