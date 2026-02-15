import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { FileTree } from "./components/FileTree"
import { CommandPalette } from "./components/CommandPalette"
import { ProjectRail, type Project } from "./components/sidebar/ProjectRail"
import { SessionSidebar } from "./components/sidebar/SessionSidebar"
import { TopBar } from "./components/TopBar"
import { ToastHost } from "./components/ToastHost"
import { openCodeService } from "./services/OpenCodeClient"
import { useSessions, sessionsQueryKey } from "./hooks/useSessions"
import { DEFAULT_MESSAGE_LIMIT, fetchMessages, messagesQueryKey } from "./hooks/useMessages"
import { useUpdateSession, useDeleteSession } from "./hooks/useSessionActions"
import { DialogOpenFile } from "./components/DialogOpenFile"
import { storage } from "./utils/storage"
import PresentationFrame from "./components/PresentationFrame"
import { useLayout } from "./context/LayoutContext"
import type { AgentConversationState } from "./context/LayoutContext"
import { useDialog } from "./context/DialogContext"
import { useCommandPalette } from "./context/CommandPaletteContext"
import { DialogSelectDirectory } from "./components/DialogSelectDirectory"
import { useServer } from "./context/ServerContext"
import {
  DEFAULT_SHORTCUTS,
  SETTINGS_UPDATED_EVENT,
  emitOpenSettings,
  isEditableTarget,
  loadSettings,
  loadShortcuts,
  matchesShortcut,
  type ShortcutMap,
} from "./utils/shortcuts"
import { selectAdjacentSession, type SessionNavigationDirection } from "./utils/session-navigation"
import { usePane } from "./context/PaneContext"
import { useAgentCommands } from "./hooks/useAgentCommands"
import { usePaneStateReporter } from "./hooks/usePaneStateReporter"
import { PaneContainer } from "./components/pane/PaneContainer"
import { FloatingAgentConversation } from "./components/agent/FloatingAgentConversation"
import type { ContentSpec, PaneLayout } from "./components/pane/types"
import { createDefaultPaneLayout, findFirstLeafId } from "./components/pane/utils/treeOps"
import "./App.css"

const LAYOUT_STORAGE_PREFIX = "openspace:layout:"
const DEFAULT_AGENT_CONVERSATION_STATE = {
  mode: "floating",
  size: "minimal",
  position: { x: 95, y: 92 },
  dimensions: { width: 620, height: 420 },
  visible: true,
} as const

function normalizeAgentConversationState(state?: Partial<AgentConversationState>): AgentConversationState {
  if (!state) {
    return {
      ...DEFAULT_AGENT_CONVERSATION_STATE,
      position: { ...DEFAULT_AGENT_CONVERSATION_STATE.position },
      dimensions: { ...DEFAULT_AGENT_CONVERSATION_STATE.dimensions },
    }
  }

  return {
    mode: state.mode ?? DEFAULT_AGENT_CONVERSATION_STATE.mode,
    size: state.size ?? DEFAULT_AGENT_CONVERSATION_STATE.size,
    position: state.position ?? DEFAULT_AGENT_CONVERSATION_STATE.position,
    dimensions: state.dimensions ?? DEFAULT_AGENT_CONVERSATION_STATE.dimensions,
    visible: state.visible ?? DEFAULT_AGENT_CONVERSATION_STATE.visible,
    dockedPaneId: state.dockedPaneId,
    lastFloatingRect: state.lastFloatingRect,
  }
}

function inferContent(path: string): ContentSpec {
  let type: ContentSpec["type"] = "editor"
  if (path.endsWith(".diagram.json") || path.endsWith(".excalidraw")) type = "whiteboard"
  else if (path.endsWith(".deck.md")) type = "presentation"

  return {
    type,
    title: path.split("/").filter(Boolean).at(-1) ?? path,
    contentId: path,
  }
}

