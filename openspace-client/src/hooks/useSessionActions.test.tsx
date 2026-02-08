import { act, renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { ReactNode } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { useDeleteSession } from "./useSessionActions"
import { sessionsQueryKey } from "./useSessions"
import { openCodeService } from "../services/OpenCodeClient"

const contextState = vi.hoisted(() => ({
  activeUrl: "http://localhost:3000",
}))

const mocks = vi.hoisted(() => ({
  deleteMock: vi.fn(async () => ({ data: true })),
}))

vi.mock("../context/ServerContext", () => ({
  useServer: () => ({
    activeUrl: contextState.activeUrl,
  }),
}))

vi.mock("../services/OpenCodeClient", () => ({
  openCodeService: {
    directory: "/tmp/project",
    client: {
      session: {
        delete: mocks.deleteMock,
      },
    },
  },
}))

describe("useDeleteSession", () => {
  let queryClient: QueryClient

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  beforeEach(() => {
    vi.clearAllMocks()
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    })
  })

  it("deduplicates concurrent deletes for the same session id", async () => {
    let resolveDelete: ((value: { data: boolean }) => void) | undefined
    mocks.deleteMock.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveDelete = resolve
        }),
    )

    const key = sessionsQueryKey(contextState.activeUrl, "/tmp/project")
    queryClient.setQueryData(key, [{ id: "session-1" }, { id: "session-2" }])

    const { result } = renderHook(() => useDeleteSession("/tmp/project"), { wrapper })

    act(() => {
      result.current.mutate("session-1")
      result.current.mutate("session-1")
    })

    await waitFor(() => {
      expect(vi.mocked(openCodeService.client.session.delete)).toHaveBeenCalledTimes(1)
    })

    resolveDelete?.({ data: true })
  })
})
