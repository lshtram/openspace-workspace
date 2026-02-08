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

const TERMINAL_PTY_CLIENT_ID_KEY = "openspace.terminal-client-id"
const TERMINAL_PTY_TITLE_PREFIX = "openspace-client-terminal"
const LEGACY_TERMINAL_PTY_TITLE = TERMINAL_PTY_TITLE_PREFIX

type ActivePtyRegistration = {
  key: string
  ptyID: string
  directory: string
  baseUrl: string
  ownerID: string
  remove: (input: { ptyID: string; directory: string }) => Promise<unknown>
}

const activeTerminalPtys = new Map<string, ActivePtyRegistration>()
const pendingPtyRemovals = new Map<string, Promise<void>>()
let cleanupListenersBound = false
let terminalOwnerCounter = 0

function getTerminalClientID() {
  if (typeof window === "undefined") return "server"
  try {
    const existing = window.sessionStorage.getItem(TERMINAL_PTY_CLIENT_ID_KEY)
    if (existing) return existing
    const next =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`
    window.sessionStorage.setItem(TERMINAL_PTY_CLIENT_ID_KEY, next)
    return next
  } catch {
    return "unknown"
  }
}

export const TERMINAL_PTY_TITLE = `${TERMINAL_PTY_TITLE_PREFIX}:${getTerminalClientID()}`

const registrationKey = (baseUrl: string, ptyID: string) => `${baseUrl}::${ptyID}`
const isManagedTerminalTitle = (title: string) =>
  title === TERMINAL_PTY_TITLE || title === LEGACY_TERMINAL_PTY_TITLE

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

const removeTrackedPty = async (registration: ActivePtyRegistration, useKeepalive = false) => {
  const existing = pendingPtyRemovals.get(registration.key)
  if (existing) return existing

  const removal = (async () => {
    activeTerminalPtys.delete(registration.key)
    if (useKeepalive) {
      sendKeepaliveDelete(registration)
      return
    }
    try {
      await registration.remove({
        ptyID: registration.ptyID,
        directory: registration.directory,
      })
    } catch {
      // Best effort fallback if SDK deletion fails.
      sendKeepaliveDelete(registration)
    }
  })().finally(() => {
    pendingPtyRemovals.delete(registration.key)
  })

  pendingPtyRemovals.set(registration.key, removal)
  return removal
}

const cleanupStaleTerminalPtys = async (params: {
  baseUrl: string
  directory: string
  list: (input: { directory: string }) => Promise<{ data?: Array<{ id: string; title: string }> }>
  remove: (input: { ptyID: string; directory: string }) => Promise<unknown>
}) => {
  try {
    const response = await params.list({ directory: params.directory })
    const entries = response.data ?? []

    await Promise.all(
      entries.map(async (entry) => {
        if (!entry?.id || !isManagedTerminalTitle(entry.title)) return
        const key = registrationKey(params.baseUrl, entry.id)
        if (activeTerminalPtys.has(key)) return
        try {
          await params.remove({ ptyID: entry.id, directory: params.directory })
        } catch {
          // Best effort cleanup only.
        }
      }),
    )
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
    let dataCleanup: (() => void) | undefined
    let resizePtyCleanup: (() => void) | undefined
    let activePtyKey: string | null = null
    const ownerID = `terminal-owner-${terminalOwnerCounter++}`
    const baseUrl = server.activeUrl
    const ptyApi = openCodeService.pty

    const removePty = async (useKeepalive = false) => {
      if (!activePtyKey) return
      const key = activePtyKey
      activePtyKey = null
      const registration = activeTerminalPtys.get(key)
      if (!registration) return
      if (registration.ownerID !== ownerID) return
      await removeTrackedPty(registration, useKeepalive)
    }

    const connect = async () => {
      setState({ ready: false })

      await cleanupStaleTerminalPtys({
        baseUrl,
        directory,
        list: ({ directory: listDirectory }) => ptyApi.list({ directory: listDirectory }),
        remove: ({ ptyID, directory: removeDirectory }) => ptyApi.remove({ ptyID, directory: removeDirectory }),
      })

      const ptyResponse = await ptyApi.create({
        directory,
        title: TERMINAL_PTY_TITLE,
      })
      const pty = ptyResponse.data
      if (!pty) return
      const key = registrationKey(baseUrl, pty.id)
      activePtyKey = key
      activeTerminalPtys.set(key, {
        key,
        ptyID: pty.id,
        directory,
        baseUrl,
        ownerID,
        remove: ({ ptyID, directory: removeDirectory }) =>
          ptyApi.remove({
            ptyID,
            directory: removeDirectory,
          }),
      })
      if (disposed) {
        await removePty()
        return
      }

      const url = new URL(`${baseUrl}/pty/${pty.id}/connect`)
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
        void ptyApi.update({
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

      const dataSubscription = xterm.onData((data) => {
        if (socket?.readyState === WebSocket.OPEN) {
          socket.send(data)
        }
      })
      dataCleanup = () => dataSubscription.dispose()

      const resizeSubscription = xterm.onResize(({ cols, rows }) => {
        void ptyApi.update({
          ptyID: pty.id,
          size: { cols, rows },
          directory,
        })
      })
      resizePtyCleanup = () => resizeSubscription.dispose()

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
      dataCleanup?.()
      resizePtyCleanup?.()
      term?.dispose()
      fit?.dispose()
      fitRef.current = null
      resizeCleanup?.()
      void removePty()
    }
  }, [server.activeUrl, directory])

  return { containerRef, state }
}
