import { createOpencodeClient, OpencodeClient } from "../lib/opencode/v2/client"
import type { Client } from "../lib/opencode/v2/gen/client/types.gen"
import { pushToastOnce } from "../utils/toastStore"

const baseUrl = import.meta.env.VITE_OPENCODE_URL || "http://localhost:3000"

const formatErrorMessage = (error: unknown) => {
  if (!error) return "Unknown error"
  if (typeof error === "string") return error
  if (error instanceof Error) return error.message
  if (typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message
  }
  try {
    return JSON.stringify(error)
  } catch {
    return "Unexpected error"
  }
}

export class OpenCodeService {
  private static instance: OpenCodeService
  public client: OpencodeClient
  public baseUrl = baseUrl
  private _isConnected = false
  public directory = import.meta.env.VITE_OPENCODE_DIRECTORY ?? ""

  private constructor() {
    this.client = createOpencodeClient({ baseUrl, directory: this.directory })
    this.registerErrorInterceptor()
  }

  public static getInstance(): OpenCodeService {
    if (!OpenCodeService.instance) {
      OpenCodeService.instance = new OpenCodeService()
    }
    return OpenCodeService.instance
  }

  private rebuildClient() {
    this.client = createOpencodeClient({ baseUrl: this.baseUrl, directory: this.directory })
    this.registerErrorInterceptor()
  }

  private getRawClient() {
    return (this.client as unknown as { client?: Client }).client
  }

  private registerErrorInterceptor() {
    const rawClient = this.getRawClient()
    if (!rawClient) return

    rawClient.interceptors.error.use((error, response, request, options) => {
      const meta = (options as { meta?: Record<string, unknown> } | undefined)?.meta
      if (meta?.suppressToast) return error

      const status = response?.status
      const method = request?.method ?? "REQUEST"
      let path = request?.url ?? ""

      if (request?.url) {
        try {
          const url = new URL(request.url)
          path = `${url.pathname}${url.search}`
        } catch {
          // use raw url
        }
      }

      const message = formatErrorMessage(error)
      const description = `${method} ${path}${message ? ` · ${message}` : ""}`

      pushToastOnce(`api:${method}:${path}:${message}`, {
        title: status ? `Request failed (${status})` : "Request failed",
        description,
        tone: "error",
      })

      console.error("OpenCode API error:", error)
      return error
    })
  }

  public setBaseUrl(url: string) {
    this.baseUrl = url
    this.rebuildClient()
  }

  public setDirectory(directory: string) {
    this.directory = directory
    this.rebuildClient()
  }

  public async checkConnection(): Promise<boolean> {
    try {
      await this.client.config.get(undefined, { meta: { suppressToast: true } })
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

  public get session() { return this.client.session }
  public get file() { return this.client.file }
  public get pty() { return this.client.pty }
  public get lsp() { return this.client.lsp }
  public get mcp() { return this.client.mcp }
  public get config() { return this.client.config }
  public get worktree() { return this.client.worktree }
}

export const openCodeService = OpenCodeService.getInstance()
