export type SuggestionMode = "open" | "mention"

export interface SuggestionContext {
  mode: SuggestionMode
  query: string
  filtered: string[]
  replaceStart: number
}

const normalizePath = (input: string) =>
  input.replace(/\\/g, "/").replace(/^\.?\//, "").trim()

const toSearchKey = (input: string) => input.toLowerCase().replace(/[^a-z0-9]/g, "")

const isSubsequence = (query: string, target: string) => {
  if (!query) return true
  let cursor = 0
  for (const char of target) {
    if (char === query[cursor]) cursor += 1
    if (cursor === query.length) return true
  }
  return false
}

const matchScore = (query: string, target: string) => {
  if (!query) return 0
  const queryKey = toSearchKey(query)
  const targetKey = toSearchKey(target)

  if (target.includes(query)) return 0
  if (isSubsequence(query, target)) return 1
  if (queryKey && targetKey.includes(queryKey)) return 2
  if (queryKey && isSubsequence(queryKey, targetKey)) return 3
  return null
}

export const getFilteredSuggestions = (
  rawQuery: string,
  fileSuggestions: string[],
  projectRootName?: string,
) => {
  const normalizedQuery = normalizePath(rawQuery).toLowerCase()
  const rootPrefix = projectRootName ? `${projectRootName.toLowerCase()}/` : ""
  const withoutRoot =
    rootPrefix && normalizedQuery.startsWith(rootPrefix)
      ? normalizedQuery.slice(rootPrefix.length)
      : normalizedQuery
  const queryVariants = Array.from(
    new Set([normalizedQuery, withoutRoot].filter((value) => value.length > 0)),
  )

  return fileSuggestions
    .map((item, index) => {
      const normalizedItem = normalizePath(item).toLowerCase()
      const rootPrefixedItem = rootPrefix ? `${rootPrefix}${normalizedItem}` : normalizedItem
      if (queryVariants.length === 0) {
        return { item, index, score: 0 }
      }

      let bestScore: number | null = null
      for (const query of queryVariants) {
        for (const target of [normalizedItem, rootPrefixedItem]) {
          const score = matchScore(query, target)
          if (score === null) continue
          if (bestScore === null || score < bestScore) bestScore = score
        }
      }

      if (bestScore === null) return null
      return { item, index, score: bestScore }
    })
    .filter((entry): entry is { item: string; index: number; score: number } => entry !== null)
    .sort((a, b) => (a.score === b.score ? a.index - b.index : a.score - b.score))
    .map((entry) => entry.item)
    .slice(0, 8)
}

export const getSuggestionContext = (
  value: string,
  cursor: number,
  fileSuggestions: string[],
  projectRootName?: string,
): SuggestionContext | null => {
  const before = value.slice(0, cursor)

  const openMatch = before.match(/(?:^|\s)\/open\s+([^\n]*)$/)
  if (openMatch) {
    const query = openMatch[1]?.trim() ?? ""
    const filtered = getFilteredSuggestions(query, fileSuggestions, projectRootName)
    const openTokenStart = before.lastIndexOf("/open", cursor)
    return {
      mode: "open",
      query,
      filtered,
      replaceStart: openTokenStart >= 0 ? openTokenStart : cursor - openMatch[1].length,
    }
  }

  const mentionMatch = before.match(/(?:^|\s)@([^\s@]*)$/)
  if (mentionMatch) {
    const query = mentionMatch[1] ?? ""
    const filtered = getFilteredSuggestions(query, fileSuggestions, projectRootName)
    return {
      mode: "mention",
      query,
      filtered,
      replaceStart: cursor - mentionMatch[1].length - 1,
    }
  }

  return null
}
