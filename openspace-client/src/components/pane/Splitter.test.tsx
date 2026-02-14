import { render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { Splitter } from "./Splitter"

const resizeSplit = vi.fn()

vi.mock("../../context/PaneContext", () => ({
  usePane: () => ({ resizeSplit }),
}))

describe("Splitter", () => {
  afterEach(() => {
    resizeSplit.mockReset()
  })

  it("measures split root through local ref scope", () => {
    const observe = vi.fn()
    const disconnect = vi.fn()

    class ResizeObserverMock {
      observe = observe
      disconnect = disconnect
      unobserve = vi.fn()
    }

    const originalResizeObserver = globalThis.ResizeObserver
    globalThis.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver
    try {
      render(
        <div data-testid="split-root" data-split-root="split-a">
          <Splitter splitId="split-a" direction="horizontal" splitRatio={0.5} />
        </div>,
      )

      expect(observe).toHaveBeenCalledWith(screen.getByTestId("split-root"))
    } finally {
      globalThis.ResizeObserver = originalResizeObserver
    }
  })

  it("applies horizontal seam visibility classes", () => {
    render(
      <div data-split-root="split-h">
        <Splitter splitId="split-h" direction="horizontal" splitRatio={0.5} />
      </div>,
    )

    const seam = screen.getByTestId("pane-seam-split-h")
    expect(seam).toHaveClass("w-px")
    expect(seam).toHaveClass("bg-[var(--os-line-strong,#8d8579)]")
  })

  it("applies vertical seam visibility classes", () => {
    render(
      <div data-split-root="split-v">
        <Splitter splitId="split-v" direction="vertical" splitRatio={0.5} />
      </div>,
    )

    const seam = screen.getByTestId("pane-seam-split-v")
    expect(seam).toHaveClass("h-px")
    expect(seam).toHaveClass("bg-[var(--os-line-strong,#8d8579)]")
  })
})
