import { useEffect, useMemo, useState } from "react"
import { File as FileIcon, Search } from "lucide-react"
import * as ScrollArea from "@radix-ui/react-scroll-area"
import { openCodeService } from "../services/OpenCodeClient"
import { useDialog } from "../context/DialogContext"
import type { FileNode } from "../lib/opencode/v2/gen/types.gen"

type DialogOpenFileProps = {
  directory: string
  onSelect?: (path: string) => void
}

type FileOption = {
  path: string
  absolute: string
  name: string
}

const MAX_DEPTH = 2
const MAX_FILES = 400

async function collectFiles(directory: string): Promise<FileOption[]> {
  const queue: Array<{ path: string; depth: number }> = [{ path: ".", depth: 0 }]
  const seen = new Set<string>()
  const files: FileOption[] = []

  while (queue.length > 0 && files.length < MAX_FILES) {
    const item = queue.shift()
    if (!item) break
    if (seen.has(item.path)) continue
    seen.add(item.path)

    let nodes: FileNode[] = []
    try {
      const response = await openCodeService.client.file.list({
        directory,
        path: item.path,
      })
      nodes = Array.isArray(response.data) ? response.data : []
    } catch {
      continue
    }

    for (const node of nodes) {
      if (node.type === "file") {
        files.push({
          path: node.path,
          absolute: node.absolute,
          name: node.name,
        })
      } else if (item.depth < MAX_DEPTH && !node.ignored) {
        queue.push({ path: node.path, depth: item.depth + 1 })
      }

      if (files.length >= MAX_FILES) break
    }
  }

  return files.sort((a, b) => a.path.localeCompare(b.path))
}

export function DialogOpenFile({ directory, onSelect }: DialogOpenFileProps) {
  const { close } = useDialog()
  const [query, setQuery] = useState("")
  const [files, setFiles] = useState<FileOption[]>([])
  const [loadedDirectory, setLoadedDirectory] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    void collectFiles(directory)
      .then((result) => {
        if (!active) return
        setFiles(result)
      })
      .finally(() => {
        if (active) setLoadedDirectory(directory)
      })
    return () => {
      active = false
    }
  }, [directory])

  const loading = loadedDirectory !== directory

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return files
    return files.filter((file) => file.path.toLowerCase().includes(normalized))
  }, [files, query])

  const handleSelect = (path: string) => {
    onSelect?.(path)
    close()
  }

  return (
    <div data-testid="open-file-dialog" className="flex h-[560px] flex-col">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-[#1d1a17]">Open file</h2>
        <p className="text-[13px] text-black/50">Quickly find a file in the active project.</p>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          autoFocus
          data-testid="open-file-input"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search files..."
          className="w-full rounded-xl border border-black/10 bg-black/[0.02] py-2.5 pl-10 pr-4 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-black/5"
        />
      </div>

      <ScrollArea.Root className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-black/[0.06] bg-black/[0.01]">
        <ScrollArea.Viewport className="h-full w-full">
          <div className="space-y-0.5 p-1">
            {loading ? (
              <div className="px-3 py-6 text-sm text-black/45">Loading files...</div>
            ) : filtered.length === 0 ? (
              <div className="px-3 py-6 text-sm text-black/45">No files found.</div>
            ) : (
              filtered.map((file) => (
                <button
                  key={file.path}
                  type="button"
                  onClick={() => handleSelect(file.path)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-white hover:shadow-sm"
                >
                  <FileIcon className="h-4 w-4 shrink-0 text-black/40" />
                  <span className="min-w-0 flex-1 truncate text-sm text-[#1d1a17]">{file.path}</span>
                </button>
              ))
            )}
          </div>
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar orientation="vertical" className="w-1.5 p-0.5">
          <ScrollArea.Thumb className="rounded-full bg-black/10" />
        </ScrollArea.Scrollbar>
      </ScrollArea.Root>

      <div className="mt-4 text-[11px] text-black/35">Showing up to 400 files across top-level folders.</div>
    </div>
  )
}
