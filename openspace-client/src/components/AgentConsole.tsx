import { useEffect, useMemo, useState, useRef } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { Message, Part, FileNode } from "../lib/opencode/v2/gen/types.gen"
import { openCodeService } from "../services/OpenCodeClient"
import { useAgents } from "../hooks/useAgents"
import { useMessages } from "../hooks/useMessages"
import { useModels } from "../hooks/useModels"
import { useSessionEvents } from "../hooks/useSessionEvents"
import { useServer } from "../context/ServerContext"
import type { MessageEntry, ModelOption, PromptAttachment } from "../types/opencode"
import { AgentSelector } from "./AgentSelector"
import { ContextMeter } from "./ContextMeter"
import { MessageList } from "./MessageList"
import { ModelSelector } from "./ModelSelector"
import { RichPromptInput } from "./RichPromptInput"
import { SETTINGS_UPDATED_EVENT, loadPreferredAgent } from "../utils/shortcuts"
import { useLayout } from "../context/LayoutContext"
import type { Prompt } from "./RichEditor"

const readAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error("Failed to read file"))
    reader.readAsDataURL(file)
  })

type AgentConsoleProps = {
  sessionId?: string
  onSessionCreated?: (id: string) => void
  directory?: string
}

export function AgentConsole({ sessionId, onSessionCreated, directory: directoryProp }: AgentConsoleProps) {
  const queryClient = useQueryClient()
  const server = useServer()
  const { setActiveWhiteboardPath } = useLayout()
  const directory = directoryProp ?? openCodeService.directory
  const [selectedModelId, setSelectedModelId] = useState<string | undefined>(undefined)
  const [selectedAgent, setSelectedAgent] = useState<string | undefined>(undefined)
  const [preferredAgent, setPreferredAgent] = useState<string | undefined>(() => loadPreferredAgent())
  const [prompt, setPrompt] = useState("")
  const [attachments, setAttachments] = useState<PromptAttachment[]>([])
  const [pendingSessionIds, setPendingSessionIds] = useState<Set<string>>(() => new Set())
  const [fileSuggestions, setFileSuggestions] = useState<string[]>([])
  const agentsQuery = useAgents(directory)
  const modelsQuery = useModels(directory)
  const messagesQuery = useMessages(sessionId, { directory })
  useSessionEvents(sessionId, directory)

  const models = useMemo(() => modelsQuery.data?.models ?? [], [modelsQuery.data])
  const defaultModelId = modelsQuery.data?.defaultModelId
  const activeModelId = selectedModelId ?? defaultModelId
  const selectedModel = models.find((model) => model.id === activeModelId)

  const agentNames = useMemo(
    () => (Array.isArray(agentsQuery.data) ? agentsQuery.data.map((agent) => agent.name) : []),
    [agentsQuery.data],
  )
  const preferredDefaultAgent = preferredAgent && agentNames.includes(preferredAgent) ? preferredAgent : undefined
  const defaultAgent = preferredDefaultAgent ?? (agentNames.includes("build") ? "build" : agentNames[0])
  const activeAgent = selectedAgent ?? defaultAgent

  useEffect(() => {
    const refreshPreferredAgent = () => {
      setPreferredAgent(loadPreferredAgent())
    }
    window.addEventListener(SETTINGS_UPDATED_EVENT, refreshPreferredAgent)
    return () => window.removeEventListener(SETTINGS_UPDATED_EVENT, refreshPreferredAgent)
  }, [])

  const onAddAttachment = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const next: PromptAttachment[] = []
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/") && file.type !== "application/pdf") continue
      const dataUrl = await readAsDataUrl(file)
      next.push({ id: crypto.randomUUID(), name: file.name, mime: file.type, dataUrl })
    }
    if (next.length > 0) setAttachments((prev) => [...prev, ...next])
  }

  const onRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((item) => item.id !== id))
  }

  useEffect(() => {
    if (!directory) return
    let cancelled = false

    const loadFiles = async () => {
      const files: string[] = []
      const visited = new Set<string>()
      const queue: string[] = ["."]
      let traversedDirs = 0
      const maxDirs = 250
      const maxFiles = 3000
      const ignoredDirectoryNames = new Set([
        ".git",
        ".next",
        ".turbo",
        ".vite",
        "build",
        "coverage",
        "dist",
        "node_modules",
        "out",
        "playwright-report",
        "test-results",
      ])

      const getBaseName = (input: string) => {
        const normalized = input.replace(/\\/g, "/").replace(/\/+$/, "")
        const parts = normalized.split("/")
        return parts[parts.length - 1] ?? normalized
      }

      const shouldSkipDirectory = (dirPath: string) => {
        const base = getBaseName(dirPath)
        return ignoredDirectoryNames.has(base)
      }

      while (queue.length > 0 && traversedDirs < maxDirs && files.length < maxFiles) {
        const dir = queue.shift()
        if (!dir || visited.has(dir)) continue
        visited.add(dir)
        traversedDirs += 1

        try {
          const response = await openCodeService.client.file.list({
            directory,
            path: dir,
          })
          const entries = (response.data ?? []) as FileNode[]
          for (const node of entries) {
            if (node.type === "file") {
              files.push(node.path)
              if (files.length >= maxFiles) break
            } else if (node.type === "directory") {
              if (!shouldSkipDirectory(node.path)) {
                queue.push(node.path)
              }
            }
          }
        } catch {
          // ignore suggestion errors; prompt works without this enhancement
        }
      }

      if (!cancelled) {
        const uniq = Array.from(new Set(files)).sort((a, b) => a.localeCompare(b))
        setFileSuggestions(uniq)
      }
    }

    void loadFiles()
    return () => {
      cancelled = true
    }
  }, [directory])

  const createSession = useMutation({
    mutationFn: async () => {
      const response = await openCodeService.client.session.create({
        directory,
      })
      return response.data ?? null
    },
    onSuccess: (data) => {
      if (data?.id) onSessionCreated?.(data.id)
    },
  })

  const abortControllersRef = useRef<Map<string, AbortController>>(new Map())

  const promptMutation = useMutation({
    mutationFn: async ({
      id,
      model,
      agent,
      parts,
    }: {
      id: string
      model: ModelOption
      agent: string
      parts: Array<
        | { type: "text"; text: string }
        | { type: "file"; mime: string; filename?: string; url: string }
      >
    }) => {
      const controller = new AbortController()
      abortControllersRef.current.set(id, controller)
      return openCodeService.client.session.prompt({
        sessionID: id,
        directory,
        agent,
        model: {
          providerID: model.providerID,
          modelID: model.id,
        },
        parts,
      }, { signal: controller.signal })
    },
    onMutate: async (variables) => {
      setPendingSessionIds((prev) => {
        const next = new Set(prev)
        next.add(variables.id)
        return next
      })
      const messagesKeyPrefix = ["messages", server.activeUrl, directory, variables.id]
      await queryClient.cancelQueries({
        queryKey: messagesKeyPrefix,
        exact: false,
      })
      const previousMessages = queryClient.getQueriesData<MessageEntry[]>({
        queryKey: messagesKeyPrefix,
        exact: false,
      })
      
      const userParts: Part[] = variables.parts.map(p => {
        if (p.type === "text") {
          return {
            id: crypto.randomUUID(),
            type: "text",
            text: p.text,
            messageID: "pending",
            sessionID: variables.id,
            time: { start: Date.now() }
          }
        }
        return {
          id: crypto.randomUUID(),
          type: "file",
          url: p.url,
          filename: p.filename,
          mime: p.mime,
          messageID: "pending",
          sessionID: variables.id,
          time: { start: Date.now() }
        }
      })

      const optimisticMsg: MessageEntry = {
        info: {
          id: "pending-" + Date.now(),
          sessionID: variables.id,
          role: "user",
          agent: variables.agent,
          model: {
            modelID: variables.model.id,
            providerID: variables.model.providerID
          },
          time: { created: Date.now() }
        },
        parts: userParts
      }

      queryClient.setQueriesData<MessageEntry[]>(
        { queryKey: messagesKeyPrefix, exact: false },
        (prev) => [...(prev ?? []), optimisticMsg],
      )
      
      return { previousMessages }
    },
    onError: (_err, _variables, context) => {
      if (context?.previousMessages) {
        context.previousMessages.forEach(([key, data]) => {
          queryClient.setQueryData(key, data)
        })
      }
    },
    onSettled: (_data, _error, variables) => {
      setPendingSessionIds((prev) => {
        const next = new Set(prev)
        next.delete(variables.id)
        return next
      })
      abortControllersRef.current.delete(variables.id)
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["messages", server.activeUrl, directory, variables.id],
        exact: false,
      })
    },
  })

  const sendMessage = async (richParts?: Prompt, mode: 'normal' | 'shell' = 'normal') => {
    const text = prompt.trim()
    const partsToUse = richParts || (text ? [{ type: 'text' as const, content: text }] : [])
    if (partsToUse.length === 0 && attachments.length === 0) return

    // Handle /whiteboard command
    const firstPart = partsToUse[0]
    if (firstPart?.type === 'text' && firstPart.content.startsWith('/whiteboard')) {
      const name = firstPart.content.replace('/whiteboard', '').trim() || 'unnamed'
      const path = `design/${name}.graph.mmd`
      setActiveWhiteboardPath(path)
      setPrompt("")
      return
    }

    if (!selectedModel || !activeAgent) return

    let activeSessionId = sessionId
    if (!activeSessionId) {
      const created = await createSession.mutateAsync()
      activeSessionId = created?.id
    }
    if (!activeSessionId) return

    setPrompt("")
    setAttachments([])

    if (mode === 'shell') {
      const commandText = partsToUse.map(p => ('content' in p ? p.content : '')).join('')
      openCodeService.client.session.shell({
        sessionID: activeSessionId,
        directory,
        agent: activeAgent,
        model: {
          providerID: selectedModel.providerID,
          modelID: selectedModel.id,
        },
        command: commandText,
      }).catch((err) => {
        console.error("Shell command failed:", err)
      })
      return
    }

    const partsInput = [
      ...partsToUse.map(p => {
        if (p.type === 'text') return { type: 'text' as const, text: p.content };
        if (p.type === 'file') return { 
          type: 'file' as const, 
          mime: 'text/plain', // Default mime for file references
          url: '', // Not used for references
          source: { type: 'file' as const, path: p.path } 
        };
        if (p.type === 'agent') return { 
          type: 'agent' as const, 
          name: p.name 
        };
        return null;
      }).filter(Boolean),
      ...attachments.map((file) => ({
        type: "file" as const,
        mime: file.mime,
        filename: file.name,
        url: file.dataUrl,
      })),
    ] as Array<
      | { type: "text"; text: string }
      | { type: "file"; mime: string; filename?: string; url: string; source?: { type: "file"; path: string } }
    >;

    promptMutation.mutate({
      id: activeSessionId,
      model: selectedModel,
      agent: activeAgent,
      parts: partsInput,
    })
  }

  const handleAbort = () => {
    if (!sessionId) return
    const controller = abortControllersRef.current.get(sessionId)
    if (controller) {
      controller.abort()
      abortControllersRef.current.delete(sessionId)
    }
  }

  const usage = useMemo(() => {
    const formatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })
    const entries = Array.isArray(messagesQuery.data) ? messagesQuery.data : []
    const assistantMessages = entries.map((entry) => entry.info).filter((item) => item.role === "assistant")
    const totalCost = assistantMessages.reduce((sum, item) => sum + (Number(item.cost) || 0), 0)
    const last = assistantMessages.at(-1)
    if (!last) {
      return { tokens: "0", percentage: 0, cost: formatter.format(totalCost) }
    }
    const totalTokens =
      (Number(last.tokens?.input) || 0) +
      (Number(last.tokens?.output) || 0) +
      (Number(last.tokens?.reasoning) || 0) +
      (Number(last.tokens?.cache?.read) || 0) +
      (Number(last.tokens?.cache?.write) || 0)
    const model = models.find(
      (item) => item.providerID === last.providerID && item.id === last.modelID,
    )
    const percentage = model?.contextLimit ? Math.round((totalTokens / model.contextLimit) * 100) : 0
    return {
      tokens: totalTokens.toLocaleString(),
      percentage,
      cost: formatter.format(totalCost),
    }
  }, [messagesQuery.data, models])

  const messages = useMemo<Message[]>(
    () => {
      if (!Array.isArray(messagesQuery.data)) return []
      // Filter out optimistic pending messages to avoid duplication
      // The server will send the real message via SSE
      return messagesQuery.data
        .filter((entry) => !entry.info.id.startsWith("pending-"))
        .map((entry) => entry.info)
    },
    [messagesQuery.data],
  )

  const parts = useMemo<Record<string, Part[]>>(() => {
    const map: Record<string, Part[]> = {}
    const entries = Array.isArray(messagesQuery.data) ? messagesQuery.data : []
    for (const entry of entries) {
      // Also filter out pending messages from parts
      if (!entry.info.id.startsWith("pending-")) {
        map[entry.info.id] = entry.parts
      }
    }
    return map
  }, [messagesQuery.data])

  const isPendingForSession = Boolean(sessionId && pendingSessionIds.has(sessionId))

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1 overflow-hidden">
        <MessageList
          messages={messages}
          parts={parts}
          isPending={isPendingForSession}
          hasMore={messagesQuery.hasMore}
          onLoadMore={messagesQuery.loadMore}
          isFetching={messagesQuery.isFetching}
        />
      </div>
      <RichPromptInput
        sessionId={sessionId}
        value={prompt}
        attachments={attachments}
        fileSuggestions={fileSuggestions}
        agentSuggestions={agentNames}
        onChange={setPrompt}
        onSubmit={sendMessage}
        onAddAttachment={onAddAttachment}
        onRemoveAttachment={onRemoveAttachment}
        onAbort={handleAbort}
        disabled={isPendingForSession || createSession.isPending}
        isPending={isPendingForSession}
        leftSection={
          <div className="flex items-center gap-1">
            <AgentSelector
              agents={agentNames}
              value={activeAgent ?? ""}
              onChange={setSelectedAgent}
            />
            <ModelSelector
              models={models}
              value={activeModelId}
              onChange={setSelectedModelId}
            />
            <span className="ml-1 text-[13px] font-medium text-[#a0a0a0]">Default</span>
          </div>
        }
        rightSection={
          <ContextMeter percentage={usage.percentage} tokens={usage.tokens} cost={usage.cost} />
        }
      />
    </div>
  )
}
