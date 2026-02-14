import type { Message, Part } from "../lib/opencode/v2/gen/types.gen"

export type ModelOption = {
  id: string
  name: string
  providerID: string
  providerName: string
  contextLimit?: number
  connected?: boolean
  enabled?: boolean
}

export type EventEnvelope = {
  type: string
  properties?: Record<string, unknown>
}

export type MessageEntry = {
  info: Message
  parts: Part[]
}

export type PromptAttachment = {
  id: string
  name: string
  mime: string
  dataUrl: string
}
