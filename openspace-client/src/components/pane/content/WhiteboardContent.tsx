import { WhiteboardFrame } from "../../whiteboard/WhiteboardFrame"
import { TldrawWhiteboard } from "../../whiteboard/TldrawWhiteboard"
import type { PaneTab } from "../types"

type Props = {
  tab: PaneTab
  sessionId?: string
}

export function WhiteboardContent({ tab, sessionId }: Props) {
  const filePath = tab.contentId ?? ""
  if (!filePath) {
    return <div className="p-4 text-sm text-[var(--os-text-1)]">Missing whiteboard path</div>
  }

  if (filePath.endsWith(".diagram.json")) {
    return <TldrawWhiteboard filePath={filePath} sessionId={sessionId} />
  }

  return <WhiteboardFrame filePath={filePath} sessionId={sessionId} />
}
