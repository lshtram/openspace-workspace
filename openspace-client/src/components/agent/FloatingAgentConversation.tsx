import { useEffect, useMemo, useRef } from "react"
import { Minimize2, Maximize2, MessageCircle, MessageSquareText, Mic, Paperclip } from "lucide-react"
import { AgentConsole } from "../AgentConsole"
import type { AgentConversationState, AgentFloatingRect } from "../../context/LayoutContext"
import { LAYER_FLOATING_AGENT } from "../../constants/layers"

type FloatingAgentConversationProps = {
  sessionId?: string
  directory: string
  state: AgentConversationState
  setState: (next: AgentConversationState) => void
  activePaneId: string
  resolveDockPaneId?: () => string | undefined
  onOpenContent?: (path: string) => void
}

type ResizeDirection = {
  x: -1 | 0 | 1
  y: -1 | 0 | 1
}

function SpeakingIndicator({ speaker = "assistant", active = false }: { speaker?: "assistant" | "user"; active?: boolean }) {
  const tone = speaker === "assistant" ? "bg-[#2e6b6a]" : "bg-[#5b4bb7]"
  return (
    <span className="inline-flex items-end gap-[2px]" aria-hidden="true" data-testid="speaking-indicator" data-speaker={speaker}>
      <span className={`h-1.5 w-1 rounded-full ${tone} ${active ? "animate-pulse" : "opacity-60"}`} />
      <span className={`h-2.5 w-1 rounded-full ${tone} ${active ? "animate-pulse [animation-delay:120ms]" : "opacity-80"}`} />
      <span className={`h-1.5 w-1 rounded-full ${tone} ${active ? "animate-pulse [animation-delay:240ms]" : "opacity-60"}`} />
    </span>
  )
}

function clampPosition(x: number, y: number, width: number, height: number) {
  const viewportWidth = Math.max(window.innerWidth, 1)
  const viewportHeight = Math.max(window.innerHeight, 1)
  const minX = Math.min(100, (width / viewportWidth) * 100)
  const minY = Math.min(100, (height / viewportHeight) * 100)
  return {
    x: Math.max(minX, Math.min(100, x)),
    y: Math.max(minY, Math.min(100, y)),
  }
}

function clampDimensions(width: number, height: number) {
  const minWidth = 340
  const minHeight = 300
  const maxWidth = Math.min(1200, window.innerWidth * 0.92)
  const maxHeight = Math.min(760, window.innerHeight * 0.9)
  return {
    width: Math.max(minWidth, Math.min(maxWidth, width)),
    height: Math.max(minHeight, Math.min(maxHeight, height)),
  }
}

