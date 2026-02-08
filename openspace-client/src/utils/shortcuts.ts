export const SETTINGS_STORAGE_KEY = "openspace.settings"
export const SETTINGS_SCHEMA_VERSION = 1
export const SETTINGS_UPDATED_EVENT = "openspace:settings-updated"
export const OPEN_SETTINGS_EVENT = "openspace:open-settings"

export type ShortcutAction =
  | "openCommandPalette"
  | "openSettings"
  | "openFile"
  | "newSession"
  | "toggleSidebar"
  | "toggleTerminal"
  | "toggleFileTree"

export type ShortcutMap = Record<ShortcutAction, string>

export const DEFAULT_SHORTCUTS: ShortcutMap = {
  openCommandPalette: "Mod+K",
  openSettings: "Mod+,",
  openFile: "Mod+O",
  newSession: "Mod+N",
  toggleSidebar: "Mod+B",
  toggleTerminal: "Mod+J",
  toggleFileTree: "Mod+\\",
}

export type ColorScheme = "System" | "Light" | "Dark"
export type AppTheme = "OpenSpace" | "Graphite" | "Paper"
export type FontFamily = "Space Grotesk" | "Inter" | "IBM Plex Sans"
export type Language = "English" | "Deutsch" | "Español" | "Français"
export type DefaultShell = "Default" | "Bash" | "Zsh" | "Fish"
export type AgentCompletionSound = "None" | "Chime" | "Ding"

export type AppSettings = {
  colorScheme: ColorScheme
  theme: AppTheme
  fontFamily: FontFamily
  notifyOnAgentCompletion: boolean
  notifyOnPermissionRequests: boolean
  notifyOnErrors: boolean
  soundOnAgentCompletion: AgentCompletionSound
  checkForUpdatesOnStartup: boolean
  showReleaseNotes: boolean
  defaultShell: DefaultShell
  language: Language
  defaultAgent: string
  shortcuts: ShortcutMap
}

export const DEFAULT_SETTINGS: AppSettings = {
  colorScheme: "Light",
  theme: "OpenSpace",
  fontFamily: "Space Grotesk",
  notifyOnAgentCompletion: false,
  notifyOnPermissionRequests: false,
  notifyOnErrors: false,
  soundOnAgentCompletion: "None",
  checkForUpdatesOnStartup: true,
  showReleaseNotes: true,
  defaultShell: "Default",
  language: "English",
  defaultAgent: "",
  shortcuts: { ...DEFAULT_SHORTCUTS },
}

type StoredSettings = {
  colorScheme?: ColorScheme
  theme?: AppTheme | "Light" | "Dark" | "System"
  fontFamily?: FontFamily
  notifyOnAgentCompletion?: boolean
  notifyOnPermissionRequests?: boolean
  notifyOnErrors?: boolean
  soundOnAgentCompletion?: AgentCompletionSound
  checkForUpdatesOnStartup?: boolean
  showReleaseNotes?: boolean
  defaultShell?: DefaultShell
  language?: Language
  shortcuts?: Partial<ShortcutMap>
  defaultAgent?: string
  soundNotifications?: boolean
}

type StoredSettingsEnvelope = {
  version?: number
  data?: StoredSettings
} & Partial<StoredSettings>

const MODIFIER_KEYS = new Set(["Shift", "Control", "Alt", "Meta"])

const FONT_FAMILY_MAP: Record<FontFamily, string> = {
  "Space Grotesk": '"Space Grotesk", ui-sans-serif, system-ui, sans-serif',
  Inter: "Inter, ui-sans-serif, system-ui, sans-serif",
  "IBM Plex Sans": '"IBM Plex Sans", ui-sans-serif, system-ui, sans-serif',
}

const COLOR_SCHEMES = new Set<ColorScheme>(["System", "Light", "Dark"])
const THEMES = new Set<AppTheme>(["OpenSpace", "Graphite", "Paper"])
const FONT_FAMILIES = new Set<FontFamily>(["Space Grotesk", "Inter", "IBM Plex Sans"])
const LANGUAGES = new Set<Language>(["English", "Deutsch", "Español", "Français"])
const SHELLS = new Set<DefaultShell>(["Default", "Bash", "Zsh", "Fish"])
const SOUNDS = new Set<AgentCompletionSound>(["None", "Chime", "Ding"])

