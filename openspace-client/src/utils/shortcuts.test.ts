import { describe, it, expect, beforeEach, vi } from "vitest"
import {
  DEFAULT_SHORTCUTS,
  SETTINGS_STORAGE_KEY,
  formatShortcutFromEvent,
  loadPreferredAgent,
  loadShortcuts,
  matchesShortcut,
  normalizeShortcut,
} from "./shortcuts"

describe("shortcuts", () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.restoreAllMocks()
  })

  it("normalizes shortcut token order and casing", () => {
    expect(normalizeShortcut("shift+mod+k")).toBe("Mod+Shift+K")
    expect(normalizeShortcut(" ctrl + alt + p ")).toBe("Ctrl+Alt+P")
  })

  it("loads defaults when storage is empty", () => {
    expect(loadShortcuts()).toEqual(DEFAULT_SHORTCUTS)
  })

  it("merges stored shortcuts with defaults", () => {
    window.localStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({
        shortcuts: {
          newSession: "Ctrl+N",
        },
      }),
    )

    const loaded = loadShortcuts()
    expect(loaded.newSession).toBe("Ctrl+N")
    expect(loaded.openCommandPalette).toBe(DEFAULT_SHORTCUTS.openCommandPalette)
  })

  it("loads preferred agent from settings", () => {
    window.localStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({
        defaultAgent: "plan",
      }),
    )

    expect(loadPreferredAgent()).toBe("plan")
  })

  it("formats keyboard events into shortcut strings", () => {
    const event = new KeyboardEvent("keydown", {
      key: "k",
      ctrlKey: true,
      shiftKey: true,
    })
    expect(formatShortcutFromEvent(event)).toBe("Mod+Shift+K")
  })

  it("ignores modifier-only events when formatting", () => {
    const event = new KeyboardEvent("keydown", { key: "Control", ctrlKey: true })
    expect(formatShortcutFromEvent(event)).toBeNull()
  })

  it("matches Mod shortcuts on non-mac using Ctrl", () => {
    vi.spyOn(window.navigator, "platform", "get").mockReturnValue("Linux x86_64")
    const event = new KeyboardEvent("keydown", { key: "n", ctrlKey: true })
    expect(matchesShortcut(event, "Mod+N")).toBe(true)
    expect(matchesShortcut(event, "Ctrl+N")).toBe(true)
  })

  it("matches Mod shortcuts on mac using Meta", () => {
    vi.spyOn(window.navigator, "platform", "get").mockReturnValue("MacIntel")
    const event = new KeyboardEvent("keydown", { key: "n", metaKey: true })
    expect(matchesShortcut(event, "Mod+N")).toBe(true)
    expect(matchesShortcut(event, "Ctrl+N")).toBe(false)
  })
})
