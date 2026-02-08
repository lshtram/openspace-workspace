import { useEffect, useRef, useState } from "react"
import { Terminal as XTerm } from "xterm"
import { FitAddon } from "xterm-addon-fit"
import { WebLinksAddon } from "xterm-addon-web-links"
import { openCodeService } from "../services/OpenCodeClient"
import { useServer } from "../context/ServerContext"

type TerminalState = {
  ready: boolean
  error?: string
}

export const TERMINAL_PTY_TITLE = "openspace-client-terminal"

type ActivePtyRegistration = {
  ptyID: string
  directory: string
  baseUrl: string
}

const activeTerminalPtys = new Map<string, ActivePtyRegistration>()
let cleanupListenersBound = false

const getTerminalTheme = () => {
  const styles = getComputedStyle(document.documentElement)
  const background = styles.getPropertyValue("--terminal-bg").trim() || "#151312"
  const foreground = styles.getPropertyValue("--terminal-fg").trim() || "#f6f3ef"
  return { background, foreground }
}

const buildPtyDeleteUrl = ({ ptyID, directory, baseUrl }: ActivePtyRegistration) => {
  const url = new URL(`${baseUrl}/pty/${ptyID}`)
  url.searchParams.set("directory", directory)
  return url.toString()
}

const sendKeepaliveDelete = (registration: ActivePtyRegistration) => {
  if (typeof fetch !== "function") return
  try {
    void fetch(buildPtyDeleteUrl(registration), {
      method: "DELETE",
      keepalive: true,
    }).catch(() => {
      // Best effort cleanup only.
    })
  } catch {
    // Best effort cleanup only.
  }
}

const flushActiveTerminalPtys = () => {
  for (const registration of activeTerminalPtys.values()) {
    sendKeepaliveDelete(registration)
  }
  activeTerminalPtys.clear()
}

const ensureCleanupListeners = () => {
  if (cleanupListenersBound || typeof window === "undefined") return

  const onBeforeUnload = () => {
    flushActiveTerminalPtys()
  }

  const onPageHide = (event: PageTransitionEvent) => {
    if (event.persisted) return
    flushActiveTerminalPtys()
  }

  window.addEventListener("beforeunload", onBeforeUnload)
  window.addEventListener("pagehide", onPageHide)
  cleanupListenersBound = true
}

export function useTerminal(resizeTrigger?: number, directoryProp?: string) {
  const server = useServer()
  const directory = directoryProp ?? openCodeService.directory
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [state, setState] = useState<TerminalState>({ ready: false })
  const fitRef = useRef<FitAddon | null>(null)

  useEffect(() => {
    if (fitRef.current && state.ready) {
      fitRef.current.fit()
    }
  }, [resizeTrigger, state.ready])

  useEffect(() => {
    ensureCleanupListeners()

    let disposed = false
    let socket: WebSocket | undefined
    let term: XTerm | undefined
    let fit: FitAddon | undefined
    let resizeCleanup: (() => void) | undefined
    let activePtyID: string | null = null

    const removePty = async (useKeepalive = false) => {
      if (!activePtyID) return
      const ptyID = activePtyID
      activePtyID = null
      const registration =
        activeTerminalPtys.get(ptyID) ?? {
          ptyID,
          directory,
          baseUrl: openCodeService.baseUrl,
        }
      activeTerminalPtys.delete(ptyID)
      if (useKeepalive) {
        sendKeepaliveDelete(registration)
      }
      try {
        await openCodeService.pty.remove({ ptyID, directory: registration.directory })
      } catch {
        // Best effort: fallback to keepalive delete if API client call fails.
        sendKeepaliveDelete(registration)
      }
    }

    const connect = async () => {
      setState({ ready: false })

      const ptyResponse = await openCodeService.pty.create({
        directory,
        title: TERMINAL_PTY_TITLE,
      })
      const pty = ptyResponse.data
      if (!pty) return
      activePtyID = pty.id
      activeTerminalPtys.set(pty.id, {
        ptyID: pty.id,
        directory,
        baseUrl: openCodeService.baseUrl,
      })
      if (disposed) {
        await removePty()
        return
      }

      const url = new URL(`${openCodeService.baseUrl}/pty/${pty.id}/connect`)
      url.searchParams.set("directory", directory)
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
      if (!container) {
        await removePty()
        return
      }
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
          directory,
        })
      })
      socket.addEventListener("close", () => {
        if (disposed) return
        setState({ ready: false, error: "Terminal disconnected" })
        void removePty()
      })
      socket.addEventListener("error", () => {
        if (disposed) return
        setState({ ready: false, error: "Terminal connection failed" })
        void removePty()
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
          directory,
        })
      })

      const handleResize = () => fitAddon.fit()
      window.addEventListener("resize", handleResize)
      resizeCleanup = () => window.removeEventListener("resize", handleResize)
    }

    void connect().catch((err) => {
      if (disposed) return
      setState({ ready: false, error: err instanceof Error ? err.message : "Terminal init failed" })
      void removePty()
    })

    return () => {
      disposed = true
      socket?.close()
      term?.dispose()
      fit?.dispose()
      fitRef.current = null
      resizeCleanup?.()
      void removePty()
    }
  }, [server.activeUrl, directory])

  return { containerRef, state }
}
