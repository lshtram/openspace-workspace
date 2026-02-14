import { describe, expect, it } from "vitest"
import type { PaneNode } from "../types"
import { normalizePaneTree } from "./normalize"

describe("normalizePaneTree", () => {
  it("normalizes invalid leaf tab index", () => {
    const broken: PaneNode = {
      id: "pane-a",
      type: "pane",
      tabs: [{ id: "t", type: "editor", title: "x" }],
      activeTabIndex: 7,
    }

    const normalized = normalizePaneTree(broken)

    expect(normalized.type).toBe("pane")
    if (normalized.type === "pane") {
      expect(normalized.activeTabIndex).toBe(0)
    }
  })

  it("collapses split with missing child", () => {
    const broken = {
      id: "split-a",
      type: "split",
      direction: "horizontal",
      splitRatio: 0.5,
      children: [
        {
          id: "pane-a",
          type: "pane",
          tabs: [],
          activeTabIndex: -1,
        },
      ],
    } as unknown as PaneNode

    const normalized = normalizePaneTree(broken)

    expect(normalized.type).toBe("pane")
  })

  it("coerces non-finite activeTabIndex to a safe value", () => {
    const broken = {
      id: "pane-a",
      type: "pane",
      tabs: [{ id: "t", type: "editor", title: "x" }],
      activeTabIndex: Number.NaN,
    } as unknown as PaneNode

    const normalized = normalizePaneTree(broken)

    expect(normalized.type).toBe("pane")
    if (normalized.type === "pane") {
      expect(normalized.activeTabIndex).toBe(0)
    }
  })
})
