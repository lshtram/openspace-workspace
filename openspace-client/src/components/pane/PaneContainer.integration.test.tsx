import { describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { PaneProvider } from "../../context/PaneContext"
import { PaneContainer } from "./PaneContainer"

vi.mock("./ContentRendererRegistry", () => ({
  renderPaneContent: () => <div data-testid="mock-renderer">content</div>,
}))

vi.mock("../AgentConsole", () => ({
  AgentConsole: () => <div data-testid="mock-agent-console">agent</div>,
}))

function renderPaneContainer() {
  return render(
    <PaneProvider>
      <PaneContainer directory="/test/dir" />
    </PaneProvider>,
  )
}

describe("PaneContainer integration", () => {
  it("starts with a single empty pane", () => {
    renderPaneContainer()

    expect(screen.getAllByText("Select content to open")).toHaveLength(1)
  })

  it("splits pane from header action", () => {
    renderPaneContainer()

    fireEvent.click(screen.getByRole("button", { name: "Split right" }))

    expect(screen.getAllByText("Select content to open")).toHaveLength(2)
  })

  it("splits down and closes one pane", () => {
    renderPaneContainer()

    fireEvent.click(screen.getByRole("button", { name: "Split down" }))
    expect(screen.getAllByText("Select content to open")).toHaveLength(2)

    fireEvent.click(screen.getAllByRole("button", { name: "Close pane" })[0])
    expect(screen.getAllByText("Select content to open")).toHaveLength(1)
  })

  it("prevents closing the last pane", () => {
    renderPaneContainer()

    expect(screen.queryByRole("button", { name: "Close pane" })).not.toBeInTheDocument()
  })

  it("shows empty-pane quick actions for editor and presentation", () => {
    renderPaneContainer()

    expect(screen.getByRole("button", { name: "Open Editor" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Open Presentation" })).toBeInTheDocument()
  })

  it("closes an active tab from the tab close affordance", () => {
    renderPaneContainer()

    fireEvent.click(screen.getByRole("button", { name: "Open Whiteboard" }))
    expect(screen.getByText("Untitled Whiteboard")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Close tab Untitled Whiteboard" }))
    expect(screen.getByText("Select content to open")).toBeInTheDocument()
  })

  it("hides pane content while docked and restores it after undock", () => {
    let docked = ""
    const onUndockAgent = vi.fn(() => {
      docked = ""
      rerenderView()
    })

    const rerenderView = () => {
      view.rerender(
        <PaneProvider>
          <PaneContainer directory="/test/dir" dockedAgentPaneId={docked || undefined} onUndockAgent={onUndockAgent} />
        </PaneProvider>,
      )
    }

    const view = render(
      <PaneProvider>
        <PaneContainer directory="/test/dir" dockedAgentPaneId={undefined} onUndockAgent={onUndockAgent} />
      </PaneProvider>,
    )

    fireEvent.click(screen.getByRole("button", { name: "Open Whiteboard" }))
    expect(screen.getByTestId("pane-content-pane-root")).not.toHaveClass("hidden")

    docked = "pane-root"
    rerenderView()
    expect(screen.getByTestId("docked-agent-pane")).toBeInTheDocument()
    expect(screen.getByTestId("pane-content-pane-root")).toHaveClass("hidden")

    fireEvent.click(screen.getByRole("button", { name: "Undock conversation" }))
    expect(onUndockAgent).toHaveBeenCalled()
    expect(screen.queryByTestId("docked-agent-pane")).not.toBeInTheDocument()
    expect(screen.getByTestId("pane-content-pane-root")).not.toHaveClass("hidden")
  })

  it("renders docked agent in a fresh pane with no tabs", () => {
    render(
      <PaneProvider>
        <PaneContainer directory="/test/dir" dockedAgentPaneId="pane-root" onUndockAgent={vi.fn()} />
      </PaneProvider>,
    )

    expect(screen.getByTestId("docked-agent-pane")).toBeInTheDocument()
    expect(screen.getByTestId("pane-content-pane-root")).toHaveClass("hidden")
  })

  it("activates pane from header and uses reduced active-tab styling in inactive pane", () => {
    renderPaneContainer()

    fireEvent.click(screen.getByRole("button", { name: "Open Whiteboard" }))
    fireEvent.click(screen.getByRole("button", { name: "Split right" }))

    const activateButtons = screen.getAllByRole("button", { name: /Activate pane/ })
    fireEvent.click(activateButtons[1])

    const tabTitle = screen.getByRole("button", { name: "Untitled Whiteboard" })
    const activeTabInInactivePane = tabTitle.closest('[data-testid^="pane-tab-"]')
    expect(activeTabInInactivePane).toBeTruthy()
    expect(activeTabInInactivePane).toHaveClass("font-medium")
    expect(activeTabInInactivePane).not.toHaveClass("font-semibold")
  })

  it("activates pane when pane header is clicked", () => {
    renderPaneContainer()

    fireEvent.click(screen.getByRole("button", { name: "Split right" }))

    const headers = screen.getAllByTestId(/pane-header-/)
    fireEvent.click(screen.getAllByRole("button", { name: /Activate pane header/ })[1])

    expect(headers[1]).toHaveClass("bg-[var(--os-bg-2,#f3efe7)]")
    expect(headers[1]).toHaveClass("text-[var(--os-text-0,#1d1a17)]")
    expect(headers[1]).toHaveClass("shadow-[inset_0_-2px_0_var(--os-accent,#5e5ce6)]")
    expect(headers[0]).toHaveClass("bg-[var(--os-bg-1,#fcfbf9)]")
    expect(headers[0]).toHaveClass("text-[var(--os-text-1,#7a746c)]")
  })

  it("renders a visible seam contract for horizontal split", () => {
    renderPaneContainer()

    fireEvent.click(screen.getByRole("button", { name: "Split right" }))

    const seams = screen.getAllByTestId(/pane-seam-/)
    expect(seams).toHaveLength(1)
    expect(seams[0]).toHaveClass("w-px")
    expect(seams[0]).toHaveClass("bg-[var(--os-line-strong,#8d8579)]")
  })

  it("renders a visible seam contract for vertical split", () => {
    renderPaneContainer()

    fireEvent.click(screen.getByRole("button", { name: "Split down" }))

    const seams = screen.getAllByTestId(/pane-seam-/)
    expect(seams).toHaveLength(1)
    expect(seams[0]).toHaveClass("h-px")
    expect(seams[0]).toHaveClass("bg-[var(--os-line-strong,#8d8579)]")
  })
})
