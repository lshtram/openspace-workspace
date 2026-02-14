import { describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { FloatingAgentConversation } from "./FloatingAgentConversation"
import { LAYER_FLOATING_AGENT } from "../../constants/layers"

vi.mock("../AgentConsole", () => ({
  AgentConsole: () => <div data-testid="agent-console">AgentConsole</div>,
}))
import type { AgentConversationState } from "../../context/LayoutContext"

function renderFloatingAgent(
  initial: AgentConversationState = {
    mode: "floating",
    size: "minimal",
    position: { x: 95, y: 92 },
    dimensions: { width: 620, height: 420 },
    visible: true,
  },
  options?: {
    activePaneId?: string
    resolveDockPaneId?: () => string | undefined
  },
) {
  let state = initial
  const setState = (next: AgentConversationState) => {
    state = next
  }

  const utils = render(
    <FloatingAgentConversation
      sessionId="s1"
      directory="/repo"
      state={state}
      setState={setState}
      activePaneId={options?.activePaneId ?? "pane-root"}
      resolveDockPaneId={options?.resolveDockPaneId}
    />,
  )

  return { ...utils, getState: () => state }
}

describe("FloatingAgentConversation", () => {
  it("expands from minimal bubble", () => {
    const view = renderFloatingAgent()
    fireEvent.click(screen.getByRole("button", { name: "Open agent conversation" }))
    expect(view.getState().size).toBe("expanded")
  })

  it("shows microphone and attach affordances in minimal state", () => {
    renderFloatingAgent()

    expect(screen.getByText("Monitoring this session")).toBeInTheDocument()
    expect(screen.getByTitle("Conversation mode")).toBeInTheDocument()
    expect(screen.getByTitle("Microphone")).toBeInTheDocument()
    expect(screen.getByTitle("Attach file")).toBeInTheDocument()
    expect(screen.getByTestId("speaking-indicator")).toHaveAttribute("data-speaker", "assistant")
    expect(screen.getByTestId("floating-agent-layer")).toHaveStyle({ zIndex: `${LAYER_FLOATING_AGENT}` })
  })

  it("minimizes on Escape", () => {
    const view = renderFloatingAgent({
      size: "expanded",
      mode: "floating",
      position: { x: 80, y: 80 },
      dimensions: { width: 620, height: 420 },
      visible: true,
    })
    fireEvent.keyDown(window, { key: "Escape" })
    expect(view.getState().size).toBe("minimal")
  })

  it("allows drag clamping to viewport borders", () => {
    const view = renderFloatingAgent({
      size: "expanded",
      mode: "floating",
      position: { x: 50, y: 50 },
      dimensions: { width: 620, height: 420 },
      visible: true,
    })

    fireEvent.pointerDown(screen.getByText("Agent"), { clientX: 10, clientY: 10 })
    fireEvent.pointerMove(window, { clientX: 99999, clientY: 99999 })
    fireEvent.pointerUp(window)

    expect(view.getState().position).toEqual({ x: 100, y: 100 })
  })

  it("keeps expanded window on-screen when dragged beyond top-left", () => {
    const view = renderFloatingAgent({
      size: "expanded",
      mode: "floating",
      position: { x: 50, y: 50 },
      dimensions: { width: 620, height: 420 },
      visible: true,
    })

    fireEvent.pointerDown(screen.getByText("Agent"), { clientX: 10, clientY: 10 })
    fireEvent.pointerMove(window, { clientX: -99999, clientY: -99999 })
    fireEvent.pointerUp(window)

    expect(view.getState().position.x).toBeCloseTo((620 / window.innerWidth) * 100)
    expect(view.getState().position.y).toBeCloseTo((420 / window.innerHeight) * 100)
  })

  it("resizes expanded window and persists dimensions in state", () => {
    const view = renderFloatingAgent({
      size: "expanded",
      mode: "floating",
      position: { x: 60, y: 60 },
      dimensions: { width: 620, height: 420 },
      visible: true,
    })

    fireEvent.pointerDown(screen.getByTestId("floating-resize-handle-bottom-right"), { clientX: 100, clientY: 100 })
    fireEvent.pointerMove(window, { clientX: 260, clientY: 280 })
    fireEvent.pointerUp(window)

    expect(view.getState().dimensions.width).toBe(780)
    expect(view.getState().dimensions.height).toBe(600)
  })

  it("supports all edge and corner resize handles", () => {
    renderFloatingAgent({
      size: "expanded",
      mode: "floating",
      position: { x: 60, y: 60 },
      dimensions: { width: 620, height: 420 },
      visible: true,
    })

    expect(screen.getByTestId("floating-resize-handle-left")).toBeInTheDocument()
    expect(screen.getByTestId("floating-resize-handle-right")).toBeInTheDocument()
    expect(screen.getByTestId("floating-resize-handle-top")).toBeInTheDocument()
    expect(screen.getByTestId("floating-resize-handle-bottom")).toBeInTheDocument()
    expect(screen.getByTestId("floating-resize-handle-top-left")).toBeInTheDocument()
    expect(screen.getByTestId("floating-resize-handle-top-right")).toBeInTheDocument()
    expect(screen.getByTestId("floating-resize-handle-bottom-left")).toBeInTheDocument()
    expect(screen.getByTestId("floating-resize-handle-bottom-right")).toBeInTheDocument()
  })

  it("only drags from title bar", () => {
    const view = renderFloatingAgent({
      size: "expanded",
      mode: "floating",
      position: { x: 50, y: 50 },
      dimensions: { width: 620, height: 420 },
      visible: true,
    })

    fireEvent.pointerDown(screen.getByTestId("agent-console"), { clientX: 10, clientY: 10 })
    fireEvent.pointerMove(window, { clientX: 200, clientY: 220 })
    fireEvent.pointerUp(window)

    expect(view.getState().position).toEqual({ x: 50, y: 50 })
  })

  it("docks to active pane when grab pane is pressed", () => {
    const view = renderFloatingAgent({
      size: "expanded",
      mode: "floating",
      position: { x: 60, y: 60 },
      dimensions: { width: 620, height: 420 },
      visible: true,
    })

    fireEvent.click(screen.getByRole("button", { name: "Grab pane" }))

    expect(view.getState().mode).toBe("docked-pane")
    expect(view.getState().dockedPaneId).toBe("pane-root")
  })

  it("falls back to first leaf pane when active pane is invalid on grab", () => {
    const view = renderFloatingAgent(
      {
        size: "expanded",
        mode: "floating",
        position: { x: 60, y: 60 },
        dimensions: { width: 620, height: 420 },
        visible: true,
      },
      {
        activePaneId: "",
        resolveDockPaneId: () => "pane-root",
      },
    )

    fireEvent.click(screen.getByRole("button", { name: "Grab pane" }))
    expect(view.getState().dockedPaneId).toBe("pane-root")
  })

  it("uses an explicit non-transparent blurred header strip in expanded mode", () => {
    renderFloatingAgent({
      size: "expanded",
      mode: "floating",
      position: { x: 60, y: 60 },
      dimensions: { width: 620, height: 420 },
      visible: true,
    })

    const header = screen.getByText("Agent").closest("div")
    expect(header).toHaveClass("bg-[rgba(24,24,24,0.52)]")
    expect(header).toHaveClass("backdrop-blur-md")
    expect(header).toHaveClass("text-white")
  })

  it("uses an explicit non-transparent blurred header strip in full mode", () => {
    renderFloatingAgent({
      size: "full",
      mode: "floating",
      position: { x: 60, y: 60 },
      dimensions: { width: 620, height: 420 },
      visible: true,
    })

    const header = screen.getByText("Agent").closest("div")
    expect(header).toHaveClass("bg-[rgba(24,24,24,0.52)]")
    expect(header).toHaveClass("backdrop-blur-md")
    expect(header).toHaveClass("text-white")
  })
})
