import type { PaneTab, SpaceType } from "./types"
import { WhiteboardContent } from "./content/WhiteboardContent"
import { EditorContent } from "./content/EditorContent"
import { PresentationContent } from "./content/PresentationContent"
import { TerminalContent } from "./content/TerminalContent"

type ContentRendererProps = {
  tab: PaneTab
  paneId: string
  isActive: boolean
  sessionId?: string
  directory: string
  onOpenContent: (path: string) => void
}

type ContentRenderer = (props: ContentRendererProps) => JSX.Element

const fallbackRenderer: ContentRenderer = ({ tab }) => (
  <div className="p-4 text-sm text-[var(--os-text-1)]">No renderer for {tab.type}</div>
)

const registry = new Map<SpaceType, ContentRenderer>([
  ["whiteboard", ({ tab, sessionId }) => <WhiteboardContent tab={tab} sessionId={sessionId} />],
  ["drawing", ({ tab, sessionId }) => <WhiteboardContent tab={tab} sessionId={sessionId} />],
  ["editor", ({ tab }) => <EditorContent tab={tab} />],
  ["presentation", ({ tab, onOpenContent }) => (
    <PresentationContent tab={tab} onOpenContent={onOpenContent} />
  )],
  ["terminal", ({ directory }) => <TerminalContent directory={directory} />],
])

export function renderPaneContent(props: ContentRendererProps) {
  const renderer = registry.get(props.tab.type) ?? fallbackRenderer
  return renderer(props)
}
