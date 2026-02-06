export * from "./gen/types.gen.js"

import { createClient } from "./gen/client/client.gen.js"
import { type Config } from "./gen/client/types.gen.js"
import { OpencodeClient } from "./gen/sdk.gen.js"
export { type Config as OpencodeClientConfig, OpencodeClient }

export function createOpencodeClient(config?: Config & { directory?: string }) {
  if (!config?.fetch) {
    const customFetch = (req: Request & { timeout?: boolean }) => {
      req.timeout = false
      return fetch(req)
    }
    config = {
      ...config,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fetch: customFetch as any,
    }
  }

  if (config?.directory) {
    const isNonASCII = Array.from(config.directory).some((char) => char.charCodeAt(0) > 127)
    const encodedDirectory = isNonASCII ? encodeURIComponent(config.directory) : config.directory
    config.headers = {
      ...config.headers,
      "x-opencode-directory": encodedDirectory,
    }
  }

  const client = createClient(config)
  return new OpencodeClient({ client })
}
