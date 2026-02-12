import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { AgentConsole } from "./components/AgentConsole"
import { WhiteboardFrame } from "./components/whiteboard/WhiteboardFrame"
import { TldrawWhiteboard } from "./components/whiteboard/TldrawWhiteboard"
import { FileTree } from "./components/FileTree"
import { Terminal } from "./components/Terminal"
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
import { useLayout } from "./context/LayoutContext"
import { useDialog } from "./context/DialogContext"
import { useCommandPalette } from "./context/CommandPaletteContext"
import { DialogSelectDirectory } from "./components/DialogSelectDirectory"
import { useServer } from "./context/ServerContext"
import {
  DEFAULT_SHORTCUTS,
  SETTINGS_UPDATED_EVENT,
  emitOpenSettings,
  isEditableTarget,
  loadShortcuts,
  matchesShortcut,
  type ShortcutMap,
} from "./utils/shortcuts"
import { selectAdjacentSession, type SessionNavigationDirection } from "./utils/session-navigation"
import "./App.css"

const sessionSeenEvent = "openspace:session-seen"

function App() {
  const queryClient = useQueryClient()
  const { show } = useDialog()
  const server = useServer()
  const {
    leftSidebarExpanded,
    rightSidebarExpanded,
    terminalExpanded,
    terminalHeight,
    setLeftSidebarExpanded,
    setRightSidebarExpanded,
    setTerminalExpanded,
    setTerminalHeight,
    activeWhiteboardPath,
    setActiveWhiteboardPath,
  } = useLayout()
  const { openPalette, registerCommand } = useCommandPalette()

  const [activeProjectId, setActiveProjectId] = useState<string>("")
  const [activeDirectory, setActiveDirectory] = useState<string>(openCodeService.directory)
  const [activeSessionId, setActiveSessionId] = useState<string | undefined>()
  const [projects, setProjects] = useState<Project[]>([])
  const [isResizingTerminal, setIsResizingTerminal] = useState(false)
  const [seenVersion, setSeenVersion] = useState(0)
  const [shortcuts, setShortcuts] = useState<ShortcutMap>(() => ({ ...DEFAULT_SHORTCUTS, ...loadShortcuts() }))
  
  const setActiveSession = useCallback((id?: string) => {
    setActiveSessionId(id)
    if (id) {
      storage.markSessionSeen(id)
      setSeenVersion((prev) => prev + 1)
    }
  }, [])

  const applyActiveDirectory = useCallback((directory: string) => {
    openCodeService.setDirectory(directory)
    setActiveDirectory(directory)
  }, [])

  // Initialize projects from storage or current directory
  useEffect(() => {
    const stored = storage.getProjects()
    if (stored.length > 0) {
      const mapped: Project[] = stored.map((p, i) => ({
        id: p.path,
        name: p.name,
        path: p.path,
        initial: p.name.charAt(0).toUpperCase(),
        color: p.color || (i % 2 === 0 ? "bg-[#fce7f3]" : "bg-[#e1faf8]")
      }))
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProjects(mapped)
      
      const lastPath = storage.getLastProjectPath()
      if (lastPath && mapped.find(p => p.path === lastPath)) {
        setActiveProjectId(lastPath)
        applyActiveDirectory(lastPath)
      } else {
        setActiveProjectId(mapped[0].path)
        applyActiveDirectory(mapped[0].path)
      }
    } else {
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
    }
  }, [applyActiveDirectory])

  const handleSelectProject = (id: string) => {
    setActiveProjectId(id)
    setActiveSession(undefined)
    const project = projects.find(p => p.id === id)
    if (project) {
      applyActiveDirectory(project.path)
      storage.saveLastProjectPath(project.path)
      queryClient.invalidateQueries({ queryKey: sessionsQueryKey(server.activeUrl, project.path) })
    }
  }

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
      color: "bg-[#f1f8e9]"
    }
    const updated = [...projects, newProject]
    setProjects(updated)
    storage.saveProjects(updated.map(p => ({ path: p.path, name: p.name, color: p.color })))
    setActiveProjectId(path)
    setActiveSession(undefined)
    applyActiveDirectory(path)
    storage.saveLastProjectPath(path)
    queryClient.invalidateQueries({ queryKey: sessionsQueryKey(server.activeUrl, path) })
  }

  const activeProject = projects.find(p => p.id === activeProjectId)

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
      const response = await openCodeService.client.session.create({
        directory: activeDirectory,
      })
      return response.data
    },
    onSuccess: (data) => {
      if (data?.id) {
        setActiveSession(data.id)
        queryClient.invalidateQueries({
          queryKey: sessionsQueryKey(server.activeUrl, activeDirectory),
        })
      }
    },
  })

  const createSessionRef = useRef(createSession)
  useEffect(() => {
    createSessionRef.current = createSession
  }, [createSession])

  // Handle ?file= URL parameter for direct whiteboard/file opening
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const filePath = params.get('file')
    if (filePath && !activeWhiteboardPath) {
      setActiveWhiteboardPath(filePath)
    }
  }, [activeWhiteboardPath, setActiveWhiteboardPath])

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
      if (nextSessionId) {
        setActiveSession(nextSessionId)
      }
    },
    [activeSessionId, sessions, setActiveSession],
  )

  const handleOpenFile = useCallback(() => {
    show(<DialogOpenFile directory={activeDirectory} />)
  }, [activeDirectory, show])

  const handleOpenFileRef = useRef(handleOpenFile)
  useEffect(() => {
    handleOpenFileRef.current = handleOpenFile
  }, [handleOpenFile])

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

  const handleSelectAdjacentSessionRef = useRef(handleSelectAdjacentSession)
  useEffect(() => {
    handleSelectAdjacentSessionRef.current = handleSelectAdjacentSession
  }, [handleSelectAdjacentSession])

  const openSettingsCommandAction = useCallback(() => {
    emitOpenSettings()
  }, [])

  const newSessionCommandAction = useCallback(() => {
    createSessionRef.current.mutate()
  }, [])

  const previousSessionCommandAction = useCallback(() => {
    handleSelectAdjacentSessionRef.current("previous")
  }, [])

  const nextSessionCommandAction = useCallback(() => {
    handleSelectAdjacentSessionRef.current("next")
  }, [])

  const openFileCommandAction = useCallback(() => {
    handleOpenFileRef.current()
  }, [])

  const toggleSidebarCommandAction = useCallback(() => {
    setLeftSidebarExpanded((prev) => !prev)
  }, [setLeftSidebarExpanded])

  const toggleTerminalCommandAction = useCallback(() => {
    setTerminalExpanded((prev) => !prev)
  }, [setTerminalExpanded])

  const toggleFileTreeCommandAction = useCallback(() => {
    setRightSidebarExpanded((prev) => !prev)
  }, [setRightSidebarExpanded])

  const startResizing = useCallback(() => {
    setIsResizingTerminal(true)
  }, [])

  const stopResizing = useCallback(() => {
    setIsResizingTerminal(false)
  }, [])

  const resize = useCallback(
    (e: MouseEvent) => {
      if (isResizingTerminal) {
        const height = window.innerHeight - e.clientY - 24
        if (height > 100 && height < window.innerHeight * 0.8) {
          setTerminalHeight(height)
        }
      }
    },
    [isResizingTerminal, setTerminalHeight]
  )

  useEffect(() => {
    if (isResizingTerminal) {
      window.addEventListener("mousemove", resize)
      window.addEventListener("mouseup", stopResizing)
    }
    return () => {
      window.removeEventListener("mousemove", resize)
      window.removeEventListener("mouseup", stopResizing)
    }
  }, [isResizingTerminal, resize, stopResizing])

  const connected = Boolean(connectionQuery.data)

  useEffect(() => {
    const refreshShortcuts = () => {
      setShortcuts(loadShortcuts())
    }
    window.addEventListener(SETTINGS_UPDATED_EVENT, refreshShortcuts)
    return () => window.removeEventListener(SETTINGS_UPDATED_EVENT, refreshShortcuts)
  }, [])

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
        return
      }
      if (matchesShortcut(event, shortcuts.toggleTerminal)) {
        event.preventDefault()
        setTerminalExpanded((prev) => !prev)
        return
      }
      if (matchesShortcut(event, shortcuts.toggleFileTree)) {
        event.preventDefault()
        setRightSidebarExpanded((prev) => !prev)
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [
    handleOpenFile,
    handleNewSession,
    handleSelectAdjacentSession,
    openPalette,
    setLeftSidebarExpanded,
    setRightSidebarExpanded,
    setTerminalExpanded,
    shortcuts,
  ])

  useEffect(() => {
    const unregister = [
      registerCommand({
        id: "open-settings",
        title: "Open Settings",
        shortcut: shortcuts.openSettings,
        action: openSettingsCommandAction,
      }),
      registerCommand({
        id: "new-session",
        title: "New Session",
        shortcut: shortcuts.newSession,
        action: newSessionCommandAction,
      }),
      registerCommand({
        id: "previous-session",
        title: "Previous Session",
        shortcut: shortcuts.previousSession,
        action: previousSessionCommandAction,
      }),
      registerCommand({
        id: "next-session",
        title: "Next Session",
        shortcut: shortcuts.nextSession,
        action: nextSessionCommandAction,
      }),
      registerCommand({
        id: "open-file",
        title: "Open File",
        shortcut: shortcuts.openFile,
        action: openFileCommandAction,
      }),
      registerCommand({
        id: "toggle-sidebar",
        title: "Toggle Sidebar",
        shortcut: shortcuts.toggleSidebar,
        action: toggleSidebarCommandAction,
      }),
      registerCommand({
        id: "toggle-terminal",
        title: "Toggle Terminal",
        shortcut: shortcuts.toggleTerminal,
        action: toggleTerminalCommandAction,
      }),
      registerCommand({
        id: "toggle-file-tree",
        title: "Toggle File Tree",
        shortcut: shortcuts.toggleFileTree,
        action: toggleFileTreeCommandAction,
      }),
    ]
    return () => {
      unregister.forEach((cleanup) => {
        cleanup()
      })
    }
  }, [
    registerCommand,
    newSessionCommandAction,
    nextSessionCommandAction,
    openFileCommandAction,
    openSettingsCommandAction,
    previousSessionCommandAction,
    shortcuts.openFile,
    shortcuts.openSettings,
    shortcuts.newSession,
    shortcuts.nextSession,
    shortcuts.previousSession,
    shortcuts.toggleFileTree,
    shortcuts.toggleSidebar,
    shortcuts.toggleTerminal,
    toggleFileTreeCommandAction,
    toggleSidebarCommandAction,
    toggleTerminalCommandAction,
  ])

  useEffect(() => {
    const handleSeen = () => {
      setSeenVersion((prev) => prev + 1)
    }
    window.addEventListener(sessionSeenEvent, handleSeen)
    return () => window.removeEventListener(sessionSeenEvent, handleSeen)
  }, [])

  const unseenSessionIds = useMemo(() => {
    const seenTick = seenVersion
    const seenMap = storage.getSessionSeenMap()
    const unseen = new Set<string>()
    if (seenTick < 0) return unseen
    for (const session of sessions) {
      const seenAt = seenMap[session.id] ?? 0
      if (session.time?.updated > seenAt) {
        unseen.add(session.id)
      }
    }
    return unseen
  }, [sessions, seenVersion])

  const nextUnseenSessionId = useMemo(() => {
    if (sessions.length === 0) return undefined
    const startIndex = activeSessionId
      ? sessions.findIndex((s) => s.id === activeSessionId)
      : -1
    const ordered = startIndex >= 0
      ? [...sessions.slice(startIndex + 1), ...sessions.slice(0, startIndex + 1)]
      : sessions
    return ordered.find((s) => unseenSessionIds.has(s.id))?.id
  }, [sessions, activeSessionId, unseenSessionIds])

  useEffect(() => {
    if (!activeSessionId || sessions.length === 0) return
    const index = sessions.findIndex((s) => s.id === activeSessionId)
    const neighbors = [sessions[index - 1], sessions[index + 1]].filter(Boolean)
    neighbors.forEach((session) => {
        queryClient.prefetchQuery({
        queryKey: messagesQueryKey(server.activeUrl, activeDirectory, session.id, DEFAULT_MESSAGE_LIMIT),
        queryFn: () =>
          fetchMessages({
            sessionId: session.id,
            directory: activeDirectory,
            limit: DEFAULT_MESSAGE_LIMIT,
          }),
      })
    })
  }, [activeDirectory, activeSessionId, sessions, server.activeUrl, queryClient])

  return (
    <div className="flex h-full flex-col os-shell">
      <ToastHost />
      {connected && <TopBar connected={connected} />}
      
      {!connected ? (
        <div className="app-shell flex h-full items-center justify-center">
          <div className="panel-surface flex w-[420px] flex-col gap-4 rounded-xl p-8 text-center border border-[var(--os-line)] shadow-2xl">
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
            onAddProject={() => show(<DialogSelectDirectory onSelect={handleAddProject} />)}
          />
          
          {leftSidebarExpanded && activeProject && (
            <SessionSidebar
              projectName={activeProject.name}
              projectPath={activeProject.path}
              sessions={sessions}
              activeSessionId={activeSessionId}
              onSelectSession={setActiveSession}
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

          <main className="flex h-full min-w-0 flex-1 flex-col bg-[var(--os-bg-0)]">
            <div className="flex h-full overflow-hidden border-r border-[var(--os-line)] bg-[var(--os-bg-0)]">
              <div className="flex flex-1 flex-col min-w-0 relative">
                <div className="flex min-h-0 flex-1">
                  <div className={activeWhiteboardPath ? "w-1/2 border-r border-[var(--os-line)]" : "w-full"}>
                    <AgentConsole 
                      directory={activeDirectory}
                      sessionId={activeSessionId} 
                      onSessionCreated={setActiveSession} 
                    />
                  </div>
                  {activeWhiteboardPath && (
                    <div className="w-1/2 relative bg-[var(--os-bg-1)]">
                      {activeWhiteboardPath.endsWith(".diagram.json") ? (
                        <TldrawWhiteboard
                          filePath={activeWhiteboardPath}
                          sessionId={activeSessionId}
                        />
                      ) : (
                        <WhiteboardFrame
                          filePath={activeWhiteboardPath}
                          sessionId={activeSessionId}
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => setActiveWhiteboardPath(null)}
                        className="absolute top-2 right-2 p-1 bg-[var(--os-bg-1)] border border-[var(--os-line)] rounded shadow hover:bg-[var(--os-bg-2)] z-10 text-[var(--os-text-0)]"
                        title="Close Whiteboard"
                      >
                        <span className="text-xs font-bold px-1">×</span>
                      </button>
                    </div>
                  )}
                </div>

                {terminalExpanded && (
                  <>
                    {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
                    <div
                      onMouseDown={startResizing}
                      className="absolute z-10 h-1.5 w-full cursor-ns-resize hover:bg-white/10 transition-colors"
                      style={{ bottom: terminalHeight - 3 }}
                    />
                    <div className="border-t border-[var(--os-line)]" style={{ height: terminalHeight }}>
                      <Terminal resizeTrigger={terminalHeight} directory={activeDirectory} />
                    </div>
                  </>
                )}
              </div>

              {rightSidebarExpanded && (
                <aside className="hidden w-[250px] flex-shrink-0 flex-col border-l border-[var(--os-line)] md:flex os-right-panel animate-in slide-in-from-right duration-300">
                  <FileTree directory={activeDirectory} />
                </aside>
              )}
            </div>
          </main>
        </div>
      )}
      <CommandPalette />
    </div>
  )
}

export default App
