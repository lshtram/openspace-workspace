import { useArtifact } from "../../../hooks/useArtifact"
import type { PaneTab } from "../types"

type Props = {
  tab: PaneTab
}

export function EditorContent({ tab }: Props) {
  const filePath = tab.contentId ?? ""
  const { data, loading, error } = useArtifact<string>(filePath, {
    parse: (content) => content,
    serialize: (content) => content,
  })

  if (!filePath) {
    return <div className="p-4 text-sm text-[var(--os-text-1)]">Missing file path</div>
  }

  if (loading) {
    return <div className="p-4 text-sm text-[var(--os-text-1)]">Loading file...</div>
  }

  if (error) {
    return <div className="p-4 text-sm text-red-400">{error}</div>
  }

  return (
    <pre className="h-full overflow-auto bg-[var(--os-bg-0)] p-4 text-xs text-[var(--os-text-0)]">
      {data ?? ""}
    </pre>
  )
}
