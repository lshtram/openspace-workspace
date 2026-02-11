import { describe, it, expect } from "vitest"
import { formatDurationLabel, isValidTurnDurationBoundaries } from "./duration"

describe("duration utils", () => {
  it("formats sub-second durations as < 1s", () => {
    expect(formatDurationLabel(0)).toBe("< 1s")
    expect(formatDurationLabel(999)).toBe("< 1s")
  })

  it("formats second-only durations as Xs", () => {
    expect(formatDurationLabel(1000)).toBe("1s")
    expect(formatDurationLabel(59_999)).toBe("59s")
  })

  it("formats minute-plus durations as Xm Ys", () => {
    expect(formatDurationLabel(60_000)).toBe("1m 0s")
    expect(formatDurationLabel(125_000)).toBe("2m 5s")
  })

  it("throws for invalid durations", () => {
    expect(() => formatDurationLabel(-1)).toThrow("durationMs")
    expect(() => formatDurationLabel(Number.NaN)).toThrow("durationMs")
  })

  it("validates turn boundaries", () => {
    expect(isValidTurnDurationBoundaries({ startMs: 1, endMs: 1 })).toBe(true)
    expect(isValidTurnDurationBoundaries({ startMs: 10, endMs: 9 })).toBe(false)
    expect(isValidTurnDurationBoundaries({ startMs: 0, endMs: 1000 })).toBe(false)
  })
})
