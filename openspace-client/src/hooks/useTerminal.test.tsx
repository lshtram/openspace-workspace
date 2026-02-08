import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { act, render, waitFor } from "@testing-library/react"
import { TERMINAL_PTY_TITLE, useTerminal } from "./useTerminal"

type Deferred<T> = {
  promise: Promise<T>
  resolve: (value: T) => void
  reject: (reason?: unknown) => void
}

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

const mocks = vi.hoisted(() => {
  let currentDeferred: Deferred<{ data: { id: string } }> | null = null
  return {
    setCreateDeferred(value: Deferred<{ data: { id: string } }>) {
      currentDeferred = value
    },
    createMock: vi.fn(() => {
      if (!currentDeferred) throw new Error("Missing create deferred")
      return currentDeferred.promise
    }),
    removeMock: vi.fn(async () => ({ data: true })),
    updateMock: vi.fn(),
  }
})

class MockWebSocket {
  readyState = 1
  addEventListener() {}
  removeEventListener() {}
  send() {}
  close() {}
}

vi.stubGlobal("WebSocket", MockWebSocket)

vi.mock("xterm", () => ({
  Terminal: class {
    cols = 80
    rows = 24
    loadAddon() {}
    open() {}
    write() {}
    dispose() {}
    onData() {
      return { dispose() {} }
    }
    onResize() {
      return { dispose() {} }
    }
  },
}))

vi.mock("xterm-addon-fit", () => ({
  FitAddon: class {
    fit() {}
    dispose() {}
  },
}))

vi.mock("xterm-addon-web-links", () => ({
  WebLinksAddon: class {},
}))

vi.mock("../services/OpenCodeClient", () => ({
  openCodeService: {
    baseUrl: "http://localhost:3000",
    directory: "/tmp/default",
    pty: {
      create: mocks.createMock,
      remove: mocks.removeMock,
      update: mocks.updateMock,
    },
  },
}))

vi.mock("../context/ServerContext", () => ({
  useServer: () => ({
    activeUrl: "http://localhost:3000",
  }),
}))

function Harness({ directory = "/tmp/workspace" }: { directory?: string }) {
  const { containerRef } = useTerminal(undefined, directory)
  return <div ref={containerRef} />
}

describe("useTerminal", () => {
  let createDeferred: Deferred<{ data: { id: string } }>

  beforeEach(() => {
    createDeferred = deferred<{ data: { id: string } }>()
    mocks.setCreateDeferred(createDeferred)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it("removes PTY when unmounted before create resolves", async () => {
    const { unmount } = render(<Harness />)

    await waitFor(() => {
      expect(mocks.createMock).toHaveBeenCalledWith({
        directory: "/tmp/workspace",
        title: TERMINAL_PTY_TITLE,
      })
    })

    unmount()
    createDeferred.resolve({ data: { id: "pty-123" } })

    await waitFor(() => {
      expect(mocks.removeMock).toHaveBeenCalledWith({ ptyID: "pty-123", directory: "/tmp/workspace" })
    })
  })

  it("removes the previous PTY when the directory prop changes", async () => {
    const { rerender, unmount } = render(<Harness />)

    await waitFor(() => {
      expect(mocks.createMock).toHaveBeenCalledWith({
        directory: "/tmp/workspace",
        title: TERMINAL_PTY_TITLE,
      })
    })

    createDeferred.resolve({ data: { id: "pty-123" } })
    await waitFor(() => expect(mocks.removeMock).not.toHaveBeenCalled())

    const nextDeferred = deferred<{ data: { id: string } }>()
    mocks.setCreateDeferred(nextDeferred)

    rerender(<Harness directory="/tmp/alternate" />)

    await waitFor(() => {
      expect(mocks.createMock).toHaveBeenCalledWith({
        directory: "/tmp/alternate",
        title: TERMINAL_PTY_TITLE,
      })
    })

    await waitFor(() => {
      expect(mocks.removeMock).toHaveBeenCalledWith({ ptyID: "pty-123", directory: "/tmp/workspace" })
    })

    nextDeferred.resolve({ data: { id: "pty-456" } })
    await waitFor(() => expect(mocks.removeMock).not.toHaveBeenCalledWith({ ptyID: "pty-456", directory: "/tmp/alternate" }))

    unmount()
    await waitFor(() =>
      expect(mocks.removeMock).toHaveBeenCalledWith({ ptyID: "pty-456", directory: "/tmp/alternate" }),
    )
  })

  it("sends keepalive cleanup on beforeunload for active PTYs", async () => {
    const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<{ ok: boolean }>>(
      async () => ({ ok: true }),
    )
    const originalFetch = globalThis.fetch
    vi.stubGlobal("fetch", fetchMock)

    const { unmount } = render(<Harness />)
    await waitFor(() => {
      expect(mocks.createMock).toHaveBeenCalledWith({
        directory: "/tmp/workspace",
        title: TERMINAL_PTY_TITLE,
      })
    })

    await act(async () => {
      createDeferred.resolve({ data: { id: "pty-keepalive" } })
      await Promise.resolve()
    })

    act(() => {
      window.dispatchEvent(new Event("beforeunload"))
    })
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())

    const firstFetchCall = fetchMock.mock.calls[0]
    expect(String(firstFetchCall?.[0])).toContain("/pty/pty-keepalive")
    expect(firstFetchCall[1]).toMatchObject({
      method: "DELETE",
      keepalive: true,
    })

    unmount()
    if (originalFetch) {
      vi.stubGlobal("fetch", originalFetch)
    } else {
      Reflect.deleteProperty(globalThis, "fetch")
    }
  })
})
