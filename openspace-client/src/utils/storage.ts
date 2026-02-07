export type StoredProject = {
  path: string
  name: string
  color: string
}

const PROJECTS_KEY = "openspace.projects"
const LAST_PROJECT_KEY = "openspace.last_project"
const SERVERS_KEY = "openspace.servers"
const ACTIVE_SERVER_KEY = "openspace.active_server"
const DEFAULT_SERVER_KEY = "openspace.default_server"
const SESSION_SEEN_KEY = "openspace.session_seen"

export const storage = {
  getProjects: (): StoredProject[] => {
    try {
      const data = localStorage.getItem(PROJECTS_KEY)
      return data ? JSON.parse(data) : []
    } catch {
      return []
    }
  },
  saveProjects: (projects: StoredProject[]) => {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects))
  },
  getLastProjectPath: (): string | null => {
    return localStorage.getItem(LAST_PROJECT_KEY)
  },
  saveLastProjectPath: (path: string) => {
    localStorage.setItem(LAST_PROJECT_KEY, path)
  },
  getServers: (): string[] => {
    try {
      const data = localStorage.getItem(SERVERS_KEY)
      return data ? JSON.parse(data) : []
    } catch {
      return []
    }
  },
  saveServers: (servers: string[]) => {
    localStorage.setItem(SERVERS_KEY, JSON.stringify(servers))
  },
  getActiveServer: (): string | null => {
    return localStorage.getItem(ACTIVE_SERVER_KEY)
  },
  saveActiveServer: (url: string) => {
    localStorage.setItem(ACTIVE_SERVER_KEY, url)
  },
  getDefaultServer: (): string | null => {
    return localStorage.getItem(DEFAULT_SERVER_KEY)
  },
  saveDefaultServer: (url: string | null) => {
    if (!url) {
      localStorage.removeItem(DEFAULT_SERVER_KEY)
      return
    }
    localStorage.setItem(DEFAULT_SERVER_KEY, url)
  },
  getSessionSeenMap: (): Record<string, number> => {
    try {
      const data = localStorage.getItem(SESSION_SEEN_KEY)
      return data ? JSON.parse(data) : {}
    } catch {
      return {}
    }
  },
  saveSessionSeenMap: (map: Record<string, number>) => {
    localStorage.setItem(SESSION_SEEN_KEY, JSON.stringify(map))
  },
  markSessionSeen: (sessionId: string, timestamp = Date.now()) => {
    const map = storage.getSessionSeenMap()
    map[sessionId] = timestamp
    storage.saveSessionSeenMap(map)
  },
  getSessionSeen: (sessionId: string): number | null => {
    const map = storage.getSessionSeenMap()
    return map[sessionId] ?? null
  },
}
