import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from "react"
import { MIN_PANE_HEIGHT, MIN_PANE_WIDTH, type SplitDirection } from "./types"
import { usePane } from "../../context/PaneContext"

type SplitterProps = {
  splitId: string
  direction: SplitDirection
  splitRatio: number
}

export function Splitter({ splitId, direction, splitRatio }: SplitterProps) {
  const { resizeSplit } = usePane()
  const splitterRef = useRef<HTMLDivElement>(null)
  const containerSizeRef = useRef(1)

  useEffect(() => {
    const splitRoot = splitterRef.current?.closest(`[data-split-root='${splitId}']`) as HTMLElement | null
    if (!splitRoot) return

    containerSizeRef.current = Math.max(1, direction === "horizontal" ? splitRoot.clientWidth : splitRoot.clientHeight)

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      containerSizeRef.current = Math.max(1, direction === "horizontal" ? entry.contentRect.width : entry.contentRect.height)
    })

    observer.observe(splitRoot)
    return () => observer.disconnect()
  }, [direction, splitId])

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault()
    const start = direction === "horizontal" ? event.clientX : event.clientY
    const startRatio = splitRatio

    const onMove = (moveEvent: PointerEvent) => {
      const current = direction === "horizontal" ? moveEvent.clientX : moveEvent.clientY
      const delta = current - start
      const container = containerSizeRef.current
      const minSize = direction === "horizontal" ? MIN_PANE_WIDTH : MIN_PANE_HEIGHT
      const minRatio = Math.min(0.45, minSize / container)
      const maxRatio = Math.max(0.55, 1 - minRatio)
      const ratio = Math.max(minRatio, Math.min(maxRatio, startRatio + delta / container))
      resizeSplit(splitId, ratio)
    }

    const onUp = () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
    }

    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
  }

  return (
    <div
      ref={splitterRef}
      onPointerDown={onPointerDown}
      className={
        direction === "horizontal"
          ? "group relative w-2 cursor-col-resize bg-transparent"
          : "group relative h-2 cursor-row-resize bg-transparent"
      }
    >
      <span
        data-testid={`pane-seam-${splitId}`}
        aria-hidden="true"
        className={
          direction === "horizontal"
            ? "absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-[var(--os-line-strong,#8d8579)] transition-colors group-hover:bg-[var(--os-accent,#5e5ce6)]"
            : "absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-[var(--os-line-strong,#8d8579)] transition-colors group-hover:bg-[var(--os-accent,#5e5ce6)]"
        }
      />
    </div>
  )
}
