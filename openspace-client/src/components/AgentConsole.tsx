import { useMemo, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { Message, Part } from "../lib/opencode/v2/gen/types.gen"
import { openCodeService } from "../services/OpenCodeClient"
import { useAgents } from "../hooks/useAgents"
import { useMessages, messagesQueryKey } from "../hooks/useMessages"
import { useModels } from "../hooks/useModels"
import { useSessionEvents } from "../hooks/useSessionEvents"
import type { MessageEntry, ModelOption, PromptAttachment } from "../types/opencode"
import { AgentSelector } from "./AgentSelector"
import { ContextMeter } from "./ContextMeter"
import { MessageList } from "./MessageList"
import { ModelSelector } from "./ModelSelector"
import { PromptInput } from "./PromptInput"

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
}

export function AgentConsole({ sessionId, onSessionCreated }: AgentConsoleProps) {
  const queryClient = useQueryClient()
  const [selectedModelId, setSelectedModelId] = useState<string | undefined>(undefined)
  const [selectedAgent, setSelectedAgent] = useState<string | undefined>(undefined)
  const [prompt, setPrompt] = useState("")
  const [attachments, setAttachments] = useState<PromptAttachment[]>([])
  const agentsQuery = useAgents()
  const modelsQuery = useModels()
  const messagesQuery = useMessages(sessionId)
  useSessionEvents(sessionId)

  const models = useMemo(() => modelsQuery.data?.models ?? [], [modelsQuery.data])
  const defaultModelId = modelsQuery.data?.defaultModelId
  const activeModelId = selectedModelId ?? defaultModelId
  const selectedModel = models.find((model) => model.id === activeModelId)

  const agentNames = useMemo(
    () => (Array.isArray(agentsQuery.data) ? agentsQuery.data.map((agent) => agent.name) : []),
    [agentsQuery.data],
  )
  const defaultAgent = agentNames.includes("build") ? "build" : agentNames[0]
  const activeAgent = selectedAgent ?? defaultAgent

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

  const createSession = useMutation({
    mutationFn: async () => {
      const response = await openCodeService.client.session.create({
        directory: openCodeService.directory,
      })
      return response.data ?? null
    },
    onSuccess: (data) => {
      if (data?.id) onSessionCreated?.(data.id)
    },
  })

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
    }) =>
      openCodeService.client.session.prompt({
        sessionID: id,
        directory: openCodeService.directory,
        agent,
        model: {
          providerID: model.providerID,
          modelID: model.id,
        },
        parts,
      }),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: messagesQueryKey(variables.id) })
      const previousMessages = queryClient.getQueryData<MessageEntry[]>(messagesQueryKey(variables.id))
      
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

      queryClient.setQueryData<MessageEntry[]>(messagesQueryKey(variables.id), (prev) => [...(prev ?? []), optimisticMsg])
      
      return { previousMessages }
    },
    onError: (_err, variables, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(messagesQueryKey(variables.id), context.previousMessages)
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: messagesQueryKey(variables.id) })
    },
  })

  const sendMessage = async () => {
    const text = prompt.trim()
    if (!text && attachments.length === 0) return
    if (!selectedModel || !activeAgent) return

    let activeSessionId = sessionId
    if (!activeSessionId) {
      const created = await createSession.mutateAsync()
      activeSessionId = created?.id
    }
    if (!activeSessionId) return

    setPrompt("")
    setAttachments([])

    const partsInput = [
      ...(text
        ? [
            {
              type: "text" as const,
              text,
            },
          ]
        : []),
      ...attachments.map((file) => ({
        type: "file" as const,
        mime: file.mime,
        filename: file.name,
        url: file.dataUrl,
      })),
    ]

    promptMutation.mutate({
      id: activeSessionId,
      model: selectedModel,
      agent: activeAgent,
      parts: partsInput,
    })
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
    () => (Array.isArray(messagesQuery.data) ? messagesQuery.data.map((entry) => entry.info) : []),
    [messagesQuery.data],
  )

  const parts = useMemo<Record<string, Part[]>>(() => {
    const map: Record<string, Part[]> = {}
    const entries = Array.isArray(messagesQuery.data) ? messagesQuery.data : []
    for (const entry of entries) {
      map[entry.info.id] = entry.parts
    }
    return map
  }, [messagesQuery.data])

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1 overflow-hidden">
        <MessageList messages={messages} parts={parts} isPending={promptMutation.isPending} />
      </div>
      <PromptInput
        value={prompt}
        attachments={attachments}
        onChange={setPrompt}
        onSubmit={sendMessage}
        onAddAttachment={onAddAttachment}
        onRemoveAttachment={onRemoveAttachment}
        disabled={promptMutation.isPending || createSession.isPending}
        isPending={promptMutation.isPending}
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
