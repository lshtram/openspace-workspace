import { renderHook, act, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { useAgentCommands } from "./useAgentCommands"
import { type ReactNode, createElement } from "react"
import { PaneProvider, usePane } from "../context/PaneContext"
import {
  installMockEventSource,
  flushPromises,
} from "../test/utils/useArtifactTestUtils"

// ============================================================================
// Test helpers
// ============================================================================

function createWrapper() {
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(PaneProvider, null, children)
  }
}

/**
 * Renders useAgentCommands alongside usePane so we can inspect pane state changes.
 */
function renderAgentCommandsHook() {
  const wrapper = createWrapper()
  return renderHook(
    () => {
      const agentCommands = useAgentCommands()
      const pane = usePane()
      return { agentCommands, pane }
    },
    { wrapper },
  )
}

// ============================================================================
// Tests
// ============================================================================

describe("useAgentCommands", () => {
  const eventSourceMock = installMockEventSource()
  let consoleLogSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.stubGlobal("EventSource", eventSourceMock.EventSource)
    eventSourceMock.reset()
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => undefined)
    vi.spyOn(console, "error").mockImplementation(() => undefined)
    vi.spyOn(console, "warn").mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it("connects to SSE /events on mount and sets connected=true", async () => {
    const { result } = renderAgentCommandsHook()
    const es = eventSourceMock.getLatest()

    act(() => {
      es.emitOpen()
    })

    expect(result.current.agentCommands.connected).toBe(true)
    expect(es.url).toContain("/events")
  })

  it("sets connected=false on SSE error", async () => {
    const { result } = renderAgentCommandsHook()
    const es = eventSourceMock.getLatest()

    act(() => {
      es.emitOpen()
    })
    expect(result.current.agentCommands.connected).toBe(true)

    act(() => {
      es.emitError()
    })
    expect(result.current.agentCommands.connected).toBe(false)
  })

  it("handles pane.open command by calling openContent", async () => {
    const { result } = renderAgentCommandsHook()
    const es = eventSourceMock.getLatest()

    act(() => {
      es.emitOpen()
      es.emitMessage(
        JSON.stringify({
          type: "PANE_COMMAND",
          command: "pane.open",
          payload: { type: "editor", title: "main.ts", contentId: "editor:main.ts" },
          commandId: "cmd-1",
          actor: "agent",
          ts: new Date().toISOString(),
        }),
      )
    })

    await waitFor(() => {
      const activePane = result.current.pane.getActivePane()
      expect(activePane).toBeTruthy()
      const tab = activePane?.tabs.find((t) => t.contentId === "editor:main.ts")
      expect(tab).toBeTruthy()
      expect(tab?.type).toBe("editor")
      expect(tab?.title).toBe("main.ts")
    })
  })

  it("handles pane.close command by contentId — removes the tab", async () => {
    const { result } = renderAgentCommandsHook()
    const es = eventSourceMock.getLatest()

    // First open a tab so there's something to close
    act(() => {
      result.current.pane.openContent({
        type: "editor",
        title: "closeme.ts",
        contentId: "editor:closeme.ts",
      })
    })

    // Verify tab exists
    await waitFor(() => {
      const activePane = result.current.pane.getActivePane()
      expect(activePane?.tabs.some((t) => t.contentId === "editor:closeme.ts")).toBe(true)
    })

    // Now send a pane.close command by contentId
    act(() => {
      es.emitOpen()
      es.emitMessage(
        JSON.stringify({
          type: "PANE_COMMAND",
          command: "pane.close",
          payload: { contentId: "editor:closeme.ts" },
          commandId: "cmd-close-1",
          actor: "agent",
          ts: new Date().toISOString(),
        }),
      )
    })

    await waitFor(() => {
      const activePane = result.current.pane.getActivePane()
      expect(activePane?.tabs.some((t) => t.contentId === "editor:closeme.ts")).toBeFalsy()
    })
  })

  it("handles pane.focus command by setting active pane", async () => {
    const { result } = renderAgentCommandsHook()
    const es = eventSourceMock.getLatest()

    // Open content first so the pane has a tab with that contentId
    act(() => {
      result.current.pane.openContent({
        type: "editor",
        title: "focus.ts",
        contentId: "editor:focus.ts",
      })
    })

    act(() => {
      es.emitOpen()
      es.emitMessage(
        JSON.stringify({
          type: "PANE_COMMAND",
          command: "pane.focus",
          payload: { contentId: "editor:focus.ts" },
          commandId: "cmd-focus-1",
          actor: "agent",
          ts: new Date().toISOString(),
        }),
      )
    })

    // The active pane should still be the one containing editor:focus.ts
    await waitFor(() => {
      const activePane = result.current.pane.getActivePane()
      expect(activePane?.tabs.some((t) => t.contentId === "editor:focus.ts")).toBe(true)
    })
  })

  it("handles editor.open command by opening an editor tab with contentId=path", async () => {
    const { result } = renderAgentCommandsHook()
    const es = eventSourceMock.getLatest()

    act(() => {
      es.emitOpen()
      es.emitMessage(
        JSON.stringify({
          type: "PANE_COMMAND",
          command: "editor.open",
          payload: { path: "src/app.tsx", line: 42 },
          commandId: "cmd-editor-1",
          actor: "agent",
          ts: new Date().toISOString(),
        }),
      )
    })

    await waitFor(() => {
      const activePane = result.current.pane.getActivePane()
      expect(activePane).toBeTruthy()
      const tab = activePane?.tabs.find((t) => t.contentId === "src/app.tsx")
      expect(tab).toBeTruthy()
      expect(tab?.type).toBe("editor")
      expect(tab?.title).toBe("app.tsx")
    })
  })

  it("handles editor.close command by closing the editor tab with matching contentId", async () => {
    const { result } = renderAgentCommandsHook()
    const es = eventSourceMock.getLatest()

    // Open an editor tab first
    act(() => {
      result.current.pane.openContent({
        type: "editor",
        title: "remove.ts",
        contentId: "src/remove.ts",
      })
    })

    await waitFor(() => {
      const p = result.current.pane.getActivePane()
      expect(p?.tabs.some((t) => t.contentId === "src/remove.ts")).toBe(true)
    })

    act(() => {
      es.emitOpen()
      es.emitMessage(
        JSON.stringify({
          type: "PANE_COMMAND",
          command: "editor.close",
          payload: { path: "src/remove.ts" },
          commandId: "cmd-editor-close-1",
          actor: "agent",
          ts: new Date().toISOString(),
        }),
      )
    })

    await waitFor(() => {
      const p = result.current.pane.getActivePane()
      expect(p?.tabs.some((t) => t.contentId === "src/remove.ts")).toBeFalsy()
    })
  })

  it("handles presentation.open command by opening a presentation tab", async () => {
    const { result } = renderAgentCommandsHook()
    const es = eventSourceMock.getLatest()

    act(() => {
      es.emitOpen()
      es.emitMessage(
        JSON.stringify({
          type: "PANE_COMMAND",
          command: "presentation.open",
          payload: { name: "Overview", path: "design/deck/Overview.deck.md" },
          commandId: "cmd-pres-1",
          actor: "agent",
          ts: new Date().toISOString(),
        }),
      )
    })

    await waitFor(() => {
      const activePane = result.current.pane.getActivePane()
      const tab = activePane?.tabs.find((t) => t.contentId === "design/deck/Overview.deck.md")
      expect(tab).toBeTruthy()
      expect(tab?.type).toBe("presentation")
      expect(tab?.title).toBe("Overview")
    })
  })

  it("handles presentation.navigate command by emitting a custom event", async () => {
    const { result } = renderAgentCommandsHook()
    const es = eventSourceMock.getLatest()

    const eventPromise = new Promise<CustomEvent>((resolve) => {
      window.addEventListener("agent:presentation:navigate", (e) => {
        resolve(e as CustomEvent)
      }, { once: true })
    })

    act(() => {
      es.emitOpen()
      es.emitMessage(
        JSON.stringify({
          type: "PANE_COMMAND",
          command: "presentation.navigate",
          payload: { slideIndex: 3, name: "Overview" },
          commandId: "cmd-pres-nav-1",
          actor: "agent",
          ts: new Date().toISOString(),
        }),
      )
    })

    const event = await eventPromise
    expect(event.detail.slideIndex).toBe(3)
    expect(event.detail.name).toBe("Overview")
  })

  it("ignores unknown command types gracefully", async () => {
    const { result } = renderAgentCommandsHook()
    const es = eventSourceMock.getLatest()

    act(() => {
      es.emitOpen()
      es.emitMessage(
        JSON.stringify({
          type: "PANE_COMMAND",
          command: "unknown.command",
          payload: {},
          commandId: "cmd-unknown-1",
          actor: "agent",
          ts: new Date().toISOString(),
        }),
      )
    })

    // Should not throw, hook should remain connected
    expect(result.current.agentCommands.connected).toBe(true)
  })

  it("ignores non-PANE_COMMAND SSE events", async () => {
    const { result } = renderAgentCommandsHook()
    const es = eventSourceMock.getLatest()

    act(() => {
      es.emitOpen()
      es.emitMessage(
        JSON.stringify({
          type: "FILE_CHANGED",
          path: "test.txt",
          actor: "agent",
        }),
      )
    })

    // No tabs should have been opened
    const activePane = result.current.pane.getActivePane()
    expect(activePane?.tabs.length ?? 0).toBe(0)
  })

  it("cleans up EventSource on unmount", async () => {
    const { unmount } = renderAgentCommandsHook()
    const es = eventSourceMock.getLatest()

    act(() => {
      es.emitOpen()
    })

    expect(es.closed).toBe(false)
    unmount()
    expect(es.closed).toBe(true)
  })
})
