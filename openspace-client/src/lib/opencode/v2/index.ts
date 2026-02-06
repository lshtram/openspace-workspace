export * from "./client.js"

import { createOpencodeClient } from "./client.js"

export async function createOpencode(options?: { baseUrl: string }) {
  const client = createOpencodeClient({
    baseUrl: options?.baseUrl || 'http://localhost:3000',
  })

  return {
    client,
  }
}
