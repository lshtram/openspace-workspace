import { renderHook, act } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { usePaneStateReporter } from "./usePaneStateReporter"
import { type ReactNode, createElement } from "react"
import { PaneProvider, usePane } from "../context/PaneContext"

// ============================================================================
// Test helpers
// ============================================================================

function createWrapper() {
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(PaneProvider, null, children)
  }
}

function renderReporterHook() {
  const wrapper = createWrapper()
  return renderHook(
    () => {
      usePaneStateReporter()
      const pane = usePane()
      return { pane }
    },
    { wrapper },
  )
}

// ============================================================================
// Tests
// ============================================================================

describe("usePaneStateReporter", () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true }), { status: 200 }))
    vi.stubGlobal("fetch", fetchMock)
    vi.spyOn(console, "log").mockImplementation(() => undefined)
    vi.spyOn(console, "error").mockImplementation(() => undefined)
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it("reports pane state to Hub after debounce when layout changes", async () => {
    const { result } = renderReporterHook()

    // Trigger a layout change by opening content
    act(() => {
      result.current.pane.openContent({
        type: "editor",
        title: "test.ts",
        contentId: "editor:test.ts",
      })
    })

    // Before debounce: no panes/state fetch yet (may have other calls from setup)
    const beforeCalls = (fetchMock.mock.calls as [string, ...unknown[]][]).filter(
      (call) => typeof call[0] === "string" && call[0].includes("/panes/state"),
    )

    // Advance past debounce
    await act(async () => {
      vi.advanceTimersByTime(600)
    })

    // Now fetch should have been called with pane state
    const afterCalls = (fetchMock.mock.calls as [string, ...unknown[]][]).filter(
      (call) => typeof call[0] === "string" && call[0].includes("/panes/state"),
    )
    expect(afterCalls.length).toBeGreaterThan(beforeCalls.length)

    const latestCall = afterCalls[afterCalls.length - 1]
    const [url, opts] = latestCall as [string, RequestInit]
    expect(url).toContain("/panes/state")
    expect(opts.method).toBe("POST")
    expect(opts.headers).toEqual({ "Content-Type": "application/json" })

    const body = JSON.parse(opts.body as string) as { version: string; activePaneId: string }
    expect(body.version).toBe("1.0")
    expect(body.activePaneId).toBeTruthy()
  })

  it("debounces rapid layout changes", async () => {
    const { result } = renderReporterHook()

    // Rapid changes
    act(() => {
      result.current.pane.openContent({ type: "editor", title: "a.ts", contentId: "a.ts" })
    })
    act(() => {
      result.current.pane.openContent({ type: "editor", title: "b.ts", contentId: "b.ts" })
    })
    act(() => {
      result.current.pane.openContent({ type: "editor", title: "c.ts", contentId: "c.ts" })
    })

    await act(async () => {
      vi.advanceTimersByTime(600)
    })

    // Should have only one /panes/state call (debounced), not three
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const paneStateCalls = (fetchMock.mock.calls as any[][]).filter(
      (call) => typeof call[0] === "string" && call[0].includes("/panes/state"),
    )
    // The initial render may also trigger, so we check it's <= 2 (initial + debounced)
    expect(paneStateCalls.length).toBeLessThanOrEqual(2)
  })

  it("does not report if layout hasn't changed", async () => {
    renderReporterHook()

    // Advance time without any layout changes
    await act(async () => {
      vi.advanceTimersByTime(1000)
    })

    // The initial layout report might fire once, but no additional calls
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const paneStateCalls = (fetchMock.mock.calls as any[][]).filter(
      (call) => typeof call[0] === "string" && call[0].includes("/panes/state"),
    )
    // At most 1 call for the initial layout
    expect(paneStateCalls.length).toBeLessThanOrEqual(1)
  })
})
