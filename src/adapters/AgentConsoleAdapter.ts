import type { IAgentConsole, IMessage } from '../interfaces/IAgentConsole'
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

  async sendMessage(content: string): Promise<void> {
    if (!this.sessionId) throw new Error('Session not initialized')

    try {
      const response = await openCodeService.session.prompt({
        path: { id: this.sessionId },
        body: {
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
