import { describe, it, expect, beforeEach, vi } from "vitest"
import {
  applySettingsToDocument,
  DEFAULT_SETTINGS,
  DEFAULT_SHORTCUTS,
  SETTINGS_STORAGE_KEY,
  formatShortcutFromEvent,
  loadPreferredAgent,
  loadSettings,
  loadShortcuts,
  matchesShortcut,
  normalizeShortcut,
  SETTINGS_SCHEMA_VERSION,
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

  it("loads settings from versioned storage envelope", () => {
    window.localStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({
        version: SETTINGS_SCHEMA_VERSION,
        data: {
          colorScheme: "Dark",
          shortcuts: {
            openCommandPalette: "Mod+P",
          },
        },
      }),
    )

    const settings = loadSettings()
    expect(settings.colorScheme).toBe("Dark")
    expect(settings.shortcuts.openCommandPalette).toBe("Mod+P")
    expect(settings.shortcuts.newSession).toBe(DEFAULT_SHORTCUTS.newSession)
  })

  it("loads full settings with defaults", () => {
    expect(loadSettings()).toEqual({
      ...DEFAULT_SETTINGS,
      shortcuts: { ...DEFAULT_SHORTCUTS },
    })
  })

  it("migrates legacy theme values into color scheme", () => {
    window.localStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({
        theme: "Dark",
      }),
    )

    const settings = loadSettings()
    expect(settings.colorScheme).toBe("Dark")
    expect(settings.theme).toBe("OpenSpace")
    const stored = JSON.parse(window.localStorage.getItem(SETTINGS_STORAGE_KEY) || "{}")
    expect(stored.version).toBe(SETTINGS_SCHEMA_VERSION)
    expect(stored.data?.colorScheme).toBe("Dark")
  })

  it("applies visual settings to document root", () => {
    applySettingsToDocument({
      colorScheme: "Dark",
      theme: "Graphite",
      fontFamily: "IBM Plex Sans",
    })

    expect(document.documentElement.dataset.colorScheme).toBe("Dark")
    expect(document.documentElement.dataset.theme).toBe("Graphite")
    expect(getComputedStyle(document.documentElement).getPropertyValue("--font-sans")).toContain("IBM Plex Sans")
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
