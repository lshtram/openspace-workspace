import "xterm/css/xterm.css"
import { useTerminal } from "../hooks/useTerminal"

type TerminalProps = {
  resizeTrigger?: number
  directory?: string
}

export function Terminal({ resizeTrigger, directory }: TerminalProps) {
  const { containerRef, state } = useTerminal(resizeTrigger, directory)

  return (
    <div data-component="terminal" className="panel-muted h-full w-full rounded-3xl p-3">
      <div className="relative h-full w-full rounded-2xl bg-[var(--terminal-bg)] text-[var(--terminal-fg)]">
        <div ref={containerRef} className="h-full w-full" />
        {!state.ready && (
          <div className="absolute inset-x-0 bottom-4 text-center text-xs text-white/70">
            {state.error ?? "starting terminal..."}
          </div>
        )}
      </div>
    </div>
  )
}
