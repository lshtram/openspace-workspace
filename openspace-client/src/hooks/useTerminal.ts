import { useEffect, useRef, useState } from "react"
import { Terminal as XTerm } from "xterm"
import { FitAddon } from "xterm-addon-fit"
import { WebLinksAddon } from "xterm-addon-web-links"
import { openCodeService } from "../services/OpenCodeClient"

type TerminalState = {
  ready: boolean
  error?: string
}

const getTerminalTheme = () => {
  const styles = getComputedStyle(document.documentElement)
  const background = styles.getPropertyValue("--terminal-bg").trim() || "#151312"
  const foreground = styles.getPropertyValue("--terminal-fg").trim() || "#f6f3ef"
  return { background, foreground }
}

export function useTerminal(resizeTrigger?: number) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [state, setState] = useState<TerminalState>({ ready: false })
  const fitRef = useRef<FitAddon | null>(null)

  useEffect(() => {
    if (fitRef.current && state.ready) {
      fitRef.current.fit()
    }
  }, [resizeTrigger, state.ready])

  useEffect(() => {
    let disposed = false
    let socket: WebSocket | undefined
    let term: XTerm | undefined
    let fit: FitAddon | undefined
    let resizeCleanup: (() => void) | undefined

    const connect = async () => {
      const ptyResponse = await openCodeService.pty.create({
        directory: openCodeService.directory,
      })
      const pty = ptyResponse.data
      if (!pty || disposed) return

      const url = new URL(`${openCodeService.baseUrl}/pty/${pty.id}/connect`)
      url.searchParams.set("directory", openCodeService.directory)
      url.protocol = url.protocol === "https:" ? "wss:" : "ws:"

      const xterm = new XTerm({
        cursorBlink: true,
        fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, monospace",
        fontSize: 13,
        theme: getTerminalTheme(),
      })
      const fitAddon = new FitAddon()
      xterm.loadAddon(fitAddon)
      xterm.loadAddon(new WebLinksAddon())
      term = xterm
      fit = fitAddon
      fitRef.current = fitAddon

      const container = containerRef.current
      if (!container) return
      xterm.open(container)
      fitAddon.fit()
      setState({ ready: true })

      socket = new WebSocket(url)
      socket.addEventListener("message", (event) => {
        xterm.write(event.data)
      })
      socket.addEventListener("open", () => {
        void openCodeService.pty.update({
          ptyID: pty.id,
          size: { cols: xterm.cols, rows: xterm.rows },
          directory: openCodeService.directory,
        })
      })
      socket.addEventListener("close", () => {
        if (disposed) return
        setState({ ready: false, error: "Terminal disconnected" })
      })
      socket.addEventListener("error", () => {
        if (disposed) return
        setState({ ready: false, error: "Terminal connection failed" })
      })

      xterm.onData((data) => {
        if (socket?.readyState === WebSocket.OPEN) {
          socket.send(data)
        }
      })

      xterm.onResize(({ cols, rows }) => {
        void openCodeService.pty.update({
          ptyID: pty.id,
          size: { cols, rows },
          directory: openCodeService.directory,
        })
      })

      const handleResize = () => fitAddon.fit()
      window.addEventListener("resize", handleResize)
      resizeCleanup = () => window.removeEventListener("resize", handleResize)
    }

    void connect().catch((err) => {
      if (disposed) return
      setState({ ready: false, error: err instanceof Error ? err.message : "Terminal init failed" })
    })

    return () => {
      disposed = true
      socket?.close()
      term?.dispose()
      fit?.dispose()
      fitRef.current = null
      resizeCleanup?.()
    }
  }, [])

  return { containerRef, state }
}
