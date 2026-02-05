import type { IAgentConsole, IMessage, IModel } from '../interfaces/IAgentConsole'
import { openCodeService } from '../services/OpenCodeClient'

export class AgentConsoleAdapter implements IAgentConsole {
  private sessionId?: string
  private callbacks: Record<string, ((data: any) => void)[]> = {
    message: [],
    stream: [],
    error: [],
  }

  async initialize(config: { sessionId?: string }): Promise<void> {
    if (config.sessionId) {
      this.sessionId = config.sessionId
    } else {
      // Create a new session if none provided
      const response = await openCodeService.session.create({
        body: {
          title: 'OpenSpace Session',
        }
      })
      if (response.data) {
        this.sessionId = response.data.id
      }
    }
  }

  async sendMessage(content: string, model?: IModel): Promise<void> {
    if (!this.sessionId) throw new Error('Session not initialized')

    try {
      const response = await openCodeService.session.prompt({
        path: { id: this.sessionId },
        body: {
          model: model ? {
            providerID: model.providerID,
            modelID: model.id
          } : undefined,
          parts: [{
            type: 'text',
            text: content
          } as any]
        }
      })

      if (response.data) {
        // Handle streaming if the SDK supports it via callbacks or events
        // For now we'll just emit the full message
        this.emit('message', response.data)
      }
    } catch (error) {
      this.emit('error', error)
    }
  }

  async getHistory(): Promise<IMessage[]> {
    if (!this.sessionId) return []
    
    const response = await openCodeService.session.messages({
      path: { id: this.sessionId }
    })

    if (!response.data) return []

    return (response.data as any[]).map((msg: any) => ({
      id: msg.info.id,
      role: msg.info.role,
      content: msg.parts.map((p: any) => p.text).join('\n'),
      timestamp: msg.info.created_at,
      tools: msg.info.tools,
    }))
  }

  async getModels(): Promise<IModel[]> {
    const response = await openCodeService.client.provider.list()
    if (!response.data) return []

    const models: IModel[] = []
    response.data.all.forEach(provider => {
      Object.entries(provider.models).forEach(([modelId, model]: [string, any]) => {
        models.push({
          id: modelId,
          name: model.name,
          providerID: provider.id,
        })
      })
    })

    return models
  }

  on(event: 'message' | 'stream' | 'error', callback: (data: any) => void): void {
    this.callbacks[event].push(callback)
  }

  private emit(event: string, data: any) {
    this.callbacks[event]?.forEach(cb => cb(data))
  }

  dispose(): void {
    this.callbacks = { message: [], stream: [], error: [] }
  }
}
