import { createOpencodeClient } from "../lib/opencode/v2/client"

export type ServerHealth = { healthy: boolean; version?: string }

type CheckServerHealthOptions = {
  timeoutMs?: number
  signal?: AbortSignal
}

const timeoutSignal = (timeoutMs: number) => {
  const timeout = (AbortSignal as unknown as { timeout?: (ms: number) => AbortSignal }).timeout
  return timeout ? timeout(timeoutMs) : undefined
}

export async function checkServerHealth(
  url: string,
  fetcher: typeof globalThis.fetch,
  opts?: CheckServerHealthOptions,
): Promise<ServerHealth> {
  const signal = opts?.signal ?? timeoutSignal(opts?.timeoutMs ?? 3000)
  const client = createOpencodeClient({ baseUrl: url, fetch: fetcher, signal })
  return client.global
    .health()
    .then((result) => ({ healthy: result.data?.healthy === true, version: result.data?.version }))
    .catch(() => ({ healthy: false }))
}
