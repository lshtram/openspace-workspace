import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRef } from "react"
import type { Session } from "../lib/opencode/v2/gen/types.gen"
import { openCodeService } from "../services/OpenCodeClient"
import { useServer } from "../context/ServerContext"
import { sessionsQueryKey } from "./useSessions"

export function useUpdateSession(directoryProp?: string) {
  const queryClient = useQueryClient()
  const server = useServer()
  const directory = directoryProp ?? openCodeService.directory
  const sessionsKey = sessionsQueryKey(server.activeUrl, directory)

  return useMutation({
    retry: false,
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
        directory,
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

export function useDeleteSession(directoryProp?: string) {
  const queryClient = useQueryClient()
  const server = useServer()
  const directory = directoryProp ?? openCodeService.directory
  const sessionsKey = sessionsQueryKey(server.activeUrl, directory)
  const deleteInFlightRef = useRef<Map<string, Promise<unknown>>>(new Map())

  return useMutation({
    retry: false,
    mutationFn: async (sessionID: string) => {
      const existing = deleteInFlightRef.current.get(sessionID)
      if (existing) return existing
      const request = openCodeService.client.session
        .delete({
          sessionID,
          directory,
        })
        .then((response) => response.data)
        .finally(() => {
          deleteInFlightRef.current.delete(sessionID)
        })
      deleteInFlightRef.current.set(sessionID, request)
      return request
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
      queryClient.invalidateQueries({
        queryKey: sessionsKey,
      })
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
