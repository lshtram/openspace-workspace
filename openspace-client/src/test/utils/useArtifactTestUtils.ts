export type MockEventSourceInstance = {
  url: string
  closed: boolean
  onopen: ((event?: Event) => void) | null
  onerror: ((event?: Event) => void) | null
  onmessage: ((event: MessageEvent<string>) => void) | null
  emitOpen: () => void
  emitError: (event?: Event) => void
  emitMessage: (data: string) => void
  close: () => void
}

type MockBroadcastChannelInstance = {
  name: string
  closed: boolean
  onmessage: ((event: MessageEvent) => void) | null
  postMessage: (data: unknown) => void
  close: () => void
}

export const assertCondition: (condition: unknown, message: string) => asserts condition = (
  condition,
  message,
) => {
  if (!condition) {
    throw new Error(message)
  }
}

export const flushPromises = async () => {
  assertCondition(typeof Promise !== "undefined", "Promise is not available in test environment")
  await Promise.resolve()
  await Promise.resolve()
}

export const installMockEventSource = () => {
  assertCondition(typeof globalThis !== "undefined", "globalThis is not available for EventSource mock")

  class MockEventSource implements MockEventSourceInstance {
    static instances: MockEventSource[] = []

    url: string
    closed = false
    onopen: ((event?: Event) => void) | null = null
    onerror: ((event?: Event) => void) | null = null
    onmessage: ((event: MessageEvent<string>) => void) | null = null

    constructor(url: string) {
      this.url = url
      MockEventSource.instances.push(this)
    }

    emitOpen() {
      assertCondition(!this.closed, "Cannot emit open on a closed EventSource")
      this.onopen?.(new Event("open"))
    }

    emitError(event?: Event) {
      assertCondition(!this.closed, "Cannot emit error on a closed EventSource")
      this.onerror?.(event ?? new Event("error"))
    }

    emitMessage(data: string) {
      assertCondition(!this.closed, "Cannot emit message on a closed EventSource")
      const message = { data } as MessageEvent<string>
      this.onmessage?.(message)
    }

    close() {
      this.closed = true
    }

    static latest() {
      assertCondition(MockEventSource.instances.length > 0, "No EventSource instances were created")
      return MockEventSource.instances[MockEventSource.instances.length - 1]
    }

    static reset() {
      MockEventSource.instances.length = 0
    }
  }

  return {
    EventSource: MockEventSource,
    getLatest: () => MockEventSource.latest(),
    reset: () => MockEventSource.reset(),
  }
}

export const installMockBroadcastChannel = () => {
  assertCondition(typeof globalThis !== "undefined", "globalThis is not available for BroadcastChannel mock")

  class MockBroadcastChannel implements MockBroadcastChannelInstance {
    static channels = new Map<string, Set<MockBroadcastChannel>>()

    name: string
    closed = false
    onmessage: ((event: MessageEvent) => void) | null = null

    constructor(name: string) {
      this.name = name
      const channelSet = MockBroadcastChannel.channels.get(name) ?? new Set()
      channelSet.add(this)
      MockBroadcastChannel.channels.set(name, channelSet)
    }

    postMessage(data: unknown) {
      assertCondition(!this.closed, "Cannot postMessage on a closed BroadcastChannel")
      const channelSet = MockBroadcastChannel.channels.get(this.name)
      if (!channelSet) {
        throw new Error(`Missing channel registry for ${this.name}`)
      }

      channelSet.forEach((instance) => {
        if (instance === this || instance.closed) return
        const message = { data } as MessageEvent
        instance.onmessage?.(message)
      })
    }

    close() {
      if (this.closed) return
      this.closed = true
      const channelSet = MockBroadcastChannel.channels.get(this.name)
      if (!channelSet) return
      channelSet.delete(this)
      if (channelSet.size === 0) {
        MockBroadcastChannel.channels.delete(this.name)
      }
    }

    static reset() {
      MockBroadcastChannel.channels.clear()
    }

    static getInstances(name: string) {
      const channelSet = MockBroadcastChannel.channels.get(name)
      if (!channelSet) {
        throw new Error(`Missing channel registry for ${name}`)
      }
      return Array.from(channelSet)
    }
  }

  return {
    BroadcastChannel: MockBroadcastChannel,
    getInstances: (name: string) => MockBroadcastChannel.getInstances(name),
    reset: () => MockBroadcastChannel.reset(),
  }
}
