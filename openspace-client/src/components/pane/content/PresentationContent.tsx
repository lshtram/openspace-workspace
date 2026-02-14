import PresentationFrame from "../../PresentationFrame"
import type { PaneTab } from "../types"

type Props = {
  tab: PaneTab
  onOpenContent: (path: string) => void
}

export function PresentationContent({ tab, onOpenContent }: Props) {
  const filePath = tab.contentId ?? ""
  if (!filePath) {
    return <div className="p-4 text-sm text-[var(--os-text-1)]">Missing presentation path</div>
  }

  return <PresentationFrame filePath={filePath} onOpenFile={onOpenContent} />
}
