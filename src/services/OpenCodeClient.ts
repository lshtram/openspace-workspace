import { createOpencodeClient, OpencodeClient } from '../lib/opencode/client'

const baseUrl = import.meta.env.VITE_OPENCODE_URL || 'http://localhost:3000'

export class OpenCodeService {
  private static instance: OpenCodeService
  public client: OpencodeClient
  private _isConnected = false
  public directory = '/Users/Shared/dev/openspace' // Default directory

  private constructor() {
    this.client = createOpencodeClient({ baseUrl, directory: this.directory })
  }

  public static getInstance(): OpenCodeService {
    if (!OpenCodeService.instance) {
      OpenCodeService.instance = new OpenCodeService()
    }
    return OpenCodeService.instance
  }

  public async checkConnection(): Promise<boolean> {
    try {
      // Use config.get() as a health check
      await this.client.config.get()
      this._isConnected = true
      return true
    } catch (error) {
      this._isConnected = false
      console.error('Failed to connect to OpenCode server:', error)
      return false
    }
  }

  public get isConnected(): boolean {
    return this._isConnected
  }

  // Helper getters for specific services
  public get session() { return this.client.session }
  public get file() { return this.client.file }
  public get pty() { return this.client.pty }
  public get lsp() { return this.client.lsp }
  public get mcp() { return this.client.mcp }
  public get config() { return this.client.config }
}

export const openCodeService = OpenCodeService.getInstance()