function pickEnum<T extends string>(value: unknown, allowed: Set<T>, fallback: T): T {
  return typeof value === "string" && allowed.has(value as T) ? (value as T) : fallback
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (!raw) return { ...DEFAULT_SETTINGS, shortcuts: { ...DEFAULT_SHORTCUTS } }
    const parsed = JSON.parse(raw) as StoredSettingsEnvelope | StoredSettings | null
    if (!parsed || typeof parsed !== "object") {
      return { ...DEFAULT_SETTINGS, shortcuts: { ...DEFAULT_SHORTCUTS } }
    }
    const isEnvelope = "data" in parsed && parsed.data && typeof parsed.data === "object"
    const stored: StoredSettings = isEnvelope ? parsed.data! : (parsed as StoredSettings)

    const migratedColorScheme =
      stored.colorScheme ??
      (stored.theme === "Light" || stored.theme === "Dark" || stored.theme === "System"
        ? stored.theme
        : undefined)
    const colorScheme = pickEnum(migratedColorScheme, COLOR_SCHEMES, DEFAULT_SETTINGS.colorScheme)
    const theme = pickEnum(stored.theme, THEMES, DEFAULT_SETTINGS.theme)
    const fontFamily = pickEnum(stored.fontFamily, FONT_FAMILIES, DEFAULT_SETTINGS.fontFamily)
    const language = pickEnum(stored.language, LANGUAGES, DEFAULT_SETTINGS.language)
    const defaultShell = pickEnum(stored.defaultShell, SHELLS, DEFAULT_SETTINGS.defaultShell)
    const soundOnAgentCompletion = pickEnum(
      stored.soundOnAgentCompletion,
      SOUNDS,
      stored.soundNotifications ? "Chime" : DEFAULT_SETTINGS.soundOnAgentCompletion,
    )

    const next: AppSettings = {
      ...DEFAULT_SETTINGS,
      colorScheme,
      theme,
      fontFamily,
      notifyOnAgentCompletion:
        typeof stored.notifyOnAgentCompletion === "boolean"
          ? stored.notifyOnAgentCompletion
          : DEFAULT_SETTINGS.notifyOnAgentCompletion,
      notifyOnPermissionRequests:
        typeof stored.notifyOnPermissionRequests === "boolean"
          ? stored.notifyOnPermissionRequests
          : DEFAULT_SETTINGS.notifyOnPermissionRequests,
      notifyOnErrors:
        typeof stored.notifyOnErrors === "boolean" ? stored.notifyOnErrors : DEFAULT_SETTINGS.notifyOnErrors,
      soundOnAgentCompletion,
      checkForUpdatesOnStartup:
        typeof stored.checkForUpdatesOnStartup === "boolean"
          ? stored.checkForUpdatesOnStartup
          : DEFAULT_SETTINGS.checkForUpdatesOnStartup,
      showReleaseNotes:
        typeof stored.showReleaseNotes === "boolean"
          ? stored.showReleaseNotes
          : DEFAULT_SETTINGS.showReleaseNotes,
      defaultShell,
      language,
      defaultAgent: typeof stored.defaultAgent === "string" ? stored.defaultAgent : DEFAULT_SETTINGS.defaultAgent,
      shortcuts: {
        ...DEFAULT_SHORTCUTS,
        ...(stored.shortcuts ?? {}),
      },
    }
    if (!isEnvelope) {
      // Normalize legacy shape into versioned envelope.
      saveSettings(next)
    }
    return next
  } catch {
    return { ...DEFAULT_SETTINGS, shortcuts: { ...DEFAULT_SHORTCUTS } }
  }
}

export function saveSettings(settings: AppSettings) {
  localStorage.setItem(
    SETTINGS_STORAGE_KEY,
    JSON.stringify({
      ...settings,
      version: SETTINGS_SCHEMA_VERSION,
      data: settings,
    } satisfies StoredSettingsEnvelope),
  )
}

export function applySettingsToDocument(settings: Pick<AppSettings, "colorScheme" | "theme" | "fontFamily">) {
  if (typeof document === "undefined") return
  const root = document.documentElement
  root.dataset.colorScheme = settings.colorScheme
  root.dataset.theme = settings.theme
  root.style.setProperty("--font-sans", FONT_FAMILY_MAP[settings.fontFamily])
}

export function applyStoredSettingsToDocument() {
  if (typeof window === "undefined") return
  const settings = loadSettings()
  applySettingsToDocument(settings)
}

export function loadShortcuts(): ShortcutMap {
  return loadSettings().shortcuts
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
  const value = loadSettings().defaultAgent.trim()
  return value ? value : undefined
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