function App() {
  const queryClient = useQueryClient()
  const { show } = useDialog()
  const server = useServer()
  const pane = usePane()
  useAgentCommands()
  usePaneStateReporter()
  const {
    leftSidebarExpanded,
    rightSidebarExpanded,
    layoutOrganization,
    agentConversation,
    setLeftSidebarExpanded,
    setRightSidebarExpanded,
    setLayoutOrganization,
    setAgentConversation,
  } = useLayout()
  const { openPalette } = useCommandPalette()

  const [activeProjectId, setActiveProjectId] = useState<string>("")
  const [activeDirectory, setActiveDirectory] = useState<string>(openCodeService.directory)
  const [activeSessionId, setActiveSessionId] = useState<string | undefined>()
  const [projects, setProjects] = useState<Project[]>([])
  const [isTemporarySidebarOpen, setIsTemporarySidebarOpen] = useState(false)
  const [shortcuts, setShortcuts] = useState<ShortcutMap>(() => ({ ...DEFAULT_SHORTCUTS, ...loadShortcuts() }))
  const fileParamHandled = useRef<string | null>(null)
  const paneApiRef = useRef(pane)
  const isRestoringSessionRef = useRef(false)

  useEffect(() => {
    paneApiRef.current = pane
  }, [pane])

  const setActiveSession = useCallback((id?: string) => {
    setActiveSessionId(id)
    if (id) {
      storage.markSessionSeen(id)
    }
  }, [])

  const applyActiveDirectory = useCallback((directory: string) => {
    openCodeService.setDirectory(directory)
    setActiveDirectory(directory)
  }, [])

  useEffect(() => {
    const stored = storage.getProjects()
    if (stored.length > 0) {
      const mapped: Project[] = stored.map((p, i) => ({
        id: p.path,
        name: p.name,
        path: p.path,
        initial: p.name.charAt(0).toUpperCase(),
        color: p.color || (i % 2 === 0 ? "bg-[#fce7f3]" : "bg-[#e1faf8]"),
      }))
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProjects(mapped)

      const lastPath = storage.getLastProjectPath()
      if (lastPath && mapped.find((p) => p.path === lastPath)) {
        setActiveProjectId(lastPath)
        applyActiveDirectory(lastPath)
      } else {
        setActiveProjectId(mapped[0].path)
        applyActiveDirectory(mapped[0].path)
      }
      return
    }

    const initializeFromServer = async () => {
      try {
        const response = await openCodeService.client.project.current()
        const project = response.data
        if (!project?.worktree) return

        const name = project.name ?? project.worktree.split("/").filter(Boolean).pop() ?? "project"
        const defaultProject: Project = {
          id: project.worktree,
          name,
          path: project.worktree,
          initial: name.charAt(0).toUpperCase(),
          color: "bg-[#fce7f3]",
        }

        setProjects([defaultProject])
        setActiveProjectId(defaultProject.id)
        applyActiveDirectory(defaultProject.path)
        storage.saveProjects([{ path: defaultProject.path, name: defaultProject.name, color: defaultProject.color }])
      } catch (error) {
        console.error("Failed to load default project from server", error)
      }
    }

    void initializeFromServer()
  }, [applyActiveDirectory])

  const handleSelectProject = (id: string) => {
    setActiveProjectId(id)
    setActiveSession(undefined)
    const project = projects.find((p) => p.id === id)
    if (!project) return
    applyActiveDirectory(project.path)
    storage.saveLastProjectPath(project.path)
    queryClient.invalidateQueries({ queryKey: sessionsQueryKey(server.activeUrl, project.path) })
  }

  const handleSelectSession = useCallback(
    (id: string) => {
      setActiveSession(id)
      if (!isTemporarySidebarOpen) return
      setLeftSidebarExpanded(false)
      setIsTemporarySidebarOpen(false)
    },
    [isTemporarySidebarOpen, setActiveSession, setLeftSidebarExpanded],
  )

  const handleSwitchWorkspace = useCallback(
    (workspaceDirectory: string) => {
      setActiveSession(undefined)
      applyActiveDirectory(workspaceDirectory)
      queryClient.invalidateQueries({
        queryKey: sessionsQueryKey(server.activeUrl, workspaceDirectory),
      })
    },
    [applyActiveDirectory, queryClient, server.activeUrl, setActiveSession],
  )

  const handleAddProject = (path: string) => {
    const name = path.split("/").filter(Boolean).pop() || "project"
    const newProject: Project = {
      id: path,
      name,
      path,
      initial: name.charAt(0).toUpperCase(),
      color: "bg-[#f1f8e9]",
    }
    const updated = [...projects, newProject]
    setProjects(updated)
    storage.saveProjects(updated.map((p) => ({ path: p.path, name: p.name, color: p.color })))
    setActiveProjectId(path)
    setActiveSession(undefined)
    applyActiveDirectory(path)
    storage.saveLastProjectPath(path)
    queryClient.invalidateQueries({ queryKey: sessionsQueryKey(server.activeUrl, path) })
  }

  const activeProject = projects.find((p) => p.id === activeProjectId)
  const printParams = useMemo(() => new URLSearchParams(window.location.search), [])
  const printFilePath = printParams.get("file")
  const isPrinting = printParams.has("print-pdf") && Boolean(printFilePath)

  const connectionQuery = useQuery({
    queryKey: ["connection", server.activeUrl],
    queryFn: () => openCodeService.checkConnection(),
    refetchInterval: (data) => (data ? false : 3000),
  })

  const sessionsQuery = useSessions({ directory: activeDirectory })
  const sessions = sessionsQuery.sessions
  const updateSession = useUpdateSession(activeDirectory)
  const deleteSession = useDeleteSession(activeDirectory)

  const createSession = useMutation({
    mutationFn: async () => {
      const response = await openCodeService.client.session.create({ directory: activeDirectory })
      return response.data
    },
    onSuccess: (data) => {
      if (!data?.id) return
      setActiveSession(data.id)
      queryClient.invalidateQueries({ queryKey: sessionsQueryKey(server.activeUrl, activeDirectory) })
    },
  })

  const createSessionRef = useRef(createSession)
  useEffect(() => {
    createSessionRef.current = createSession
  }, [createSession])

  useEffect(() => {
    const filePath = printParams.get("file")
    if (!filePath) return
    if (fileParamHandled.current === filePath) return
    pane.openContent(inferContent(filePath))
    fileParamHandled.current = filePath
  }, [pane, printParams])

  const layoutStorageKey = useMemo(() => {
    if (layoutOrganization === "per-project") {
      return `${LAYOUT_STORAGE_PREFIX}project:${activeDirectory || "_global"}`
    }
    return `${LAYOUT_STORAGE_PREFIX}session:${activeSessionId ?? "_global"}`
  }, [activeDirectory, activeSessionId, layoutOrganization])

  useEffect(() => {
    const raw = window.localStorage.getItem(layoutStorageKey)
    isRestoringSessionRef.current = true

    const finishRestore = () => {
      queueMicrotask(() => {
        isRestoringSessionRef.current = false
      })
    }

    const applyDefaults = () => {
      paneApiRef.current.resetLayout()
      setAgentConversation(normalizeAgentConversationState())
    }

    if (!raw) {
      window.localStorage.setItem(
        layoutStorageKey,
        JSON.stringify({
          paneLayout: createDefaultPaneLayout(),
          agentConversation: DEFAULT_AGENT_CONVERSATION_STATE,
        }),
      )
      applyDefaults()
      finishRestore()
      return
    }

    try {
      const parsed = JSON.parse(raw) as {
        paneLayout?: PaneLayout
        agentConversation?: AgentConversationState
      }

      if (parsed.paneLayout) {
        paneApiRef.current.setLayout(parsed.paneLayout)
      } else {
        paneApiRef.current.resetLayout()
      }
      if (parsed.agentConversation) {
        setAgentConversation(normalizeAgentConversationState(parsed.agentConversation))
      } else {
        setAgentConversation(normalizeAgentConversationState())
      }
    } catch (error) {
      console.error("Failed to restore layout", error)
      applyDefaults()
    }
    finishRestore()
  }, [layoutStorageKey, setAgentConversation])

  useEffect(() => {
    if (isRestoringSessionRef.current) return
    const payload = JSON.stringify({
      paneLayout: pane.layout,
      agentConversation,
    })
    window.localStorage.setItem(layoutStorageKey, payload)
  }, [agentConversation, layoutStorageKey, pane.layout])

  const handleNewSession = useCallback(() => {
    createSessionRef.current.mutate()
  }, [])

  const handleSelectAdjacentSession = useCallback(
    (direction: SessionNavigationDirection) => {
      const nextSessionId = selectAdjacentSession({
        orderedVisibleSessionIds: sessions.map((session) => session.id),
        activeSessionId,
        direction,
      })
      if (nextSessionId) setActiveSession(nextSessionId)
    },
    [activeSessionId, sessions, setActiveSession],
  )

  const handleOpenFile = useCallback(() => {
    show(<DialogOpenFile directory={activeDirectory} />)
  }, [activeDirectory, show])

  const handleDeleteSession = useCallback(
    (id: string) => {
      const remaining = sessions.filter((session) => session.id !== id)
      deleteSession.mutate(id, {
        onSuccess: () => {
          if (activeSessionId === id) {
            setActiveSession(remaining[0]?.id)
          }
        },
      })
    },
    [activeSessionId, deleteSession, sessions, setActiveSession],
  )

  useEffect(() => {
    const refreshShortcuts = () => {
      setShortcuts(loadShortcuts())
      setLayoutOrganization(loadSettings().layoutOrganization)
    }
    window.addEventListener(SETTINGS_UPDATED_EVENT, refreshShortcuts)
    return () => window.removeEventListener(SETTINGS_UPDATED_EVENT, refreshShortcuts)
  }, [setLayoutOrganization])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return

      if (matchesShortcut(event, shortcuts.openCommandPalette)) {
        event.preventDefault()
        openPalette()
        return
      }

      if (matchesShortcut(event, shortcuts.openSettings)) {
        event.preventDefault()
        emitOpenSettings()
        return
      }

      if (matchesShortcut(event, shortcuts.openFile)) {
        event.preventDefault()
        handleOpenFile()
        return
      }

      if (isEditableTarget(event.target)) return

      if (matchesShortcut(event, shortcuts.previousSession)) {
        event.preventDefault()
        handleSelectAdjacentSession("previous")
        return
      }
      if (matchesShortcut(event, shortcuts.nextSession)) {
        event.preventDefault()
        handleSelectAdjacentSession("next")
        return
      }
      if (matchesShortcut(event, shortcuts.newSession)) {
        event.preventDefault()
        handleNewSession()
        return
      }
      if (matchesShortcut(event, shortcuts.toggleSidebar)) {
        event.preventDefault()
        setLeftSidebarExpanded((prev) => !prev)
        setIsTemporarySidebarOpen(false)
        return
      }
      if (matchesShortcut(event, shortcuts.toggleTerminal)) {
        event.preventDefault()
        pane.openContent({
          type: "terminal",
          title: "Terminal",
          contentId: `terminal:${activeDirectory}`,
        })
        return
      }
      if (matchesShortcut(event, shortcuts.toggleFileTree)) {
        event.preventDefault()
        setRightSidebarExpanded((prev) => !prev)
        return
      }

      if (event.key === "Escape") {
        setAgentConversation((prev) => ({ ...prev, size: "minimal" }))
        return
      }

      const hasMod = event.metaKey || event.ctrlKey

      if (hasMod && !event.altKey && !event.shiftKey && event.key.toLowerCase() === "w") {
        event.preventDefault()
        const activePane = pane.getActivePane()
        if (!activePane) return

        if (activePane.tabs.length === 0) {
          if (pane.getPaneCount() > 1) {
            pane.closePane(activePane.id)
          }
          return
        }

        if (activePane.tabs.length === 1 && pane.getPaneCount() > 1) {
          pane.closePane(activePane.id)
          return
        }

        const activeTab = activePane.tabs[activePane.activeTabIndex]
        if (activeTab) {
          pane.closeTab(activePane.id, activeTab.id)
        }
        return
      }

      if (hasMod && !event.altKey && !event.shiftKey && /^[1-9]$/.test(event.key)) {
        event.preventDefault()
        const activePane = pane.getActivePane()
        if (!activePane) return
        pane.setActiveTab(activePane.id, Number(event.key) - 1)
        return
      }

      if (matchesShortcut(event, shortcuts.splitPaneDown)) {
        event.preventDefault()
        pane.splitPane(pane.layout.activePaneId, "vertical")
        return
      }

      if (matchesShortcut(event, shortcuts.splitPaneRight)) {
        event.preventDefault()
        pane.splitPane(pane.layout.activePaneId, "horizontal")
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [
    activeDirectory,
    handleNewSession,
    handleOpenFile,
    handleSelectAdjacentSession,
    openPalette,
    pane,
    setAgentConversation,
    setLeftSidebarExpanded,
    setRightSidebarExpanded,
    shortcuts,
  ])

  const unseenSessionIds = useMemo(() => {
    const seenMap = storage.getSessionSeenMap()
    const unseen = new Set<string>()
    for (const session of sessions) {
      const seenAt = seenMap[session.id] ?? 0
      if (session.time?.updated > seenAt) unseen.add(session.id)
    }
    return unseen
  }, [sessions])

  const nextUnseenSessionId = useMemo(() => {
    if (sessions.length === 0) return undefined
    const startIndex = activeSessionId ? sessions.findIndex((s) => s.id === activeSessionId) : -1
    const ordered = startIndex >= 0 ? [...sessions.slice(startIndex + 1), ...sessions.slice(0, startIndex + 1)] : sessions
    return ordered.find((s) => unseenSessionIds.has(s.id))?.id
  }, [sessions, activeSessionId, unseenSessionIds])

  useEffect(() => {
    if (!activeSessionId || sessions.length === 0) return
    const index = sessions.findIndex((s) => s.id === activeSessionId)
    const neighbors = [sessions[index - 1], sessions[index + 1]].filter(Boolean)
    neighbors.forEach((session) => {
      queryClient.prefetchQuery({
        queryKey: messagesQueryKey(server.activeUrl, activeDirectory, session.id, DEFAULT_MESSAGE_LIMIT),
        queryFn: () => fetchMessages({ sessionId: session.id, directory: activeDirectory, limit: DEFAULT_MESSAGE_LIMIT }),
      })
    })
  }, [activeDirectory, activeSessionId, sessions, server.activeUrl, queryClient])

  const connected = Boolean(connectionQuery.data)
  const fallbackDockPaneId = pane.getActivePane()?.id ?? findFirstLeafId(pane.layout.root) ?? pane.layout.activePaneId
  const effectiveDockedPaneId =
    agentConversation.mode === "docked-pane"
      ? (agentConversation.dockedPaneId ?? fallbackDockPaneId)
      : undefined

  if (isPrinting && printFilePath) {
    return <PresentationFrame filePath={printFilePath} />
  }

  return (
    <div className="flex h-full flex-col os-shell">
      <ToastHost />
      {connected && <TopBar connected={connected} />}

      {!connected ? (
        <div className="app-shell flex h-full items-center justify-center">
          <div className="panel-surface flex w-[420px] flex-col gap-4 rounded-xl border border-[var(--os-line)] p-8 text-center shadow-2xl">
            <div className="text-xs uppercase tracking-[0.3em] text-muted">Connection guard</div>
            <div className="text-2xl font-semibold">Waiting for OpenCode server</div>
            <div className="text-sm text-muted">
              Make sure the OpenCode backend is running at <span className="code-inline">{server.activeUrl}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex h-full min-h-0">
          <ProjectRail
            projects={projects}
            activeProjectId={activeProjectId}
            onSelectProject={handleSelectProject}
            onProjectIconPress={() => {
              if (leftSidebarExpanded) return
              setLeftSidebarExpanded(true)
              setIsTemporarySidebarOpen(true)
            }}
            onAddProject={() => show(<DialogSelectDirectory onSelect={handleAddProject} />)}
          />

          <div
            data-testid="left-sidebar-shell"
            className={`overflow-hidden transition-all duration-300 ease-in-out ${leftSidebarExpanded && activeProject ? "w-[224px]" : "w-0"}`}
          >
            {activeProject && (
              <SessionSidebar
                projectName={activeProject.name}
                projectPath={activeProject.path}
                sessions={sessions}
                activeSessionId={activeSessionId}
                onSelectSession={handleSelectSession}
                onNewSession={handleNewSession}
                onLoadMore={sessionsQuery.loadMore}
                hasMore={sessionsQuery.hasMore}
                onUpdateSession={(id, title) => updateSession.mutate({ sessionID: id, title })}
                onDeleteSession={handleDeleteSession}
                onArchiveSession={(id, archived) => updateSession.mutate({ sessionID: id, archived })}
                unseenSessionIds={unseenSessionIds}
                unseenCount={unseenSessionIds.size}
                onSelectNextUnseen={() => {
                  if (nextUnseenSessionId) setActiveSession(nextUnseenSessionId)
                }}
                currentDirectory={activeDirectory}
                onSwitchWorkspace={handleSwitchWorkspace}
              />
            )}
          </div>

          <main className="flex h-full min-w-0 flex-1 flex-col bg-[var(--os-bg-0)]">
            <div className="flex h-full overflow-hidden border-r border-[var(--os-line)] bg-[var(--os-bg-0)]">
              <div className="relative flex min-w-0 flex-1 flex-col">
                <div className="min-h-0 flex-1">
                  <PaneContainer
                    sessionId={activeSessionId}
                    directory={activeDirectory}
                    dockedAgentPaneId={effectiveDockedPaneId}
                    onUndockAgent={() => {
                      setAgentConversation((prev) => ({
                        ...prev,
                        mode: "floating",
                        dockedPaneId: undefined,
                        size: prev.lastFloatingRect?.size ?? "expanded",
                        position: prev.lastFloatingRect?.position ?? prev.position,
                        dimensions: prev.lastFloatingRect?.dimensions ?? prev.dimensions,
                      }))
                    }}
                  />
                </div>
              </div>

              <aside
                data-testid="right-sidebar-shell"
                className={`os-right-panel hidden flex-shrink-0 flex-col border-l border-[var(--os-line)] transition-all duration-300 ease-in-out md:flex ${rightSidebarExpanded ? "w-[212px] opacity-100" : "w-0 opacity-0"}`}
              >
                <div className="min-h-0 flex-1 overflow-hidden">
                  <FileTree directory={activeDirectory} />
                </div>
              </aside>
            </div>
          </main>

          <FloatingAgentConversation
            sessionId={activeSessionId}
            directory={activeDirectory}
            state={agentConversation}
            setState={setAgentConversation}
            activePaneId={pane.layout.activePaneId}
            resolveDockPaneId={() => pane.getActivePane()?.id ?? findFirstLeafId(pane.layout.root) ?? pane.layout.activePaneId}
            onOpenContent={(path, type: "whiteboard" | "drawing" | "presentation" | "editor" = "editor") => {
              pane.openContent({
                type,
                contentId: path,
                title: path.split("/").filter(Boolean).at(-1) ?? path,
              })
            }}
          />
        </div>
      )}

      <CommandPalette />
    </div>
  )
}

export default App
