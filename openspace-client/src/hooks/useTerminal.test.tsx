import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { render, waitFor } from "@testing-library/react"
import { useTerminal } from "./useTerminal"

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

function Harness() {
  const { containerRef } = useTerminal(undefined, "/tmp/workspace")
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
      expect(mocks.createMock).toHaveBeenCalledWith({ directory: "/tmp/workspace" })
    })

    unmount()
    createDeferred.resolve({ data: { id: "pty-123" } })

    await waitFor(() => {
      expect(mocks.removeMock).toHaveBeenCalledWith({ ptyID: "pty-123", directory: "/tmp/workspace" })
    })
  })
})
