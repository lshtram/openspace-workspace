import { useState, createContext, useContext, useCallback, type ReactNode } from "react"

export type OpenFile = {
  path: string
  name: string
  content?: string
  isModified?: boolean
}

type FileTabsContextType = {
  openFiles: OpenFile[]
  activeFilePath: string | null
  openFile: (file: OpenFile) => void
  closeFile: (path: string) => void
  setActiveFile: (path: string) => void
  updateFileContent: (path: string, content: string) => void
}

const FileTabsContext = createContext<FileTabsContextType | undefined>(undefined)

export function FileTabsProvider({ children }: { children: ReactNode }) {
  const [openFiles, setOpenFiles] = useState<OpenFile[]>([])
  const [activeFilePath, setActiveFilePath] = useState<string | null>(null)

  const openFile = useCallback((file: OpenFile) => {
    setOpenFiles((prev) => {
      const exists = prev.find((f) => f.path === file.path)
      if (exists) {
        setActiveFilePath(file.path)
        return prev
      }
      setActiveFilePath(file.path)
      return [...prev, file]
    })
  }, [])

  const closeFile = useCallback((path: string) => {
    setOpenFiles((prev) => {
      const index = prev.findIndex((f) => f.path === path)
      const newFiles = prev.filter((f) => f.path !== path)
      
      if (activeFilePath === path && newFiles.length > 0) {
        // Activate previous file or next file
        const newIndex = Math.min(index, newFiles.length - 1)
        setActiveFilePath(newFiles[newIndex]?.path || null)
      } else if (newFiles.length === 0) {
        setActiveFilePath(null)
      }
      
      return newFiles
    })
  }, [activeFilePath])

  const setActiveFile = useCallback((path: string) => {
    setActiveFilePath(path)
  }, [])

  const updateFileContent = useCallback((path: string, content: string) => {
    setOpenFiles((prev) =>
      prev.map((f) =>
        f.path === path ? { ...f, content, isModified: true } : f
      )
    )
  }, [])

  return (
    <FileTabsContext.Provider
      value={{
        openFiles,
        activeFilePath,
        openFile,
        closeFile,
        setActiveFile,
        updateFileContent,
      }}
    >
      {children}
    </FileTabsContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useFileTabs() {
  const context = useContext(FileTabsContext)
  if (!context) {
    throw new Error("useFileTabs must be used within FileTabsProvider")
  }
  return context
}
