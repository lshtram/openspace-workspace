import { describe, expect, it } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { PaneProvider, usePane } from "./PaneContext"

function Harness() {
  const pane = usePane()
  const activePane = pane.getActivePane()

  return (
    <div>
      <div data-testid="pane-count">{pane.getPaneCount()}</div>
      <div data-testid="active-pane">{activePane?.id ?? "none"}</div>
      <button
        type="button"
        onClick={() => pane.splitPane(pane.layout.activePaneId, "horizontal")}
      >
        split
      </button>
      <button
        type="button"
        onClick={() =>
          pane.openContent({
            type: "editor",
            title: "App.tsx",
            contentId: "src/App.tsx",
          })
        }
      >
        open-editor
      </button>
      <button
        type="button"
        onClick={() =>
          pane.openContent({
            type: "editor",
            title: "App.tsx",
            contentId: "src/App.tsx",
          })
        }
      >
        open-editor-again
      </button>
      <button
        type="button"
        onClick={() =>
          pane.openContent({
            type: "presentation",
            title: "Deck",
            contentId: "design/deck.deck.md",
          })
        }
      >
        open-presentation
      </button>
      <button type="button" onClick={() => pane.setActiveTab(pane.layout.activePaneId, 1)}>
        activate-tab-2
      </button>
      <button
        type="button"
        onClick={() =>
          pane.setLayout({
            ...pane.layout,
            activePaneId: "missing-pane",
          })
        }
      >
        set-missing-active
      </button>
      <button
        type="button"
        onClick={() => {
          if (pane.layout.root.type !== "split") return
          pane.setLayout({
            ...pane.layout,
            activePaneId: pane.layout.root.id,
          })
        }}
      >
        set-split-active
      </button>
      <div data-testid="active-tab-title">
        {activePane && activePane.activeTabIndex >= 0
          ? activePane.tabs[activePane.activeTabIndex].title
          : "none"}
      </div>
      <div data-testid="tab-count">{activePane?.tabs.length ?? 0}</div>
    </div>
  )
}

describe("PaneContext", () => {
  it("splits pane and updates pane count", () => {
    render(
      <PaneProvider>
        <Harness />
      </PaneProvider>,
    )

    expect(screen.getByTestId("pane-count")).toHaveTextContent("1")
    fireEvent.click(screen.getByText("split"))
    expect(screen.getByTestId("pane-count")).toHaveTextContent("2")
  })

  it("deduplicates content by contentId", () => {
    render(
      <PaneProvider>
        <Harness />
      </PaneProvider>,
    )

    fireEvent.click(screen.getByText("open-editor"))
    fireEvent.click(screen.getByText("open-editor-again"))

    expect(screen.getByTestId("tab-count")).toHaveTextContent("1")
    expect(screen.getByTestId("active-tab-title")).toHaveTextContent("App.tsx")
  })

  it("switches active tab by index", () => {
    render(
      <PaneProvider>
        <Harness />
      </PaneProvider>,
    )

    fireEvent.click(screen.getByText("open-editor"))
    fireEvent.click(screen.getByText("open-presentation"))
    fireEvent.click(screen.getByText("activate-tab-2"))

    expect(screen.getByTestId("active-tab-title")).toHaveTextContent("Deck")
  })

  it("enforces always-active-pane invariant when restored active pane is missing", () => {
    render(
      <PaneProvider>
        <Harness />
      </PaneProvider>,
    )

    fireEvent.click(screen.getByText("split"))
    fireEvent.click(screen.getByText("set-missing-active"))

    expect(screen.getByTestId("active-pane")).not.toHaveTextContent("missing-pane")
    expect(screen.getByTestId("active-pane")).toHaveTextContent("pane-root")
  })

  it("enforces always-leaf active-pane invariant when restore points to split node", () => {
    render(
      <PaneProvider>
        <Harness />
      </PaneProvider>,
    )

    fireEvent.click(screen.getByText("split"))
    fireEvent.click(screen.getByText("set-split-active"))

    expect(screen.getByTestId("active-pane")).not.toHaveTextContent("split-")
  })
})
