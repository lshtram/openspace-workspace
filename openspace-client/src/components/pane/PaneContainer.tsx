import { PanelBottom, PanelRight, X } from "lucide-react"
import { usePane } from "../../context/PaneContext"
import { AgentConsole } from "../AgentConsole"
import { ContentErrorBoundary } from "./content/ContentErrorBoundary"
import { EmptyPane } from "./EmptyPane"
import { renderPaneContent } from "./ContentRendererRegistry"
import { Splitter } from "./Splitter"
import type { LeafPaneNode, PaneNode } from "./types"
import { findPaneById } from "./utils/treeOps"

type PaneContainerProps = {
  sessionId?: string
  directory: string
  dockedAgentPaneId?: string
  onUndockAgent?: () => void
}

function LeafPane({
  node,
  isActive,
  sessionId,
  directory,
  dockedAgentPaneId,
  onUndockAgent,
}: {
  node: LeafPaneNode
  isActive: boolean
  sessionId?: string
  directory: string
  dockedAgentPaneId?: string
  onUndockAgent?: () => void
}) {
  const pane = usePane()
  const agentDockedHere = dockedAgentPaneId === node.id

  return (
    <div className="flex h-full flex-col">
      <div
        data-testid={`pane-header-${node.id}`}
        className={`relative flex h-8 items-center border-b px-2 ${
          isActive
            ? "border-[var(--os-line-strong,#8d8579)] bg-[var(--os-bg-2,#f3efe7)] text-[var(--os-text-0,#1d1a17)] shadow-[inset_0_-2px_0_var(--os-accent,#5e5ce6)]"
            : "border-[var(--os-line,#d5d0c7)] bg-[var(--os-bg-1,#fcfbf9)] text-[var(--os-text-1,#7a746c)]"
        }`}
      >
        <button
          type="button"
          aria-label={`Activate pane header ${node.id}`}
          className="absolute inset-0"
          onClick={() => pane.setActivePane(node.id)}
        />
        <span
          aria-hidden="true"
          className={`relative z-10 mr-1 h-2.5 w-2.5 rounded-full ${isActive ? "bg-[var(--os-accent)]" : "bg-[var(--os-line)]"}`}
        />
        <div className="relative z-10 flex min-w-0 flex-1 gap-1 overflow-x-auto">
          {node.tabs.map((tab, index) => (
            <div
              key={tab.id}
              data-testid={`pane-tab-${node.id}-${tab.id}`}
              className={`flex max-w-[200px] items-center gap-1 rounded px-2 py-1 text-xs ${
                index === node.activeTabIndex
                  ? isActive
                    ? "bg-[var(--os-bg-0)] font-semibold text-[var(--os-text-0)]"
                    : "bg-[var(--os-bg-2)] font-medium text-[var(--os-text-1)]"
                  : "text-[var(--os-text-1)] hover:bg-[var(--os-bg-2)]"
              }`}
            >
              <button
                type="button"
                className="min-w-0 flex-1 truncate text-left"
                onClick={() => pane.setActiveTab(node.id, index)}
              >
                {tab.title}
              </button>
              <button
                type="button"
                aria-label={`Close tab ${tab.title}`}
                className="rounded p-0.5 text-[var(--os-text-1)] hover:bg-[var(--os-bg-0)] hover:text-[var(--os-text-0)]"
                onClick={(event) => {
                  event.stopPropagation()
                  pane.closeTab(node.id, tab.id)
                }}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
        <div className="relative z-10 ml-2 flex items-center gap-1">
          <button
            type="button"
            aria-label="Split right"
            className="rounded p-1 text-[var(--os-text-1)] transition-colors hover:bg-[var(--os-bg-2)] hover:text-[var(--os-text-0)]"
            onClick={() => pane.splitPane(node.id, "horizontal")}
          >
            <PanelRight className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            aria-label="Split down"
            className="rounded p-1 text-[var(--os-text-1)] transition-colors hover:bg-[var(--os-bg-2)] hover:text-[var(--os-text-0)]"
            onClick={() => pane.splitPane(node.id, "vertical")}
          >
            <PanelBottom className="h-3.5 w-3.5" />
          </button>
          {pane.getPaneCount() > 1 ? (
            <button
              type="button"
              aria-label="Close pane"
              className="rounded p-1 text-[var(--os-text-1)] transition-colors hover:bg-[var(--os-bg-2)] hover:text-[var(--os-text-0)]"
              onClick={() => pane.closePane(node.id)}
            >
              <X className="h-3 w-3" />
            </button>
          ) : null}
        </div>
      </div>

      <div className="relative min-h-0 flex-1">
        <div data-testid={`pane-content-${node.id}`} className={agentDockedHere ? "hidden" : "h-full"}>
          {node.tabs.length === 0 ? (
            <EmptyPane paneId={node.id} />
          ) : (
            node.tabs.map((tab, index) => {
              const visible = index === node.activeTabIndex
              return (
                <div key={tab.id} className={visible ? "h-full" : "hidden h-full"}>
                  <ContentErrorBoundary>
                    {renderPaneContent({
                      tab,
                      paneId: node.id,
                      isActive: isActive && visible,
                      sessionId,
                      directory,
                      onOpenContent: (path: string) => {
                        pane.openContent({ type: "editor", title: path.split("/").at(-1) ?? path, contentId: path })
                      },
                    })}
                  </ContentErrorBoundary>
                </div>
              )
            })
          )}
        </div>
        {agentDockedHere ? (
          <div data-testid="docked-agent-pane" className="absolute inset-0 flex flex-col bg-[var(--os-bg-1)]">
            <div className="flex h-9 items-center justify-between border-b border-[var(--os-line)] bg-[rgba(24,24,24,0.52)] px-2.5 text-[13px] text-white backdrop-blur-md">
              <span className="text-sm font-semibold tracking-[0.01em]">Agent</span>
              <button
                type="button"
                aria-label="Undock conversation"
                className="rounded px-2 py-0.5 text-[11px] text-white/85 hover:bg-black/20"
                onClick={onUndockAgent}
              >
                Undock
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-hidden">
              <AgentConsole sessionId={sessionId} directory={directory} onOpenContent={(path) => pane.openContent({ type: "editor", title: path.split("/").at(-1) ?? path, contentId: path })} />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function NodeRenderer({
  node,
  sessionId,
  directory,
  dockedAgentPaneId,
  onUndockAgent,
}: {
  node: PaneNode
  sessionId?: string
  directory: string
  dockedAgentPaneId?: string
  onUndockAgent?: () => void
}) {
  const pane = usePane()

  if (node.type === "pane") {
    return (
      <LeafPane
        node={node}
        isActive={pane.layout.activePaneId === node.id}
        sessionId={sessionId}
        directory={directory}
        dockedAgentPaneId={dockedAgentPaneId}
        onUndockAgent={onUndockAgent}
      />
    )
  }

  const isHorizontal = node.direction === "horizontal"
  return (
    <div
      className={`flex h-full w-full ${isHorizontal ? "flex-row" : "flex-col"}`}
      data-split-root={node.id}
    >
      <div style={{ flexBasis: `${node.splitRatio * 100}%` }} className="min-w-0 min-h-0 flex-1">
        <NodeRenderer node={node.children[0]} sessionId={sessionId} directory={directory} dockedAgentPaneId={dockedAgentPaneId} onUndockAgent={onUndockAgent} />
      </div>
      <Splitter splitId={node.id} direction={node.direction} splitRatio={node.splitRatio} />
      <div style={{ flexBasis: `${(1 - node.splitRatio) * 100}%` }} className="min-w-0 min-h-0 flex-1">
        <NodeRenderer node={node.children[1]} sessionId={sessionId} directory={directory} dockedAgentPaneId={dockedAgentPaneId} onUndockAgent={onUndockAgent} />
      </div>
    </div>
  )
}

export function PaneContainer({ sessionId, directory, dockedAgentPaneId, onUndockAgent }: PaneContainerProps) {
  const pane = usePane()
  const resolvedDockedPaneId = dockedAgentPaneId
    ? (findPaneById(pane.layout.root, dockedAgentPaneId)?.id ?? pane.layout.activePaneId)
    : undefined

  return (
    <div className="h-full w-full bg-[var(--os-bg-0)]">
      <NodeRenderer node={pane.layout.root} sessionId={sessionId} directory={directory} dockedAgentPaneId={resolvedDockedPaneId} onUndockAgent={onUndockAgent} />
    </div>
  )
}
