import { describe, expect, it } from "vitest"
import {
  closePaneNode,
  countLeafPanes,
  createDefaultPaneLayout,
  findFirstLeafId,
  findPaneForContent,
  splitPaneNode,
} from "./treeOps"

describe("treeOps", () => {
  it("creates a single-pane default layout", () => {
    const layout = createDefaultPaneLayout()

    expect(layout.root.type).toBe("pane")
    expect(layout.activePaneId).toBe(layout.root.id)
    expect(countLeafPanes(layout.root)).toBe(1)
  })

  it("splits an existing pane", () => {
    const layout = createDefaultPaneLayout()
    const splitRoot = splitPaneNode(layout.root, layout.root.id, "horizontal", 4)

    expect(splitRoot.type).toBe("split")
    if (splitRoot.type === "split") {
      expect(splitRoot.direction).toBe("horizontal")
    }
    expect(countLeafPanes(splitRoot)).toBe(2)
  })

  it("does not split beyond max depth", () => {
    const layout = createDefaultPaneLayout()
    const split1 = splitPaneNode(layout.root, layout.root.id, "horizontal", 4)
    if (split1.type !== "split") throw new Error("expected split")
    const split2 = splitPaneNode(split1, split1.children[0].id, "horizontal", 4)
    const split3 = splitPaneNode(split2, findFirstLeafId(split2) ?? "", "horizontal", 4)
    const split4 = splitPaneNode(split3, findFirstLeafId(split3) ?? "", "horizontal", 4)
    const split5 = splitPaneNode(split4, findFirstLeafId(split4) ?? "", "horizontal", 4)

    expect(split5).toEqual(split4)
  })

  it("prevents closing the last pane", () => {
    const layout = createDefaultPaneLayout()
    const next = closePaneNode(layout.root, layout.root.id)

    expect(next).toEqual(layout.root)
    expect(countLeafPanes(next)).toBe(1)
  })

  it("finds pane by content id", () => {
    const layout = createDefaultPaneLayout()
    if (layout.root.type !== "pane") throw new Error("expected pane root")
    layout.root.tabs.push({
      id: "tab-1",
      type: "editor",
      title: "App.tsx",
      contentId: "src/App.tsx",
    })
    layout.root.activeTabIndex = 0

    const pane = findPaneForContent(layout.root, "src/App.tsx")

    expect(pane?.id).toBe(layout.root.id)
  })
})
