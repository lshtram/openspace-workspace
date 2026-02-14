import type { LeafPaneNode, PaneNode } from "../types"

function normalizeLeaf(node: LeafPaneNode): LeafPaneNode {
  const tabs = Array.isArray(node.tabs) ? node.tabs : []
  const rawActiveTabIndex = Number(node.activeTabIndex)
  const safeActiveTabIndex = Number.isFinite(rawActiveTabIndex) ? Math.trunc(rawActiveTabIndex) : 0
  const activeTabIndex = tabs.length === 0 ? -1 : Math.max(0, Math.min(safeActiveTabIndex, tabs.length - 1))
  return {
    ...node,
    tabs,
    activeTabIndex,
  }
}

export function normalizePaneTree(node: PaneNode): PaneNode {
  if (!node || typeof node !== "object") {
    return {
      id: "pane-root",
      type: "pane",
      tabs: [],
      activeTabIndex: -1,
    }
  }

  if (node.type === "pane") {
    return normalizeLeaf(node)
  }

  const children = Array.isArray(node.children) ? node.children : []
  if (children.length < 2) {
    const fallback = children[0]
    if (fallback) {
      return normalizePaneTree(fallback)
    }
    return {
      id: node.id,
      type: "pane",
      tabs: [],
      activeTabIndex: -1,
    }
  }

  const left = normalizePaneTree(children[0])
  const right = normalizePaneTree(children[1])

  return {
    ...node,
    splitRatio: Math.max(0.1, Math.min(0.9, Number(node.splitRatio) || 0.5)),
    children: [left, right],
  }
}
