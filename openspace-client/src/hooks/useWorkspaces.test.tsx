import { act, renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { ReactNode } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { useWorkspaces, workspacesQueryKey } from "./useWorkspaces"
import { storage } from "../utils/storage"

const contextState = vi.hoisted(() => ({
  activeUrl: "http://localhost:3000",
}))

const mocks = vi.hoisted(() => ({
  listMock: vi.fn(async () => ({ data: ["/tmp/project/ws-a"] })),
  createMock: vi.fn(async () => ({ data: { directory: "/tmp/project/ws-new" } })),
  resetMock: vi.fn(async () => ({ data: true })),
  removeMock: vi.fn(async () => ({ data: true })),
}))

vi.mock("../context/ServerContext", () => ({
  useServer: () => ({
    activeUrl: contextState.activeUrl,
  }),
}))

vi.mock("../services/OpenCodeClient", () => ({
  openCodeService: {
    worktree: {
      list: mocks.listMock,
      create: mocks.createMock,
      reset: mocks.resetMock,
      remove: mocks.removeMock,
    },
  },
}))

vi.mock("../utils/storage", () => ({
  storage: {
    getWorkspaceMeta: vi.fn(() => []),
    saveWorkspaceMeta: vi.fn(),
    updateWorkspaceMeta: vi.fn(),
  },
}))

describe("useWorkspaces", () => {
  let queryClient: QueryClient

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  beforeEach(() => {
    vi.clearAllMocks()
    contextState.activeUrl = "http://localhost:3000"
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    })
    vi.mocked(storage.getWorkspaceMeta).mockReturnValue([])
  })

  it("includes server URL in workspace query key", () => {
    expect(workspacesQueryKey("http://localhost:3000", "/tmp/project")).toEqual([
      "workspaces",
      "http://localhost:3000",
      "/tmp/project",
    ])
  })

  it("refetches workspaces when active server changes", async () => {
    const { rerender } = renderHook(() => useWorkspaces("/tmp/project"), { wrapper })

    await waitFor(() => {
      expect(mocks.listMock).toHaveBeenCalledTimes(1)
    })

    contextState.activeUrl = "http://127.0.0.1:3000"
    rerender()

    await waitFor(() => {
      expect(mocks.listMock).toHaveBeenCalledTimes(2)
    })
  })

  it("deduplicates concurrent remove requests for the same workspace", async () => {
    let resolveRemove: ((value: { data: boolean }) => void) | undefined
    mocks.removeMock.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveRemove = resolve
        }),
    )

    const { result } = renderHook(() => useWorkspaces("/tmp/project"), { wrapper })

    await waitFor(() => {
      expect(mocks.listMock).toHaveBeenCalled()
    })

    act(() => {
      result.current.removeWorkspace.mutate("/tmp/project/ws-a")
      result.current.removeWorkspace.mutate("/tmp/project/ws-a")
    })

    await waitFor(() => {
      expect(mocks.removeMock).toHaveBeenCalledTimes(1)
    })

    resolveRemove?.({ data: true })
  })
})
