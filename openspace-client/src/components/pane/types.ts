export type SplitDirection = "horizontal" | "vertical"

export type SpaceType =
  | "editor"
  | "whiteboard"
  | "drawing"
  | "presentation"
  | "terminal"
  | "dashboard"
  | "diff"
  | "browser"
  | "media"

export interface PaneTab {
  id: string
  type: SpaceType
  title: string
  contentId?: string
}

interface PaneNodeBase {
  id: string
}

export interface LeafPaneNode extends PaneNodeBase {
  type: "pane"
  tabs: PaneTab[]
  activeTabIndex: number
}

export interface SplitPaneNode extends PaneNodeBase {
  type: "split"
  direction: SplitDirection
  splitRatio: number
  children: [PaneNode, PaneNode]
}

export type PaneNode = LeafPaneNode | SplitPaneNode

export interface PaneLayout {
  version: "1.0"
  root: PaneNode
  activePaneId: string
}

export interface ContentSpec {
  type: SpaceType
  title: string
  contentId?: string
  targetPaneId?: string
}

export const MIN_PANE_WIDTH = 200
export const MIN_PANE_HEIGHT = 150
export const MAX_SPLIT_DEPTH = 4
