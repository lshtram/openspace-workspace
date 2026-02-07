import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { Session } from "../lib/opencode/v2/gen/types.gen"
import { openCodeService } from "../services/OpenCodeClient"
import { useServer } from "../context/ServerContext"
import { sessionsQueryKey } from "./useSessions"

export function useUpdateSession() {
  const queryClient = useQueryClient()
  const server = useServer()
  const sessionsKey = sessionsQueryKey(server.activeUrl, openCodeService.directory)

  return useMutation({
    mutationFn: async ({
      sessionID,
      title,
      archived,
    }: {
      sessionID: string
      title?: string
      archived?: boolean
    }) => {
      const response = await openCodeService.client.session.update({
        sessionID,
        directory: openCodeService.directory,
        title,
        time: archived !== undefined ? { archived: archived ? Date.now() : undefined } : undefined,
      })
      return response.data
    },
    onMutate: async ({ sessionID, title, archived }) => {
      await queryClient.cancelQueries({ queryKey: sessionsKey })
      const previous = queryClient.getQueryData<Session[]>(sessionsKey)
      if (previous) {
        const now = Date.now()
        queryClient.setQueryData<Session[]>(
          sessionsKey,
          previous.map((session) => {
            if (session.id !== sessionID) return session
            const time = {
              ...(session.time ?? { created: now, updated: now }),
              updated: now,
            }
            if (archived !== undefined) {
              time.archived = archived ? now : undefined
            }
            return {
              ...session,
              title: title ?? session.title,
              time,
            }
          }),
        )
      }
      return { previous }
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(sessionsKey, context.previous)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: sessionsKey,
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: sessionsKey,
      })
    },
  })
}

export function useDeleteSession() {
  const queryClient = useQueryClient()
  const server = useServer()
  const sessionsKey = sessionsQueryKey(server.activeUrl, openCodeService.directory)

  return useMutation({
    mutationFn: async (sessionID: string) => {
      const response = await openCodeService.client.session.delete({
        sessionID,
        directory: openCodeService.directory,
      })
      return response.data
    },
    onMutate: async (sessionID: string) => {
      await queryClient.cancelQueries({ queryKey: sessionsKey })
      const previous = queryClient.getQueryData<Session[]>(sessionsKey)
      if (previous) {
        queryClient.setQueryData<Session[]>(
          sessionsKey,
          previous.filter((session) => session.id !== sessionID),
        )
      }
      return { previous }
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(sessionsKey, context.previous)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: sessionsKey,
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: sessionsKey,
      })
    },
  })
}
