import { useState, useEffect, useCallback } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { AgentConsole } from "./components/AgentConsole"
import { FileTree } from "./components/FileTree"
import { Terminal } from "./components/Terminal"
import { ProjectRail, type Project } from "./components/sidebar/ProjectRail"
import { SessionSidebar } from "./components/sidebar/SessionSidebar"
import { TopBar } from "./components/TopBar"
import { openCodeService } from "./services/OpenCodeClient"
import { useSessions, sessionsQueryKey } from "./hooks/useSessions"
import { storage } from "./utils/storage"
import { useLayout } from "./context/LayoutContext"
import { useDialog } from "./context/DialogContext"
import { DialogSelectDirectory } from "./components/DialogSelectDirectory"
import "./App.css"

function App() {
  const queryClient = useQueryClient()
  const { show } = useDialog()
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
        openCodeService.directory = lastPath
      } else {
        setActiveProjectId(mapped[0].path)
        openCodeService.directory = mapped[0].path
      }
    } else {
      const defaultPath = "/Users/Shared/dev/openspace"
      const defaultProject: Project = {
        id: defaultPath,
        name: "openspace",
        path: defaultPath,
        initial: "O",
        color: "bg-[#fce7f3]"
      }
      setProjects([defaultProject])
      setActiveProjectId(defaultPath)
      openCodeService.directory = defaultPath
      storage.saveProjects([{ path: defaultPath, name: "openspace", color: "bg-[#fce7f3]" }])
    }
  }, [])

  const handleSelectProject = (id: string) => {
    setActiveProjectId(id)
    const project = projects.find(p => p.id === id)
    if (project) {
      openCodeService.directory = project.path
      storage.saveLastProjectPath(project.path)
      queryClient.invalidateQueries({ queryKey: sessionsQueryKey(project.path) })
    }
  }

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
    queryKey: ["connection", openCodeService.baseUrl],
    queryFn: () => openCodeService.checkConnection(),
    refetchInterval: (data) => (data ? false : 3000),
  })

  const { data: sessions = [] } = useSessions()

  const createSession = useMutation({
    mutationFn: async () => {
      const response = await openCodeService.client.session.create({
        directory: openCodeService.directory,
      })
      return response.data
    },
    onSuccess: (data) => {
      if (data?.id) {
        setActiveSessionId(data.id)
        queryClient.invalidateQueries({ queryKey: sessionsQueryKey(openCodeService.directory) })
      }
    },
  })

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

  return (
    <div className="flex h-full flex-col bg-[#f7f5f1]">
      {connected && <TopBar connected={connected} />}
      
      {!connected ? (
        <div className="app-shell flex h-full items-center justify-center bg-[#f7f5f1]">
          <div className="panel-surface flex w-[420px] flex-col gap-4 rounded-3xl p-8 text-center border-black/10 shadow-2xl bg-white">
            <div className="text-xs uppercase tracking-[0.3em] text-muted">Connection guard</div>
            <div className="text-2xl font-semibold">Waiting for OpenCode server</div>
            <div className="text-sm text-muted">
              Make sure the OpenCode backend is running at <span className="code-inline">{openCodeService.baseUrl}</span>
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
              onSelectSession={setActiveSessionId}
              onNewSession={() => createSession.mutate()}
              onLoadMore={() => {}}
            />
          )}

          <main className="flex h-full min-w-0 flex-1 flex-col p-4 pl-2 pr-4 pb-4">
            <div className="flex h-full overflow-hidden rounded-[32px] border border-black/10 bg-white shadow-sm">
              <div className="flex flex-1 flex-col min-w-0 relative">
                <div className="flex min-h-0 flex-1 flex-col">
                  <AgentConsole 
                    sessionId={activeSessionId} 
                    onSessionCreated={setActiveSessionId} 
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
                  <FileTree />
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