export function FloatingAgentConversation({
  sessionId,
  directory,
  state,
  setState,
  activePaneId,
  resolveDockPaneId,
  onOpenContent,
}: FloatingAgentConversationProps) {
  const dragRef = useRef<{ startX: number; startY: number; baseX: number; baseY: number } | null>(null)
  const resizeRef = useRef<{
    startX: number
    startY: number
    width: number
    height: number
    baseX: number
    baseY: number
    direction: ResizeDirection
  } | null>(null)

  useEffect(() => {
    const onEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return
      setState({ ...state, size: "minimal" })
    }

    window.addEventListener("keydown", onEscape)
    return () => window.removeEventListener("keydown", onEscape)
  }, [setState, state])

  const positionStyle = useMemo(() => ({
    left: `${state.position.x}%`,
    top: `${state.position.y}%`,
    transform: "translate(-100%, -100%)",
  }), [state.position.x, state.position.y])

  const saveFloatingRect = (): AgentFloatingRect => ({
    size: state.size === "full" ? "full" : "expanded",
    position: state.position,
    dimensions: state.dimensions,
  })

  const dockToPane = () => {
    const nextDockedPaneId = resolveDockPaneId?.() ?? activePaneId ?? "pane-root"
    setState({
      ...state,
      mode: "docked-pane",
      dockedPaneId: nextDockedPaneId,
      lastFloatingRect: saveFloatingRect(),
    })
  }

  const onStartDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (state.size !== "expanded") return
    dragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      baseX: state.position.x,
      baseY: state.position.y,
    }

    const onMove = (moveEvent: PointerEvent) => {
      const current = dragRef.current
      if (!current) return
      const next = clampPosition(
        current.baseX + (moveEvent.clientX - current.startX) / window.innerWidth * 100,
        current.baseY + (moveEvent.clientY - current.startY) / window.innerHeight * 100,
        state.dimensions.width,
        state.dimensions.height,
      )
      setState({ ...state, position: next })
    }

    const onUp = () => {
      dragRef.current = null
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
    }

    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
  }

  const onStartResize = (event: React.PointerEvent<HTMLDivElement>, direction: ResizeDirection) => {
    if (state.size !== "expanded") return
    event.preventDefault()
    event.stopPropagation()

    resizeRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      width: state.dimensions.width,
      height: state.dimensions.height,
      baseX: state.position.x,
      baseY: state.position.y,
      direction,
    }

    const onMove = (moveEvent: PointerEvent) => {
      const current = resizeRef.current
      if (!current) return
      const dx = moveEvent.clientX - current.startX
      const dy = moveEvent.clientY - current.startY
      const unboundedWidth = current.width + (current.direction.x === -1 ? -dx : current.direction.x === 1 ? dx : 0)
      const unboundedHeight = current.height + (current.direction.y === -1 ? -dy : current.direction.y === 1 ? dy : 0)
      const nextDimensions = clampDimensions(unboundedWidth, unboundedHeight)

      const appliedDx = current.direction.x === 1 ? nextDimensions.width - current.width : 0
      const appliedDy = current.direction.y === 1 ? nextDimensions.height - current.height : 0
      const nextPosition = clampPosition(
        current.baseX + (appliedDx / window.innerWidth) * 100,
        current.baseY + (appliedDy / window.innerHeight) * 100,
        nextDimensions.width,
        nextDimensions.height,
      )

      setState({ ...state, position: nextPosition, dimensions: nextDimensions })
    }

    const onUp = () => {
      resizeRef.current = null
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
    }

    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
  }

  if (!state.visible) return null
  if (state.mode === "docked-pane") return null

  if (state.size === "minimal") {
    return (
      <div data-testid="floating-agent-layer" className="fixed" style={{ ...positionStyle, zIndex: LAYER_FLOATING_AGENT }}>
        <button
          type="button"
          aria-label="Open agent conversation"
          className="flex h-11 items-center gap-2 rounded-2xl border border-[var(--os-line)] bg-[var(--os-bg-2)] px-3 text-[var(--os-text-0)] shadow-lg"
          onClick={() => setState({ ...state, size: "expanded" })}
        >
          <MessageCircle className="h-4 w-4" />
          <span className="max-w-[124px] truncate text-[11px] font-medium text-[var(--os-text-1)]">
            Monitoring this session
          </span>
          <span title="Conversation mode" className="flex h-5 w-5 items-center justify-center rounded-md bg-[var(--os-bg-1)] text-[var(--os-text-1)]">
            <MessageSquareText className="h-3 w-3" />
          </span>
          <SpeakingIndicator speaker="assistant" active={false} />
          <span title="Microphone">
            <Mic className="h-3 w-3 text-[var(--os-text-1)]" />
          </span>
          <span title="Attach file">
            <Paperclip className="h-3 w-3 text-[var(--os-text-1)]" />
          </span>
        </button>
      </div>
    )
  }

  if (state.size === "full") {
    return (
      <div data-testid="floating-agent-layer" className="fixed inset-0 flex items-center justify-center bg-black/40" style={{ zIndex: LAYER_FLOATING_AGENT }}>
        <div className="flex h-[90vh] w-[min(80vw,1200px)] flex-col overflow-hidden rounded-xl border border-[var(--os-line)] bg-[var(--os-bg-1)] shadow-2xl">
          <div className="flex h-9 items-center justify-between border-b border-[var(--os-line)] bg-[rgba(24,24,24,0.52)] px-2.5 text-[13px] text-white backdrop-blur-md">
            <span className="text-sm font-semibold tracking-[0.01em]">Agent</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Grab pane"
                className="rounded px-2 py-0.5 text-[11px] text-white/85 hover:bg-black/20"
                onClick={dockToPane}
              >
                Grab Pane
              </button>
              <button
                type="button"
                aria-label="Collapse conversation"
                className="rounded p-1 text-white/90 hover:bg-black/20"
                onClick={() => setState({ ...state, size: "expanded" })}
              >
                <Minimize2 className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-hidden">
            <AgentConsole sessionId={sessionId} directory={directory} onOpenContent={onOpenContent} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div data-testid="floating-agent-layer" className="fixed" style={{ ...positionStyle, zIndex: LAYER_FLOATING_AGENT }}>
      <div
        className="relative flex flex-col overflow-hidden rounded-xl border border-[var(--os-line)] bg-[var(--os-bg-1)] shadow-2xl"
        style={{ width: state.dimensions.width, height: state.dimensions.height }}
      >
        <div
          className="flex h-9 cursor-move items-center justify-between border-b border-[var(--os-line)] bg-[rgba(24,24,24,0.52)] px-2.5 text-[13px] text-white backdrop-blur-md"
          onPointerDown={onStartDrag}
        >
          <span className="text-sm font-semibold tracking-[0.01em]">Agent</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Grab pane"
              className="rounded px-2 py-0.5 text-[11px] text-white/85 hover:bg-black/20"
              onClick={dockToPane}
            >
              Grab Pane
            </button>
            <button
              type="button"
              aria-label="Expand conversation"
              className="rounded p-1 text-white/90 hover:bg-black/20"
              onClick={() => setState({ ...state, size: "full" })}
            >
              <Maximize2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Minimize conversation"
              className="rounded p-1 text-white/90 hover:bg-black/20"
              onClick={() => setState({ ...state, size: "minimal" })}
            >
              <Minimize2 className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">
          <AgentConsole sessionId={sessionId} directory={directory} onOpenContent={onOpenContent} />
        </div>
        <div role="presentation" data-testid="floating-resize-handle-right" className="absolute right-0 top-2 h-[calc(100%-16px)] w-2 cursor-e-resize" onPointerDown={(event) => onStartResize(event, { x: 1, y: 0 })} />
        <div role="presentation" data-testid="floating-resize-handle-left" className="absolute left-0 top-2 h-[calc(100%-16px)] w-2 cursor-w-resize" onPointerDown={(event) => onStartResize(event, { x: -1, y: 0 })} />
        <div role="presentation" data-testid="floating-resize-handle-bottom" className="absolute bottom-0 left-2 h-2 w-[calc(100%-16px)] cursor-s-resize" onPointerDown={(event) => onStartResize(event, { x: 0, y: 1 })} />
        <div role="presentation" data-testid="floating-resize-handle-top" className="absolute left-2 top-0 h-2 w-[calc(100%-16px)] cursor-n-resize" onPointerDown={(event) => onStartResize(event, { x: 0, y: -1 })} />
        <div role="presentation" data-testid="floating-resize-handle-bottom-right" className="absolute bottom-0 right-0 h-3 w-3 cursor-se-resize" onPointerDown={(event) => onStartResize(event, { x: 1, y: 1 })} />
        <div role="presentation" data-testid="floating-resize-handle-bottom-left" className="absolute bottom-0 left-0 h-3 w-3 cursor-sw-resize" onPointerDown={(event) => onStartResize(event, { x: -1, y: 1 })} />
        <div role="presentation" data-testid="floating-resize-handle-top-right" className="absolute right-0 top-0 h-3 w-3 cursor-ne-resize" onPointerDown={(event) => onStartResize(event, { x: 1, y: -1 })} />
        <div role="presentation" data-testid="floating-resize-handle-top-left" className="absolute left-0 top-0 h-3 w-3 cursor-nw-resize" onPointerDown={(event) => onStartResize(event, { x: -1, y: -1 })} />
      </div>
    </div>
  )
}
