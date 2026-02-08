export type StoredProject = {
  path: string
  name: string
  color: string
}

export type StoredWorkspaceMeta = {
  directory: string
  label?: string
  enabled?: boolean
  order?: number
}

const PROJECTS_KEY = "openspace.projects"
const LAST_PROJECT_KEY = "openspace.last_project"
const SERVERS_KEY = "openspace.servers"
const ACTIVE_SERVER_KEY = "openspace.active_server"
const DEFAULT_SERVER_KEY = "openspace.default_server"
const SESSION_SEEN_KEY = "openspace.session_seen"
const WORKSPACES_KEY = "openspace.workspaces"
export const STORAGE_SCHEMA_VERSION_KEY = "openspace.storage_version"
export const STORAGE_SCHEMA_VERSION = 1

const parseProjectsPayload = (raw: string | null): StoredProject[] => {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter(
        (item): item is { path: string; name: string; color?: string } =>
          Boolean(item) &&
          typeof item === "object" &&
          typeof item.path === "string" &&
          typeof item.name === "string",
      )
      .map((item) => ({
        path: item.path,
        name: item.name,
        color: typeof item.color === "string" ? item.color : "bg-[#fce7f3]",
      }))
  } catch {
    return []
  }
}

const parseServersPayload = (raw: string | null): string[] => {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
  } catch {
    return []
  }
}

const parseSessionSeenPayload = (raw: string | null): Record<string, number> => {
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {}
    const map: Record<string, number> = {}
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === "number" && Number.isFinite(value)) {
        map[key] = value
      }
    }
    return map
  } catch {
    return {}
  }
}

const parseWorkspaceMetaPayload = (raw: string | null): StoredWorkspaceMeta[] => {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    const valid = parsed
      .filter(
        (item): item is StoredWorkspaceMeta =>
          Boolean(item) &&
          typeof item === "object" &&
          typeof item.directory === "string" &&
          item.directory.trim().length > 0,
      )
      .map((item) => ({
        directory: item.directory,
        label: typeof item.label === "string" ? item.label : undefined,
        enabled: typeof item.enabled === "boolean" ? item.enabled : undefined,
        order: typeof item.order === "number" && Number.isFinite(item.order) ? item.order : undefined,
      }))
    return valid.sort((a, b) => {
      const orderA = typeof a.order === "number" ? a.order : 0
      const orderB = typeof b.order === "number" ? b.order : 0
      return orderA - orderB
    })
  } catch {
    return []
  }
}

const ensureStorageSchema = () => {
  try {
    const rawVersion = localStorage.getItem(STORAGE_SCHEMA_VERSION_KEY)
    const version = Number(rawVersion)
    if (Number.isFinite(version) && version >= STORAGE_SCHEMA_VERSION) return

    // Migrate and normalize persisted payloads to canonical shapes.
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(parseProjectsPayload(localStorage.getItem(PROJECTS_KEY))))
    localStorage.setItem(SERVERS_KEY, JSON.stringify(parseServersPayload(localStorage.getItem(SERVERS_KEY))))
    localStorage.setItem(SESSION_SEEN_KEY, JSON.stringify(parseSessionSeenPayload(localStorage.getItem(SESSION_SEEN_KEY))))
    localStorage.setItem(WORKSPACES_KEY, JSON.stringify(parseWorkspaceMetaPayload(localStorage.getItem(WORKSPACES_KEY))))
    localStorage.setItem(STORAGE_SCHEMA_VERSION_KEY, String(STORAGE_SCHEMA_VERSION))
  } catch {
    // Best effort migration only.
  }
}

export const storage = {
  getProjects: (): StoredProject[] => {
    ensureStorageSchema()
    return parseProjectsPayload(localStorage.getItem(PROJECTS_KEY))
  },
  saveProjects: (projects: StoredProject[]) => {
    ensureStorageSchema()
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects))
  },
  getLastProjectPath: (): string | null => {
    ensureStorageSchema()
    return localStorage.getItem(LAST_PROJECT_KEY)
  },
  saveLastProjectPath: (path: string) => {
    ensureStorageSchema()
    localStorage.setItem(LAST_PROJECT_KEY, path)
  },
  getServers: (): string[] => {
    ensureStorageSchema()
    return parseServersPayload(localStorage.getItem(SERVERS_KEY))
  },
  saveServers: (servers: string[]) => {
    ensureStorageSchema()
    localStorage.setItem(SERVERS_KEY, JSON.stringify(servers))
  },
  getActiveServer: (): string | null => {
    ensureStorageSchema()
    return localStorage.getItem(ACTIVE_SERVER_KEY)
  },
  saveActiveServer: (url: string) => {
    ensureStorageSchema()
    localStorage.setItem(ACTIVE_SERVER_KEY, url)
  },
  getDefaultServer: (): string | null => {
    ensureStorageSchema()
    return localStorage.getItem(DEFAULT_SERVER_KEY)
  },
  saveDefaultServer: (url: string | null) => {
    ensureStorageSchema()
    if (!url) {
      localStorage.removeItem(DEFAULT_SERVER_KEY)
      return
    }
    localStorage.setItem(DEFAULT_SERVER_KEY, url)
  },
  getSessionSeenMap: (): Record<string, number> => {
    ensureStorageSchema()
    return parseSessionSeenPayload(localStorage.getItem(SESSION_SEEN_KEY))
  },
  saveSessionSeenMap: (map: Record<string, number>) => {
    ensureStorageSchema()
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
  getWorkspaceMeta: (): StoredWorkspaceMeta[] => {
    ensureStorageSchema()
    return parseWorkspaceMetaPayload(localStorage.getItem(WORKSPACES_KEY))
  },
  saveWorkspaceMeta: (meta: StoredWorkspaceMeta[]) => {
    ensureStorageSchema()
    localStorage.setItem(WORKSPACES_KEY, JSON.stringify(meta))
  },
  updateWorkspaceMeta: (directory: string, patch: Partial<StoredWorkspaceMeta>) => {
    const metas = storage.getWorkspaceMeta()
    const index = metas.findIndex((item) => item.directory === directory)
    if (index >= 0) {
      metas[index] = { ...metas[index], ...patch }
    } else {
      metas.push({ directory, ...patch })
    }
    storage.saveWorkspaceMeta(metas)
  },
}
