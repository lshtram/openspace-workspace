import { useState, useEffect, useRef, useCallback } from "react"
import { usePane } from "../context/PaneContext"
import { findPaneForContent } from "../components/pane/utils/treeOps"
import type { SpaceType, ContentSpec } from "../components/pane/types"

const HUB_URL = import.meta.env.VITE_HUB_URL || "http://localhost:3001"

const now = () => new Date().toISOString()

// ============================================================================
// Types
// ============================================================================

interface PaneCommandEvent {
  type: "PANE_COMMAND"
  command: string
  payload: Record<string, unknown>
  commandId: string
  actor: "agent"
  ts: string
}

export interface UseAgentCommandsResult {
  connected: boolean
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useAgentCommands(): UseAgentCommandsResult {
  const [connected, setConnected] = useState(false)
  const pane = usePane()
  const paneRef = useRef(pane)

  useEffect(() => {
    paneRef.current = pane
  }, [pane])

  const dispatchCommand = useCallback((event: PaneCommandEvent) => {
    const { command, payload, commandId } = event
    const p = paneRef.current

    console.log(`[useAgentCommands] dispatch`, { command, commandId, ts: now() })

    switch (command) {
      case "pane.open": {
        const spec: ContentSpec = {
          type: (payload.type as SpaceType) ?? "editor",
          title: (payload.title as string) ?? "Untitled",
          contentId: payload.contentId as string | undefined,
          targetPaneId: payload.targetPaneId as string | undefined,
        }

        if (payload.newPane && payload.splitDirection) {
          p.splitPane(p.layout.activePaneId, payload.splitDirection as "horizontal" | "vertical")
        }

        p.openContent(spec)
        break
      }

      case "pane.close": {
        if (payload.paneId) {
          p.closePane(payload.paneId as string)
        } else if (payload.contentId) {
          const foundPane = findPaneForContent(p.layout.root, payload.contentId as string)
          if (foundPane) {
            const tab = foundPane.tabs.find((t) => t.contentId === payload.contentId)
            if (tab) {
              p.closeTab(foundPane.id, tab.id)
            }
          }
        }
        break
      }

      case "pane.focus": {
        if (payload.paneId) {
          p.setActivePane(payload.paneId as string)
        } else if (payload.contentId) {
          const foundPane = findPaneForContent(p.layout.root, payload.contentId as string)
          if (foundPane) {
            p.setActivePane(foundPane.id)
          }
        }
        break
      }

      case "editor.open": {
        const path = payload.path as string
        if (!path) break
        const filename = path.split("/").filter(Boolean).at(-1) ?? path
        p.openContent({
          type: "editor",
          title: filename,
          contentId: path,
        })
        break
      }

      case "editor.close": {
        const path = payload.path as string
        if (!path) break
        const foundPane = findPaneForContent(p.layout.root, path)
        if (foundPane) {
          const tab = foundPane.tabs.find((t) => t.contentId === path)
          if (tab) {
            p.closeTab(foundPane.id, tab.id)
          }
        }
        break
      }

      case "presentation.open": {
        const name = (payload.name as string) ?? "Presentation"
        const path = payload.path as string | undefined
        p.openContent({
          type: "presentation",
          title: name,
          contentId: path,
        })
        break
      }

      case "presentation.navigate": {
        const detail = {
          slideIndex: payload.slideIndex as number,
          name: payload.name as string | undefined,
        }
        window.dispatchEvent(
          new CustomEvent("agent:presentation:navigate", { detail }),
        )
        break
      }

      default: {
        console.warn(`[useAgentCommands] Unknown command: ${command}`, { commandId, ts: now() })
        break
      }
    }
  }, [])

  useEffect(() => {
    console.log(`[useAgentCommands] SSE connect start`, { url: `${HUB_URL}/events`, ts: now() })
    const eventSource = new EventSource(`${HUB_URL}/events`)

    eventSource.onopen = () => {
      console.log(`[useAgentCommands] SSE connected`, { ts: now() })
      setConnected(true)
    }

    eventSource.onerror = () => {
      console.error(`[useAgentCommands] SSE error`, { ts: now() })
      setConnected(false)
    }

    eventSource.onmessage = (event) => {
      try {
        if (event.data === ": heartbeat") return

        const parsed = JSON.parse(event.data) as { type: string }
        if (parsed.type !== "PANE_COMMAND") return

        dispatchCommand(parsed as PaneCommandEvent)
      } catch (err) {
        console.error(`[useAgentCommands] Failed to parse SSE event`, {
          error: err instanceof Error ? err.message : String(err),
          ts: now(),
        })
      }
    }

    return () => {
      eventSource.close()
    }
  }, [dispatchCommand])

  return { connected }
}
