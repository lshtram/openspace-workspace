import { usePane } from "../../context/PaneContext"

type EmptyPaneProps = {
  paneId: string
}

export function EmptyPane({ paneId }: EmptyPaneProps) {
  const pane = usePane()

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 bg-[var(--os-bg-0)] text-[var(--os-text-1)]">
      <div className="text-sm">Select content to open</div>
      <div className="flex gap-2">
        <button
          type="button"
          className="rounded border border-[var(--os-line)] px-3 py-1 text-xs hover:bg-[var(--os-bg-1)]"
          onClick={() =>
            pane.openContent({
              type: "whiteboard",
              title: "Untitled Whiteboard",
              contentId: "design/untitled.graph.mmd",
              targetPaneId: paneId,
            })
          }
        >
          Open Whiteboard
        </button>
        <button
          type="button"
          className="rounded border border-[var(--os-line)] px-3 py-1 text-xs hover:bg-[var(--os-bg-1)]"
          onClick={() =>
            pane.openContent({
              type: "editor",
              title: "Untitled Editor",
              contentId: `scratch/pane-${paneId}.md`,
              targetPaneId: paneId,
            })
          }
        >
          Open Editor
        </button>
        <button
          type="button"
          className="rounded border border-[var(--os-line)] px-3 py-1 text-xs hover:bg-[var(--os-bg-1)]"
          onClick={() =>
            pane.openContent({
              type: "presentation",
              title: "Untitled Presentation",
              contentId: `design/pane-${paneId}.deck.md`,
              targetPaneId: paneId,
            })
          }
        >
          Open Presentation
        </button>
        <button
          type="button"
          className="rounded border border-[var(--os-line)] px-3 py-1 text-xs hover:bg-[var(--os-bg-1)]"
          onClick={() => pane.splitPane(paneId, "horizontal")}
        >
          Split to Add Pane
        </button>
      </div>
    </div>
  )
}
