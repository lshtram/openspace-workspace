import * as Dialog from "@radix-ui/react-dialog"
import { X, Keyboard, Globe, Key, Palette, Terminal, Bot } from "lucide-react"
import { useEffect, useState } from "react"
import {
  DEFAULT_SHORTCUTS,
  SETTINGS_STORAGE_KEY,
  emitSettingsUpdated,
  formatShortcutFromEvent,
  type ShortcutAction,
  type ShortcutMap,
} from "../utils/shortcuts"

type SettingsTab = {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const tabs: SettingsTab[] = [
  { id: "general", label: "General", icon: Palette },
  { id: "shortcuts", label: "Shortcuts", icon: Keyboard },
  { id: "providers", label: "Providers", icon: Key },
  { id: "agents", label: "Agents", icon: Bot },
  { id: "terminal", label: "Terminal", icon: Terminal },
  { id: "language", label: "Language", icon: Globe },
]

type SettingsState = {
  theme: "Light" | "Dark" | "System"
  soundNotifications: boolean
  notifyOnAgentCompletion: boolean
  defaultShell: "Default" | "Bash" | "Zsh" | "Fish"
  language: "English" | "Deutsch" | "Español" | "Français"
  shortcuts: ShortcutMap
}

const defaultSettings: SettingsState = {
  theme: "Light",
  soundNotifications: false,
  notifyOnAgentCompletion: false,
  defaultShell: "Default",
  language: "English",
  shortcuts: { ...DEFAULT_SHORTCUTS },
}

function loadSettings(): SettingsState {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (!raw) return defaultSettings
    const parsed = JSON.parse(raw) as Partial<SettingsState> | null
    if (!parsed || typeof parsed !== "object") return defaultSettings
    return {
      theme: parsed.theme ?? defaultSettings.theme,
      soundNotifications: Boolean(parsed.soundNotifications),
      notifyOnAgentCompletion: Boolean(parsed.notifyOnAgentCompletion),
      defaultShell: parsed.defaultShell ?? defaultSettings.defaultShell,
      language: parsed.language ?? defaultSettings.language,
      shortcuts: {
        ...DEFAULT_SHORTCUTS,
        ...(parsed.shortcuts ?? {}),
      },
    }
  } catch {
    return defaultSettings
  }
}

export function SettingsDialog() {
  const [activeTab, setActiveTab] = useState("general")
  const [settings, setSettings] = useState<SettingsState>(() => loadSettings())

  useEffect(() => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
    emitSettingsUpdated()
  }, [settings])

  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200" />
      <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] max-w-[90vw] max-h-[85vh] overflow-hidden rounded-2xl border border-black/10 bg-white shadow-2xl animate-in zoom-in-95 fade-in duration-200">
        <div className="flex h-full">
          {/* Sidebar */}
          <div className="w-[200px] border-r border-black/[0.03] bg-[#fafafa] p-4">
            <Dialog.Title className="mb-6 px-2 text-[15px] font-semibold text-[#1d1a17]">
              Settings
            </Dialog.Title>
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-[13px] transition-colors ${
                      activeTab === tab.id
                        ? "bg-black/[0.06] font-medium text-[#1d1a17]"
                        : "text-black/60 hover:bg-black/[0.03] hover:text-[#1d1a17]"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-[17px] font-semibold text-[#1d1a17]">
                {tabs.find((t) => t.id === activeTab)?.label}
              </h2>
              <Dialog.Close asChild>
                <button className="rounded-lg p-2 text-black/40 transition-colors hover:bg-black/5 hover:text-black/60">
                  <X className="h-4 w-4" />
                </button>
              </Dialog.Close>
            </div>

            {activeTab === "general" && (
              <GeneralSettings
                theme={settings.theme}
                soundNotifications={settings.soundNotifications}
                notifyOnAgentCompletion={settings.notifyOnAgentCompletion}
                onThemeChange={(theme) => setSettings((prev) => ({ ...prev, theme }))}
                onSoundNotificationsChange={(enabled) =>
                  setSettings((prev) => ({ ...prev, soundNotifications: enabled }))
                }
                onNotifyOnAgentCompletionChange={(enabled) =>
                  setSettings((prev) => ({ ...prev, notifyOnAgentCompletion: enabled }))
                }
              />
            )}
            {activeTab === "shortcuts" && (
              <ShortcutsSettings
                shortcuts={settings.shortcuts}
                onChange={(shortcuts) => setSettings((prev) => ({ ...prev, shortcuts }))}
              />
            )}
            {activeTab === "providers" && <ProvidersSettings />}
            {activeTab === "agents" && <AgentsSettings />}
            {activeTab === "terminal" && (
              <TerminalSettings
                defaultShell={settings.defaultShell}
                onDefaultShellChange={(shell) => setSettings((prev) => ({ ...prev, defaultShell: shell }))}
              />
            )}
            {activeTab === "language" && (
              <LanguageSettings
                language={settings.language}
                onLanguageChange={(language) => setSettings((prev) => ({ ...prev, language }))}
              />
            )}
          </div>
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  )
}

