import type { ContentSpec, LeafPaneNode, PaneLayout, PaneNode, PaneTab, SplitDirection } from "../types"

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`
  }
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

function createEmptyLeaf(id?: string): LeafPaneNode {
  return {
    id: id ?? createId("pane"),
    type: "pane",
    tabs: [],
    activeTabIndex: -1,
  }
}

export function createDefaultPaneLayout(): PaneLayout {
  const root = createEmptyLeaf("pane-root")
  return {
    version: "1.0",
    root,
    activePaneId: root.id,
  }
}

export function countLeafPanes(node: PaneNode): number {
  if (node.type === "pane") return 1
  return countLeafPanes(node.children[0]) + countLeafPanes(node.children[1])
}

export function findFirstLeafId(node: PaneNode): string | null {
  if (node.type === "pane") return node.id
  return findFirstLeafId(node.children[0]) ?? findFirstLeafId(node.children[1])
}

function getDepthAtNode(node: PaneNode, targetId: string, currentDepth: number): number | null {
  if (node.type === "pane") {
    return node.id === targetId ? currentDepth : null
  }
  const left = getDepthAtNode(node.children[0], targetId, currentDepth + 1)
  if (left !== null) return left
  return getDepthAtNode(node.children[1], targetId, currentDepth + 1)
}

function clampRatio(ratio: number) {
  return Math.max(0.1, Math.min(0.9, ratio))
}

export function splitPaneNode(
  root: PaneNode,
  paneId: string,
  direction: SplitDirection,
  maxDepth: number,
): PaneNode {
  const depth = getDepthAtNode(root, paneId, 1)
  if (depth === null || depth >= maxDepth) {
    return root
  }

  const visit = (node: PaneNode): PaneNode => {
    if (node.type === "pane") {
      if (node.id !== paneId) return node
      return {
        id: createId("split"),
        type: "split",
        direction,
        splitRatio: 0.5,
        children: [node, createEmptyLeaf()],
      }
    }

    const nextLeft = visit(node.children[0])
    if (nextLeft !== node.children[0]) {
      return {
        ...node,
        children: [nextLeft, node.children[1]],
      }
    }

    const nextRight = visit(node.children[1])
    if (nextRight !== node.children[1]) {
      return {
        ...node,
        children: [node.children[0], nextRight],
      }
    }

    return node
  }

  return visit(root)
}

export function closePaneNode(root: PaneNode, paneId: string): PaneNode {
  if (countLeafPanes(root) <= 1) {
    return root
  }

  const visit = (node: PaneNode): PaneNode | null => {
    if (node.type === "pane") {
      return node.id === paneId ? null : node
    }

    const left = visit(node.children[0])
    const right = visit(node.children[1])

    if (!left && !right) return createEmptyLeaf(node.id)
    if (!left) return right
    if (!right) return left

    return {
      ...node,
      children: [left, right],
    }
  }

  return visit(root) ?? root
}

export function findPaneById(node: PaneNode, paneId: string): LeafPaneNode | null {
  if (node.type === "pane") {
    return node.id === paneId ? node : null
  }
  return findPaneById(node.children[0], paneId) ?? findPaneById(node.children[1], paneId)
}

export function findPaneForContent(node: PaneNode, contentId: string): LeafPaneNode | null {
  if (node.type === "pane") {
    return node.tabs.some((tab) => tab.contentId === contentId) ? node : null
  }
  return findPaneForContent(node.children[0], contentId) ?? findPaneForContent(node.children[1], contentId)
}

export function addTabToPane(node: PaneNode, paneId: string, tab: PaneTab): PaneNode {
  if (node.type === "pane") {
    if (node.id !== paneId) return node
    return {
      ...node,
      tabs: [...node.tabs, tab],
      activeTabIndex: node.tabs.length,
    }
  }

  const left = addTabToPane(node.children[0], paneId, tab)
  if (left !== node.children[0]) {
    return { ...node, children: [left, node.children[1]] }
  }

  const right = addTabToPane(node.children[1], paneId, tab)
  if (right !== node.children[1]) {
    return { ...node, children: [node.children[0], right] }
  }

  return node
}

export function activateTabByContentId(node: PaneNode, contentId: string): PaneNode {
  if (node.type === "pane") {
    const index = node.tabs.findIndex((tab) => tab.contentId === contentId)
    if (index < 0) return node
    return { ...node, activeTabIndex: index }
  }

  const left = activateTabByContentId(node.children[0], contentId)
  if (left !== node.children[0]) {
    return { ...node, children: [left, node.children[1]] }
  }

  const right = activateTabByContentId(node.children[1], contentId)
  if (right !== node.children[1]) {
    return { ...node, children: [node.children[0], right] }
  }

  return node
}

export function closeTabInPane(node: PaneNode, paneId: string, tabId: string): PaneNode {
  if (node.type === "pane") {
    if (node.id !== paneId) return node
    const nextTabs = node.tabs.filter((tab) => tab.id !== tabId)
    const nextIndex = nextTabs.length === 0 ? -1 : Math.min(node.activeTabIndex, nextTabs.length - 1)
    return {
      ...node,
      tabs: nextTabs,
      activeTabIndex: nextIndex,
    }
  }

  const left = closeTabInPane(node.children[0], paneId, tabId)
  if (left !== node.children[0]) {
    return { ...node, children: [left, node.children[1]] }
  }

  const right = closeTabInPane(node.children[1], paneId, tabId)
  if (right !== node.children[1]) {
    return { ...node, children: [node.children[0], right] }
  }

  return node
}

export function setActiveTabIndex(node: PaneNode, paneId: string, index: number): PaneNode {
  if (node.type === "pane") {
    if (node.id !== paneId) return node
    if (node.tabs.length === 0) {
      return { ...node, activeTabIndex: -1 }
    }
    const nextIndex = Math.max(0, Math.min(index, node.tabs.length - 1))
    return { ...node, activeTabIndex: nextIndex }
  }

  const left = setActiveTabIndex(node.children[0], paneId, index)
  if (left !== node.children[0]) {
    return { ...node, children: [left, node.children[1]] }
  }

  const right = setActiveTabIndex(node.children[1], paneId, index)
  if (right !== node.children[1]) {
    return { ...node, children: [node.children[0], right] }
  }

  return node
}

export function resizeSplitNode(node: PaneNode, splitId: string, ratio: number): PaneNode {
  if (node.type === "pane") return node
  if (node.id === splitId) {
    return { ...node, splitRatio: clampRatio(ratio) }
  }

  const left = resizeSplitNode(node.children[0], splitId, ratio)
  if (left !== node.children[0]) {
    return { ...node, children: [left, node.children[1]] }
  }

  const right = resizeSplitNode(node.children[1], splitId, ratio)
  if (right !== node.children[1]) {
    return { ...node, children: [node.children[0], right] }
  }

  return node
}

export function createTab(spec: ContentSpec): PaneTab {
  return {
    id: createId("tab"),
    type: spec.type,
    title: spec.title,
    contentId: spec.contentId,
  }
}
