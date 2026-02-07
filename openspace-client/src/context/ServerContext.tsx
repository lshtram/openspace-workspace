import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { storage } from "../utils/storage"
import { normalizeServerUrl } from "../utils/server"
import { openCodeService } from "../services/OpenCodeClient"

type ServerContextType = {
  activeUrl: string
  defaultUrl: string | null
  servers: string[]
  addServer: (url: string) => void
  setActive: (url: string) => void
  removeServer: (url: string) => void
  replaceServer: (original: string, next: string) => void
  setDefault: (url: string | null) => void
}

const ServerContext = createContext<ServerContextType | undefined>(undefined)

type ServerProviderProps = {
  children: ReactNode
}

const defaultBaseUrl = normalizeServerUrl(import.meta.env.VITE_OPENCODE_URL || "http://localhost:3000") || "http://localhost:3000"

export function ServerProvider({ children }: ServerProviderProps) {
  const [servers, setServers] = useState<string[]>(() => storage.getServers())
  const [defaultUrl, setDefaultUrl] = useState<string | null>(() => storage.getDefaultServer())
  const [activeUrl, setActiveUrl] = useState<string>(() => {
    const stored = storage.getActiveServer()
    const initial = stored || defaultUrl || defaultBaseUrl
    openCodeService.setBaseUrl(initial)
    return initial
  })
  
  useEffect(() => {
    storage.saveActiveServer(activeUrl)
  }, [activeUrl])

  useEffect(() => {
    storage.saveServers(servers)
  }, [servers])

  useEffect(() => {
    storage.saveDefaultServer(defaultUrl)
  }, [defaultUrl])

  const addServer = useCallback((url: string) => {
    const normalized = normalizeServerUrl(url)
    if (!normalized) return
    setServers((prev) => (prev.includes(normalized) ? prev : [...prev, normalized]))
    openCodeService.setBaseUrl(normalized)
    setActiveUrl(normalized)
  }, [])

  const setActive = useCallback((url: string) => {
    const normalized = normalizeServerUrl(url)
    if (!normalized) return
    openCodeService.setBaseUrl(normalized)
    setActiveUrl(normalized)
  }, [])

  const removeServer = useCallback((url: string) => {
    const normalized = normalizeServerUrl(url)
    if (!normalized) return

    setServers((prevServers) => {
      const nextServers = prevServers.filter((item) => item !== normalized)

      setDefaultUrl((prevDefault) => {
        const nextDefault = prevDefault === normalized ? null : prevDefault

        setActiveUrl((prevActive) => {
          if (prevActive !== normalized) return prevActive
          const nextActive = nextDefault ?? nextServers[0] ?? defaultBaseUrl
          openCodeService.setBaseUrl(nextActive)
          return nextActive
        })

        return nextDefault
      })

      return nextServers
    })
  }, [])

  const replaceServer = useCallback((original: string, next: string) => {
    const normalizedOriginal = normalizeServerUrl(original)
    const normalizedNext = normalizeServerUrl(next)
    if (!normalizedOriginal || !normalizedNext) return

    setServers((prev) => {
      const filtered = prev.filter((item) => item !== normalizedOriginal)
      return filtered.includes(normalizedNext) ? filtered : [...filtered, normalizedNext]
    })

    setDefaultUrl((prev) => (prev === normalizedOriginal ? normalizedNext : prev))
    setActiveUrl((prev) => {
      if (prev !== normalizedOriginal) return prev
      openCodeService.setBaseUrl(normalizedNext)
      return normalizedNext
    })
  }, [])

  const setDefault = useCallback((url: string | null) => {
    if (!url) {
      setDefaultUrl(null)
      return
    }
    const normalized = normalizeServerUrl(url)
    if (!normalized) return
    setDefaultUrl(normalized)
  }, [])

  const value = useMemo<ServerContextType>(
    () => ({ activeUrl, defaultUrl, servers, addServer, setActive, removeServer, replaceServer, setDefault }),
    [activeUrl, defaultUrl, servers, addServer, setActive, removeServer, replaceServer, setDefault],
  )

  return <ServerContext.Provider value={value}>{children}</ServerContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useServer() {
  const context = useContext(ServerContext)
  if (!context) throw new Error("useServer must be used within ServerProvider")
  return context
}