type GeneralSettingsProps = {
  theme: SettingsState["theme"]
  soundNotifications: boolean
  notifyOnAgentCompletion: boolean
  onThemeChange: (theme: SettingsState["theme"]) => void
  onSoundNotificationsChange: (enabled: boolean) => void
  onNotifyOnAgentCompletionChange: (enabled: boolean) => void
}

function GeneralSettings({
  theme,
  soundNotifications,
  notifyOnAgentCompletion,
  onThemeChange,
  onSoundNotificationsChange,
  onNotifyOnAgentCompletionChange,
}: GeneralSettingsProps) {
  return (
    <div className="space-y-6">
      <section>
        <h3 className="mb-3 text-[13px] font-semibold text-[#1d1a17]">Appearance</h3>
        <div className="space-y-3">
          <label className="flex items-center justify-between">
            <span className="text-[13px] text-black/70">Theme</span>
            <select
              value={theme}
              onChange={(event) => onThemeChange(event.target.value as SettingsState["theme"])}
              className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-[13px] outline-none focus:ring-2 focus:ring-black/5"
            >
              <option>Light</option>
              <option>Dark</option>
              <option>System</option>
            </select>
          </label>
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-[13px] font-semibold text-[#1d1a17]">Notifications</h3>
        <div className="space-y-3">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={soundNotifications}
              onChange={(event) => onSoundNotificationsChange(event.target.checked)}
              className="h-4 w-4 rounded border-black/20"
            />
            <span className="text-[13px] text-black/70">Enable sound notifications</span>
          </label>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={notifyOnAgentCompletion}
              onChange={(event) => onNotifyOnAgentCompletionChange(event.target.checked)}
              className="h-4 w-4 rounded border-black/20"
            />
            <span className="text-[13px] text-black/70">Notify on agent completion</span>
          </label>
        </div>
      </section>
    </div>
  )
}

type ShortcutRow = {
  id: ShortcutAction
  label: string
}

const shortcutRows: ShortcutRow[] = [
  { id: "openCommandPalette", label: "Open Command Palette" },
  { id: "newSession", label: "New Session" },
  { id: "toggleSidebar", label: "Toggle Sidebar" },
  { id: "toggleTerminal", label: "Toggle Terminal" },
  { id: "toggleFileTree", label: "Toggle File Tree" },
]

type ShortcutsSettingsProps = {
  shortcuts: ShortcutMap
  onChange: (shortcuts: ShortcutMap) => void
}

function ShortcutsSettings({ shortcuts, onChange }: ShortcutsSettingsProps) {
  const [capturing, setCapturing] = useState<ShortcutAction | null>(null)

  useEffect(() => {
    if (!capturing) return
    const onKeyDown = (event: KeyboardEvent) => {
      event.preventDefault()
      if (event.key === "Escape") {
        setCapturing(null)
        return
      }
      if (event.key === "Backspace" || event.key === "Delete") {
        onChange({ ...shortcuts, [capturing]: "" })
        setCapturing(null)
        return
      }
      const shortcut = formatShortcutFromEvent(event)
      if (!shortcut) return
      onChange({ ...shortcuts, [capturing]: shortcut })
      setCapturing(null)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [capturing, onChange, shortcuts])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-black/50">Keyboard shortcuts for common actions.</p>
        <button
          type="button"
          onClick={() => onChange({ ...DEFAULT_SHORTCUTS })}
          className="rounded-lg border border-black/10 px-3 py-1 text-[12px] font-medium text-black/60 hover:border-black/25"
        >
          Reset defaults
        </button>
      </div>
      <div className="divide-y divide-black/[0.03]">
        {shortcutRows.map((row) => (
          <div key={row.id} className="flex items-center justify-between py-3">
            <span className="text-[13px] text-black/70">{row.label}</span>
            <button
              type="button"
              onClick={() => setCapturing(row.id)}
              className="min-w-[160px] rounded-md bg-black/[0.04] px-2 py-1 text-center font-mono text-[11px] text-black/70 hover:bg-black/[0.08]"
            >
              {capturing === row.id ? "Press keys..." : shortcuts[row.id] || "Not set"}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

function ProvidersSettings() {
  return (
    <div className="space-y-4">
      <p className="text-[13px] text-black/50">Manage AI provider connections.</p>
      <div className="rounded-xl border border-black/[0.05] bg-black/[0.01] p-4">
        <p className="text-[13px] text-black/40">Provider management coming soon...</p>
      </div>
    </div>
  )
}

function AgentsSettings() {
  return (
    <div className="space-y-4">
      <p className="text-[13px] text-black/50">Configure default agents and behavior.</p>
      <div className="rounded-xl border border-black/[0.05] bg-black/[0.01] p-4">
        <p className="text-[13px] text-black/40">Agent settings coming soon...</p>
      </div>
    </div>
  )
}

type TerminalSettingsProps = {
  defaultShell: SettingsState["defaultShell"]
  onDefaultShellChange: (shell: SettingsState["defaultShell"]) => void
}

function TerminalSettings({ defaultShell, onDefaultShellChange }: TerminalSettingsProps) {
  return (
    <div className="space-y-4">
      <p className="text-[13px] text-black/50">Customize terminal appearance and behavior.</p>
      <div className="space-y-3">
        <label className="flex items-center justify-between">
          <span className="text-[13px] text-black/70">Default Shell</span>
          <select
            value={defaultShell}
            onChange={(event) => onDefaultShellChange(event.target.value as SettingsState["defaultShell"])}
            className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-[13px] outline-none focus:ring-2 focus:ring-black/5"
          >
            <option>Default</option>
            <option>Bash</option>
            <option>Zsh</option>
            <option>Fish</option>
          </select>
        </label>
      </div>
    </div>
  )
}

type LanguageSettingsProps = {
  language: SettingsState["language"]
  onLanguageChange: (language: SettingsState["language"]) => void
}

function LanguageSettings({ language, onLanguageChange }: LanguageSettingsProps) {
  return (
    <div className="space-y-4">
      <p className="text-[13px] text-black/50">Select your preferred language.</p>
      <label className="flex items-center justify-between">
        <span className="text-[13px] text-black/70">Language</span>
        <select
          value={language}
          onChange={(event) => onLanguageChange(event.target.value as SettingsState["language"])}
          className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-[13px] outline-none focus:ring-2 focus:ring-black/5"
        >
          <option>English</option>
          <option>Deutsch</option>
          <option>Español</option>
          <option>Français</option>
        </select>
      </label>
    </div>
  )
}
