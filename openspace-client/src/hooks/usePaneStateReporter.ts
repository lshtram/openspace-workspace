import { useEffect, useRef } from "react"
import { usePane } from "../context/PaneContext"

const HUB_URL = import.meta.env.VITE_HUB_URL || "http://localhost:3001"

const now = () => new Date().toISOString()

const DEBOUNCE_MS = 500

/**
 * Reports the current pane layout to the Hub server whenever it changes.
 * The Hub stores this state so the MCP agent can query it via `pane.list`.
 */
export function usePaneStateReporter(): void {
  const { layout } = usePane()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastJsonRef = useRef<string>("")

  useEffect(() => {
    const serialized = JSON.stringify(layout)

    // Skip if nothing changed
    if (serialized === lastJsonRef.current) return

    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      lastJsonRef.current = serialized
      console.log(`[usePaneStateReporter] Reporting pane state`, { ts: now() })

      fetch(`${HUB_URL}/panes/state`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: serialized,
      })
        .then((res) => {
          if (!res.ok) {
            console.error(`[usePaneStateReporter] Failed to report pane state`, {
              status: res.status,
              ts: now(),
            })
          } else {
            console.log(`[usePaneStateReporter] Pane state reported`, { ts: now() })
          }
        })
        .catch((err) => {
          console.error(`[usePaneStateReporter] Network error`, {
            error: err instanceof Error ? err.message : String(err),
            ts: now(),
          })
        })
    }, DEBOUNCE_MS)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [layout])
}
