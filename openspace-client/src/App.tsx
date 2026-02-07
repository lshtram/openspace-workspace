import { useState, useEffect, useCallback, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { AgentConsole } from "./components/AgentConsole"
import { FileTree } from "./components/FileTree"
import { Terminal } from "./components/Terminal"
import { ProjectRail, type Project } from "./components/sidebar/ProjectRail"
import { SessionSidebar } from "./components/sidebar/SessionSidebar"
import { TopBar } from "./components/TopBar"
import { ToastHost } from "./components/ToastHost"
import { openCodeService } from "./services/OpenCodeClient"
import { useSessions, sessionsQueryKey } from "./hooks/useSessions"
import { DEFAULT_MESSAGE_LIMIT, fetchMessages, messagesQueryKey } from "./hooks/useMessages"
import { useUpdateSession, useDeleteSession } from "./hooks/useSessionActions"
import { storage } from "./utils/storage"
import { useLayout } from "./context/LayoutContext"
import { useDialog } from "./context/DialogContext"
import { DialogSelectDirectory } from "./components/DialogSelectDirectory"
import { useServer } from "./context/ServerContext"
import "./App.css"

function App() {
  const queryClient = useQueryClient()
  const { show } = useDialog()
  const server = useServer()
  const {
    leftSidebarExpanded,
    rightSidebarExpanded,
    terminalExpanded,
    terminalHeight,
    setTerminalHeight,
  } = useLayout()

  const [activeProjectId, setActiveProjectId] = useState<string>("")
  const [activeSessionId, setActiveSessionId] = useState<string | undefined>()
  const [projects, setProjects] = useState<Project[]>([])
  const [isResizingTerminal, setIsResizingTerminal] = useState(false)
  const [seenVersion, setSeenVersion] = useState(0)
  const sessionSeenEvent = "openspace:session-seen"

  const setActiveSession = useCallback((id?: string) => {
    setActiveSessionId(id)
    if (id) {
      storage.markSessionSeen(id)
      setSeenVersion((prev) => prev + 1)
    }
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
        openCodeService.setDirectory(lastPath)
      } else {
        setActiveProjectId(mapped[0].path)
        openCodeService.setDirectory(mapped[0].path)
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
          openCodeService.setDirectory(defaultProject.path)
          storage.saveProjects([{ path: defaultProject.path, name: defaultProject.name, color: defaultProject.color }])
        } catch (error) {
          console.error("Failed to load default project from server", error)
        }
      }

      void initializeFromServer()
    }
  }, [])

  const handleSelectProject = (id: string) => {
    setActiveProjectId(id)
    setActiveSession(undefined)
    const project = projects.find(p => p.id === id)
    if (project) {
      openCodeService.setDirectory(project.path)
      storage.saveLastProjectPath(project.path)
      queryClient.invalidateQueries({ queryKey: sessionsQueryKey(server.activeUrl, project.path) })
    }
  }

  const handleSwitchWorkspace = useCallback(
    (workspaceDirectory: string) => {
      setActiveSession(undefined)
      openCodeService.setDirectory(workspaceDirectory)
      queryClient.invalidateQueries({
        queryKey: sessionsQueryKey(server.activeUrl, workspaceDirectory),
      })
    },
    [queryClient, server.activeUrl, setActiveSession],
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
    handleSelectProject(path)
  }

  const activeProject = projects.find(p => p.id === activeProjectId)

  const connectionQuery = useQuery({
    queryKey: ["connection", server.activeUrl],
    queryFn: () => openCodeService.checkConnection(),
    refetchInterval: (data) => (data ? false : 3000),
  })

  const sessionsQuery = useSessions()
  const sessions = sessionsQuery.sessions
  const updateSession = useUpdateSession()
  const deleteSession = useDeleteSession()

  const createSession = useMutation({
    mutationFn: async () => {
      const response = await openCodeService.client.session.create({
        directory: openCodeService.directory,
      })
      return response.data
    },
    onSuccess: (data) => {
      if (data?.id) {
        setActiveSession(data.id)
        queryClient.invalidateQueries({
          queryKey: sessionsQueryKey(server.activeUrl, openCodeService.directory),
        })
      }
    },
  })

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
    const handleSeen = () => {
      setSeenVersion((prev) => prev + 1)
    }
    window.addEventListener(sessionSeenEvent, handleSeen)
    return () => window.removeEventListener(sessionSeenEvent, handleSeen)
  }, [sessionSeenEvent])

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
        queryKey: messagesQueryKey(server.activeUrl, openCodeService.directory, session.id, DEFAULT_MESSAGE_LIMIT),
        queryFn: () =>
          fetchMessages({
            sessionId: session.id,
            directory: openCodeService.directory,
            limit: DEFAULT_MESSAGE_LIMIT,
          }),
      })
    })
  }, [activeSessionId, sessions, server.activeUrl, queryClient])

  return (
    <div className="flex h-full flex-col bg-[#f7f5f1]">
      <ToastHost />
      {connected && <TopBar connected={connected} />}
      
      {!connected ? (
        <div className="app-shell flex h-full items-center justify-center bg-[#f7f5f1]">
          <div className="panel-surface flex w-[420px] flex-col gap-4 rounded-3xl p-8 text-center border-black/10 shadow-2xl bg-white">
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
              onNewSession={() => createSession.mutate()}
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
              currentDirectory={openCodeService.directory}
              onSwitchWorkspace={handleSwitchWorkspace}
            />
          )}

          <main className="flex h-full min-w-0 flex-1 flex-col p-4 pl-2 pr-4 pb-4">
            <div className="flex h-full overflow-hidden rounded-[32px] border border-black/10 bg-white shadow-sm">
              <div className="flex flex-1 flex-col min-w-0 relative">
                <div className="flex min-h-0 flex-1 flex-col">
                  <AgentConsole 
                    directory={activeProject?.path ?? openCodeService.directory}
                    sessionId={activeSessionId} 
                    onSessionCreated={setActiveSession} 
                  />
                </div>

                {terminalExpanded && (
                  <>
                    <div
                      onMouseDown={startResizing}
                      className="absolute z-10 h-1.5 w-full cursor-ns-resize hover:bg-black/[0.05] transition-colors"
                      style={{ bottom: terminalHeight - 3 }}
                    />
                    <div className="border-t border-black/[0.03]" style={{ height: terminalHeight }}>
                      <Terminal resizeTrigger={terminalHeight} />
                    </div>
                  </>
                )}
              </div>

              {rightSidebarExpanded && (
                <aside className="hidden w-[280px] flex-shrink-0 flex-col border-l border-black/[0.03] md:flex animate-in slide-in-from-right duration-300">
                  <FileTree directory={activeProject?.path ?? openCodeService.directory} />
                </aside>
              )}
            </div>
          </main>
        </div>
      )}
    </div>
  )
}

export default App
