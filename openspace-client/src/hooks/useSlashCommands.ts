import { useQuery } from "@tanstack/react-query"
import { openCodeService } from "../services/OpenCodeClient"
import { useServer } from "../context/ServerContext"

export interface SlashCommand {
  name: string
  description?: string
  source?: "command" | "mcp" | "skill" | "local"
}

/**
 * Local-only commands that are always available (client-side features).
 */
const LOCAL_COMMANDS: SlashCommand[] = [
  { name: "whiteboard", description: "Open or create a whiteboard", source: "local" },
  { name: "editor", description: "Open a file in the editor", source: "local" },
  { name: "presentation", description: "Open a presentation deck", source: "local" },
]

export const slashCommandsQueryKey = (serverUrl?: string, directory?: string) => [
  "slash-commands",
  serverUrl,
  directory,
]

/**
 * Hook that fetches available slash commands from the OpenCode server
 * and merges them with local-only commands.
 *
 * Falls back to local-only commands if the server is unreachable.
 */
export function useSlashCommands(): {
  commands: SlashCommand[]
  loading: boolean
} {
  const server = useServer()

  const { data: serverCommands, isLoading } = useQuery({
    queryKey: slashCommandsQueryKey(server.activeUrl, openCodeService.directory),
    queryFn: async (): Promise<SlashCommand[]> => {
      const response = await openCodeService.client.command.list({
        directory: openCodeService.directory,
      })
      const commands = response.data
      if (!commands || !Array.isArray(commands)) return []

      return commands.map((cmd) => ({
        name: cmd.name,
        description: cmd.description,
        source: cmd.source ?? "command",
      }))
    },
    staleTime: 30_000, // Cache for 30s
    retry: 1,
    // Don't throw on error — we fall back to local commands
    meta: { suppressToast: true },
  })

  // Merge server commands with local commands, deduplicating by name.
  // Server commands take precedence if names collide.
  const serverNames = new Set((serverCommands ?? []).map((c) => c.name))
  const localOnly = LOCAL_COMMANDS.filter((c) => !serverNames.has(c.name))
  const commands = [...(serverCommands ?? []), ...localOnly]

  return {
    commands,
    loading: isLoading,
  }
}
