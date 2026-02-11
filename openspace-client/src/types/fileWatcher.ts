export const FILE_TREE_REFRESH_EVENT = "openspace:file-tree-refresh"
export const WATCHER_REFRESH_MIN_INTERVAL_MS = 2000

export type FileWatcherUpdatedProperties = {
  file: string
  event: "add" | "change" | "unlink"
}

export type FileTreeRefreshDetail = {
  directory: string
  files: string[]
  key: string
  triggeredAt: number
}

export function assertNonEmptyString(value: unknown, fieldName: string): asserts value is string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${fieldName} must be a non-empty string`)
  }
}

export function buildFileTreeRefreshKey(directory: string, files: readonly string[]): string {
  assertNonEmptyString(directory, "directory")
  if (!Array.isArray(files) || files.length === 0) {
    throw new Error("files must include at least one file path")
  }

  const normalized = files
    .filter((file): file is string => typeof file === "string" && file.trim().length > 0)
    .map((file) => file.trim())
    .sort((left, right) => left.localeCompare(right))

  if (normalized.length === 0) {
    throw new Error("files must include at least one non-empty path")
  }

  return `${directory}::${normalized.join("|")}`
}
