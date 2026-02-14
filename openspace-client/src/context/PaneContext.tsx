import { createContext, useContext, useMemo, useState, type ReactNode } from "react"
import {
  MAX_SPLIT_DEPTH,
  type ContentSpec,
  type LeafPaneNode,
  type PaneLayout,
  type SplitDirection,
} from "../components/pane/types"
import { normalizePaneTree } from "../components/pane/utils/normalize"
import {
  activateTabByContentId,
  addTabToPane,
  closePaneNode,
  closeTabInPane,
  countLeafPanes,
  createDefaultPaneLayout,
  createTab,
  findFirstLeafId,
  findPaneById,
  findPaneForContent,
  resizeSplitNode,
  setActiveTabIndex,
  splitPaneNode,
} from "../components/pane/utils/treeOps"

type PaneContextType = {
  layout: PaneLayout
  openContent: (spec: ContentSpec) => void
  splitPane: (paneId: string, direction: SplitDirection) => void
  closePane: (paneId: string) => void
  closeTab: (paneId: string, tabId: string) => void
  setActiveTab: (paneId: string, tabIndex: number) => void
  setActivePane: (paneId: string) => void
  resizeSplit: (splitId: string, newRatio: number) => void
  resetLayout: () => void
  setLayout: (layout: PaneLayout) => void
  getActivePane: () => LeafPaneNode | null
  getPaneCount: () => number
}

const PaneContext = createContext<PaneContextType | undefined>(undefined)

function normalizeLayout(next: PaneLayout): PaneLayout {
  const root = normalizePaneTree(next.root)
  const activePane = findPaneById(root, next.activePaneId)

  return {
    ...next,
    root,
    activePaneId: activePane?.id ?? findFirstLeafId(root) ?? "pane-root",
  }
}

export function PaneProvider({ children }: { children: ReactNode }) {
  const [layout, setLayoutState] = useState<PaneLayout>(() => createDefaultPaneLayout())

  const setLayout = (next: PaneLayout) => {
    setLayoutState(normalizeLayout(next))
  }

  const setActivePane = (paneId: string) => {
    setLayoutState((prev) => {
      if (!findPaneById(prev.root, paneId)) return prev
      return {
        ...prev,
        activePaneId: paneId,
      }
    })
  }

  const splitPane = (paneId: string, direction: SplitDirection) => {
    setLayoutState((prev) => {
      const root = splitPaneNode(prev.root, paneId, direction, MAX_SPLIT_DEPTH)
      if (root === prev.root) return prev
      return normalizeLayout({ ...prev, root })
    })
  }

  const closePane = (paneId: string) => {
    setLayoutState((prev) => {
      const root = closePaneNode(prev.root, paneId)
      const activePane = findPaneById(root, prev.activePaneId)
      const activePaneId = activePane?.id ?? findFirstLeafId(root) ?? prev.activePaneId
      return normalizeLayout({ ...prev, root, activePaneId })
    })
  }

  const openContent = (spec: ContentSpec) => {
    setLayoutState((prev) => {
      const dedupePane = spec.contentId ? findPaneForContent(prev.root, spec.contentId) : null
      if (dedupePane && spec.contentId) {
        return {
          ...prev,
          root: activateTabByContentId(prev.root, spec.contentId),
          activePaneId: dedupePane.id,
        }
      }

      const targetPaneId =
        (spec.targetPaneId && findPaneById(prev.root, spec.targetPaneId)?.id) ??
        (findPaneById(prev.root, prev.activePaneId)?.id ?? findFirstLeafId(prev.root) ?? prev.activePaneId)

      const root = addTabToPane(prev.root, targetPaneId, createTab(spec))
      return normalizeLayout({
        ...prev,
        root,
        activePaneId: targetPaneId,
      })
    })
  }

  const closeTab = (paneId: string, tabId: string) => {
    setLayoutState((prev) => ({
      ...prev,
      root: closeTabInPane(prev.root, paneId, tabId),
    }))
  }

  const setActiveTab = (paneId: string, tabIndex: number) => {
    setLayoutState((prev) => ({
      ...prev,
      root: setActiveTabIndex(prev.root, paneId, tabIndex),
      activePaneId: paneId,
    }))
  }

  const resizeSplit = (splitId: string, newRatio: number) => {
    setLayoutState((prev) => ({
      ...prev,
      root: resizeSplitNode(prev.root, splitId, newRatio),
    }))
  }

  const resetLayout = () => {
    setLayoutState(createDefaultPaneLayout())
  }

  const value = useMemo<PaneContextType>(
    () => ({
      layout,
      openContent,
      splitPane,
      closePane,
      closeTab,
      setActiveTab,
      setActivePane,
      resizeSplit,
      resetLayout,
      setLayout,
      getActivePane: () => findPaneById(layout.root, layout.activePaneId),
      getPaneCount: () => countLeafPanes(layout.root),
    }),
    [layout],
  )

  return <PaneContext.Provider value={value}>{children}</PaneContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePane() {
  const context = useContext(PaneContext)
  if (!context) throw new Error("usePane must be used within PaneProvider")
  return context
}
