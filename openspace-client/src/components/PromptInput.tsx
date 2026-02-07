import clsx from "clsx"
import { useMemo, useRef, useState, type KeyboardEvent } from "react"
import { Image, ArrowUp, Square } from "lucide-react"
import type { PromptAttachment } from "../types/opencode"

type PromptInputProps = {
  value: string
  disabled?: boolean
  isPending?: boolean
  attachments: PromptAttachment[]
  onChange: (value: string) => void
  onSubmit: () => void
  onAddAttachment: (files: FileList | null) => void
  onRemoveAttachment: (id: string) => void
  onAbort?: () => void
  leftSection?: React.ReactNode
  rightSection?: React.ReactNode
  fileSuggestions?: string[]
  projectRootName?: string
}

export function PromptInput({
  value,
  disabled,
  isPending,
  attachments,
  onChange,
  onSubmit,
  onAddAttachment,
  onRemoveAttachment,
  onAbort,
  leftSection,
  rightSection,
  fileSuggestions = [],
  projectRootName,
}: PromptInputProps) {
  const fileRef = useRef<HTMLInputElement | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  const suggestionContext = useMemo(() => {
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

    const getFiltered = (rawQuery: string) => {
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

    const textarea = textareaRef.current
    const cursor = textarea?.selectionStart ?? value.length
    const before = value.slice(0, cursor)

    const openMatch = before.match(/(?:^|\s)\/open\s+([^\n]*)$/)
    if (openMatch) {
      const query = openMatch[1]?.trim() ?? ""
      const filtered = getFiltered(query)
      const openTokenStart = before.lastIndexOf("/open", cursor)
      return {
        mode: "open" as const,
        query,
        filtered,
        replaceStart: openTokenStart >= 0 ? openTokenStart : cursor - openMatch[1].length,
      }
    }

    const mentionMatch = before.match(/(?:^|\s)@([^\s@]*)$/)
    if (mentionMatch) {
      const query = mentionMatch[1] ?? ""
      const filtered = getFiltered(query)
      return {
        mode: "mention" as const,
        query,
        filtered,
        replaceStart: cursor - mentionMatch[1].length - 1,
      }
    }

    return null
  }, [fileSuggestions, projectRootName, value])

  const selectSuggestion = (selectedPath: string) => {
    const textarea = textareaRef.current
    if (!textarea || !suggestionContext) return
    const cursor = textarea.selectionStart ?? value.length
    const before = value.slice(0, suggestionContext.replaceStart)
    const after = value.slice(cursor)
    const next = `${before}@${selectedPath} ${after}`
    onChange(next)
    requestAnimationFrame(() => {
      const pos = before.length + selectedPath.length + 2
      textarea.focus()
      textarea.setSelectionRange(pos, pos)
    })
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    const hasSuggestions = Boolean(suggestionContext && suggestionContext.filtered.length > 0)

    if (hasSuggestions && event.key === "ArrowDown") {
      event.preventDefault()
      setActiveIndex((prev) => (prev + 1) % suggestionContext!.filtered.length)
      return
    }
    if (hasSuggestions && event.key === "ArrowUp") {
      event.preventDefault()
      setActiveIndex((prev) => (prev - 1 + suggestionContext!.filtered.length) % suggestionContext!.filtered.length)
      return
    }
    if (hasSuggestions && (event.key === "Tab" || event.key === "Enter")) {
      event.preventDefault()
      selectSuggestion(suggestionContext!.filtered[activeIndex] ?? suggestionContext!.filtered[0])
      setActiveIndex(0)
      return
    }

    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      onSubmit()
    }
  }

  const handleTextareaInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget
    target.style.height = "auto"
    target.style.height = `${target.scrollHeight}px`
  }

  return (
    <div className="flex w-full flex-col gap-2 px-4 pb-4">
      <div className="relative flex w-full flex-col overflow-hidden rounded-[26px] border border-black/10 bg-white shadow-sm transition-shadow focus-within:shadow-md">
        <div className="flex flex-col px-5 pt-4">
          <textarea
            ref={textareaRef}
            rows={1}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={handleTextareaInput}
            placeholder='Ask anything... "Review my code for best practices"'
            className="w-full resize-none border-none bg-transparent p-0 text-[15px] leading-relaxed text-[#1d1a17] outline-none placeholder:text-[#a0a0a0]"
            disabled={disabled}
            style={{ minHeight: '24px', maxHeight: '400px' }}
          />

          {suggestionContext && suggestionContext.filtered.length > 0 && (
            <div
              data-testid="prompt-suggestion-list"
              className="mt-2 max-h-44 overflow-y-auto rounded-lg border border-black/10 bg-white p-1 shadow-sm"
            >
              {suggestionContext.filtered.map((item, index) => (
                <button
                  key={item}
                  type="button"
                  data-testid="prompt-suggestion-item"
                  data-selected={index === activeIndex ? "true" : "false"}
                  className={clsx(
                    "flex w-full items-center rounded-md px-2 py-1.5 text-left text-xs",
                    index === activeIndex ? "bg-black/10 text-black" : "text-black/70 hover:bg-black/5",
                  )}
                  onClick={() => selectSuggestion(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          )}
          
          {attachments.length > 0 && (
            <div className="mb-2 mt-3 flex flex-wrap gap-2">
              {attachments.map((item) => (
                <div
                  key={item.id}
                  className="group relative flex h-16 w-16 overflow-hidden rounded-xl border border-black/5"
                >
                  {item.mime.startsWith("image/") ? (
                    <img src={item.dataUrl} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-black/5 text-[10px] font-medium uppercase tracking-tighter">
                      PDF
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => onRemoveAttachment(item.id)}
                    className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <span className="text-[10px]">×</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-3 py-2.5">
          <div className="flex items-center gap-1">
            {leftSection}
          </div>
          
          <div className="flex items-center gap-1.5">
            {rightSection}
            
            <button
              type="button"
              disabled={disabled && !isPending}
              onClick={() => fileRef.current?.click()}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[#1d1a17]/40 transition hover:bg-black/5 hover:text-[#1d1a17]"
            >
              <Image className="h-4.5 w-4.5" />
            </button>
            
            <button
              type="button"
              onClick={isPending ? onAbort : onSubmit}
              disabled={!isPending && !value.trim() && attachments.length === 0}
              className={clsx(
                "flex h-8 w-8 items-center justify-center rounded-lg transition-all",
                isPending
                  ? "bg-red-500 text-white hover:bg-red-600"
                  : value.trim() || attachments.length > 0
                    ? "bg-[#1d1a17] text-white"
                    : "bg-black/5 text-[#1d1a17]/20"
              )}
            >
              {isPending ? (
                <Square className="h-3.5 w-3.5 fill-current" />
              ) : (
                <ArrowUp className="h-4.5 w-4.5 stroke-[2.5]" />
              )}
            </button>
          </div>
        </div>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        multiple
        onChange={(event) => onAddAttachment(event.target.files)}
      />
    </div>
  )
}
