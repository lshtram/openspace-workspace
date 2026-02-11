/* eslint-disable @typescript-eslint/no-explicit-any */
import { act, renderHook, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { useArtifact } from "./useArtifact"
import {
  flushPromises,
  installMockBroadcastChannel,
  installMockEventSource,
} from "../test/utils/useArtifactTestUtils"

describe("useArtifact", () => {
  let fetchMock: ReturnType<typeof vi.fn>
  const hubUrl = "http://localhost:3001"
  const filePath = "design/sample.graph.mmd"

  const eventSourceMock = installMockEventSource()
  const broadcastChannelMock = installMockBroadcastChannel()

  beforeEach(() => {
    fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)
    vi.stubGlobal("EventSource", eventSourceMock.EventSource)
    vi.stubGlobal("BroadcastChannel", broadcastChannelMock.BroadcastChannel)
    eventSourceMock.reset()
    broadcastChannelMock.reset()
    vi.spyOn(console, "error").mockImplementation(() => undefined)
    vi.spyOn(console, "warn").mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it("loads artifact content on mount", async () => {
    fetchMock.mockResolvedValue(new Response("hello", { status: 200 }))

    const { result } = renderHook(() => useArtifact(filePath, { enableSSE: false }))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(fetchMock).toHaveBeenCalledWith(`${hubUrl}/artifacts/${filePath}`)
    expect(result.current.data).toBe("hello")
    expect(result.current.error).toBeNull()
  })

  it("handles 404 responses by returning null data", async () => {
    fetchMock.mockResolvedValue(new Response("", { status: 404, statusText: "Not Found" }))

    const { result } = renderHook(() => useArtifact(filePath, { enableSSE: false }))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.data).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it("debounces saves and sends serialized content", async () => {
    fetchMock
      .mockResolvedValueOnce(new Response("initial", { status: 200 }))
      .mockResolvedValueOnce(new Response("", { status: 200 }))

    const { result } = renderHook(() =>
      useArtifact(filePath, {
        debounceMs: 500,
        serialize: (value) => `serialized:${value}`,
        enableSSE: false,
      }),
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    vi.useFakeTimers()

    act(() => {
      result.current.setData("next")
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(499)
    expect(fetchMock).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(1)
    await flushPromises()

    expect(fetchMock).toHaveBeenCalledTimes(2)
    const requestInit = fetchMock.mock.calls[1][1] as RequestInit
    const body = JSON.parse(requestInit.body as string) as { content: string }

    expect(requestInit.method).toBe("POST")
    expect(body.content).toBe("serialized:next")
  })

  it("skips save when isEqual reports no change", async () => {
    fetchMock
      .mockResolvedValueOnce(new Response("initial", { status: 200 }))
      .mockResolvedValueOnce(new Response("", { status: 200 }))

    const { result } = renderHook(() =>
      useArtifact(filePath, {
        debounceMs: 200,
        isEqual: (left, right) => left === right,
        enableSSE: false,
      }),
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    vi.useFakeTimers()

    act(() => {
      result.current.setData("same")
    })

    await vi.runAllTimersAsync()
    await flushPromises()

    expect(fetchMock).toHaveBeenCalledTimes(2)

    act(() => {
      result.current.setData("same")
    })

    await vi.runAllTimersAsync()
    await flushPromises()

    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it("broadcasts updates across hooks and invokes onRemoteChange", async () => {
    fetchMock
      .mockResolvedValueOnce(new Response("first", { status: 200 }))
      .mockResolvedValueOnce(new Response("second", { status: 200 }))

    const onRemoteChange = vi.fn()

    const { result: resultA } = renderHook(() => useArtifact(filePath, { debounceMs: 0, enableSSE: false }))
    const { result: resultB } = renderHook(() =>
      useArtifact(filePath, {
        debounceMs: 0,
        onRemoteChange,
        enableSSE: false,
      }),
    )

    await waitFor(() => {
      expect(resultA.current.loading).toBe(false)
      expect(resultB.current.loading).toBe(false)
    })

    act(() => {
      resultA.current.setData("broadcasted")
    })

    await waitFor(() => {
      expect(resultB.current.data).toBe("broadcasted")
    })

    expect(onRemoteChange).toHaveBeenCalledWith("broadcasted", "user")
  })

  it("handles SSE updates and invokes onRemoteChange", async () => {
    const responses = [
      new Response("initial", { status: 200 }),
      new Response("updated", { status: 200 }),
    ]
    fetchMock.mockImplementation(() => Promise.resolve(responses.shift() ?? new Response("updated", { status: 200 })))

    const onRemoteChange = vi.fn()

    const { result } = renderHook(() => useArtifact(filePath, { onRemoteChange }))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const eventSource = eventSourceMock.getLatest()

    act(() => {
      eventSource.emitOpen()
      eventSource.emitMessage(
        JSON.stringify({
          type: "FILE_CHANGED",
          path: filePath,
          actor: "agent",
        }),
      )
    })

    await waitFor(() => {
      expect(result.current.data).toBe("updated")
    })

    expect(onRemoteChange).toHaveBeenCalledWith("updated", "agent")
  })

  it("falls back to raw content when parse throws", async () => {
    fetchMock.mockResolvedValueOnce(new Response("{not-json}", { status: 200 }))

    const { result } = renderHook(() =>
      useArtifact(filePath, {
        parse: () => {
          throw new Error("bad parse")
        },
        enableSSE: false,
      }),
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBeNull()
    expect(result.current.data).toBe("{not-json}")
  })

  it("calls onSaveError when serialize throws", async () => {
    fetchMock.mockResolvedValueOnce(new Response("initial", { status: 200 }))

    const onSaveError = vi.fn()

    const { result } = renderHook(() =>
      useArtifact(filePath, {
        debounceMs: 100,
        serialize: () => {
          throw new Error("serialize failed")
        },
        onSaveError,
        enableSSE: false,
      }),
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    vi.useFakeTimers()

    act(() => {
      result.current.setData("next")
    })

    await vi.runAllTimersAsync()
    await flushPromises()

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(onSaveError).toHaveBeenCalled()
  })
})
