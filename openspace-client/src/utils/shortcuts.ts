export const SETTINGS_STORAGE_KEY = "openspace.settings"
export const SETTINGS_UPDATED_EVENT = "openspace:settings-updated"
export const OPEN_SETTINGS_EVENT = "openspace:open-settings"

export type ShortcutAction =
  | "openCommandPalette"
  | "openSettings"
  | "newSession"
  | "toggleSidebar"
  | "toggleTerminal"
  | "toggleFileTree"

export type ShortcutMap = Record<ShortcutAction, string>

export const DEFAULT_SHORTCUTS: ShortcutMap = {
  openCommandPalette: "Mod+K",
  openSettings: "Mod+,",
  newSession: "Mod+N",
  toggleSidebar: "Mod+B",
  toggleTerminal: "Mod+J",
  toggleFileTree: "Mod+\\",
}

type StoredSettings = {
  shortcuts?: Partial<ShortcutMap>
  defaultAgent?: string
}

const MODIFIER_KEYS = new Set(["Shift", "Control", "Alt", "Meta"])

export function loadShortcuts(): ShortcutMap {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (!raw) return { ...DEFAULT_SHORTCUTS }
    const parsed = JSON.parse(raw) as StoredSettings | null
    if (!parsed || typeof parsed !== "object") return { ...DEFAULT_SHORTCUTS }
    return {
      ...DEFAULT_SHORTCUTS,
      ...(parsed.shortcuts ?? {}),
    }
  } catch {
    return { ...DEFAULT_SHORTCUTS }
  }
}

export function emitSettingsUpdated() {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent(SETTINGS_UPDATED_EVENT))
}

export function emitOpenSettings() {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent(OPEN_SETTINGS_EVENT))
}

export function loadPreferredAgent(): string | undefined {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (!raw) return undefined
    const parsed = JSON.parse(raw) as StoredSettings | null
    if (!parsed || typeof parsed !== "object") return undefined
    const value = parsed.defaultAgent?.trim()
    return value ? value : undefined
  } catch {
    return undefined
  }
}

export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true
  const tag = target.tagName.toLowerCase()
  return tag === "input" || tag === "textarea" || tag === "select"
}

function normalizeShortcutToken(token: string): string {
  const value = token.trim()
  if (!value) return ""
  const lower = value.toLowerCase()
  if (lower === "cmd" || lower === "meta" || lower === "mod") return "Mod"
  if (lower === "ctrl" || lower === "control") return "Ctrl"
  if (lower === "alt" || lower === "option") return "Alt"
  if (lower === "shift") return "Shift"
  if (lower === "esc") return "Escape"
  if (lower === "space") return "Space"
  if (lower.length === 1) return lower.toUpperCase()
  return value[0].toUpperCase() + value.slice(1).toLowerCase()
}

export function normalizeShortcut(input: string): string {
  const parts = input
    .split("+")
    .map((part) => normalizeShortcutToken(part))
    .filter(Boolean)
  const modifiers: string[] = []
  const keys: string[] = []
  for (const part of parts) {
    if (part === "Mod" || part === "Ctrl" || part === "Alt" || part === "Shift") {
      if (!modifiers.includes(part)) modifiers.push(part)
    } else {
      keys.push(part)
    }
  }
  const orderedModifiers = ["Mod", "Ctrl", "Alt", "Shift"].filter((item) => modifiers.includes(item))
  return [...orderedModifiers, ...keys].join("+")
}

function eventKeyToToken(event: KeyboardEvent): string {
  const key = event.key
  if (key === " ") return "Space"
  if (key.length === 1) return key.toUpperCase()
  if (key === "Esc") return "Escape"
  return key
}

export function formatShortcutFromEvent(event: KeyboardEvent): string | null {
  const keyToken = eventKeyToToken(event)
  if (MODIFIER_KEYS.has(keyToken)) return null
  const parts: string[] = []
  if (event.metaKey || event.ctrlKey) parts.push("Mod")
  if (event.altKey) parts.push("Alt")
  if (event.shiftKey) parts.push("Shift")
  parts.push(keyToken)
  return normalizeShortcut(parts.join("+"))
}

export function matchesShortcut(event: KeyboardEvent, shortcut: string | undefined): boolean {
  const normalized = normalizeShortcut(shortcut ?? "")
  if (!normalized) return false
  const parts = normalized.split("+")
  const key = parts[parts.length - 1]
  const modifiers = new Set(parts.slice(0, -1))

  const expectsMod = modifiers.has("Mod")
  const expectsAlt = modifiers.has("Alt")
  const expectsShift = modifiers.has("Shift")
  const expectsCtrl = modifiers.has("Ctrl")
  const platform = globalThis.navigator?.platform?.toLowerCase() ?? ""
  const isMac = platform.includes("mac")
  const expectedMeta = isMac ? expectsMod : false
  const expectedCtrl = isMac ? expectsCtrl : (expectsCtrl || expectsMod)

  if (event.metaKey !== expectedMeta) return false
  if (event.ctrlKey !== expectedCtrl) return false
  if (expectsAlt !== event.altKey) return false
  if (expectsShift !== event.shiftKey) return false

  const eventKey = normalizeShortcutToken(eventKeyToToken(event))
  return eventKey === key
}
