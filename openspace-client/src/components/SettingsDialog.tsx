import * as Dialog from "@radix-ui/react-dialog"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { X, Keyboard, Globe, Key, Palette, Terminal, Bot, Loader2, Sparkles } from "lucide-react"
import { useEffect, useRef, useState, type ChangeEvent, type ComponentType } from "react"
import { useDialog } from "../context/DialogContext"
import { useServer } from "../context/ServerContext"
import { useAgents } from "../hooks/useAgents"
import { providerAuthQueryKey, useProviderAuth } from "../hooks/useProviderAuth"
import { modelsQueryKey } from "../hooks/useModels"
import { providersQueryKey, useProviders } from "../hooks/useProviders"
import { openCodeService } from "../services/OpenCodeClient"
import { DialogConnectProvider } from "./DialogConnectProvider"
import {
  applySettingsToDocument,
  DEFAULT_SHORTCUTS,
  exportShortcutsPortableJson,
  emitSettingsUpdated,
  formatShortcutFromEvent,
  importShortcutsPortableJson,
  loadSettings,
  PORTABLE_SHORTCUTS_FILENAME,
  saveSettings,
  type AgentCompletionSound,
  type AppSettings,
  type AppTheme,
  type ColorScheme,
  type FontFamily,
  type Language,
  type ShortcutAction,
  type ShortcutMap,
} from "../utils/shortcuts"

type SettingsTab = {
  id: string
  icon: ComponentType<{ className?: string }>
}

const tabs: SettingsTab[] = [
  { id: "general", icon: Palette },
  { id: "shortcuts", icon: Keyboard },
  { id: "providers", icon: Key },
  { id: "agents", icon: Bot },
  { id: "terminal", icon: Terminal },
  { id: "language", icon: Globe },
]

type SettingsState = AppSettings

const localizedLabels: Record<
  Language,
  {
    settingsTitle: string
    tabLabels: Record<string, string>
    appearance: string
    notifications: string
    updates: string
    colorScheme: string
    theme: string
    font: string
    sound: string
    notifyAgent: string
    notifyPermissions: string
    notifyErrors: string
    updatesStartup: string
    releaseNotes: string
    language: string
  }
> = {
  English: {
    settingsTitle: "Settings",
    tabLabels: {
      general: "General",
      shortcuts: "Shortcuts",
      providers: "Providers",
      agents: "Agents",
      terminal: "Terminal",
      language: "Language",
    },
    appearance: "Appearance",
    notifications: "Notifications",
    updates: "Updates",
    colorScheme: "Color scheme",
    theme: "Theme",
    font: "Font",
    sound: "Agent completion sound",
    notifyAgent: "Notify on agent completion",
    notifyPermissions: "Notify on permission requests",
    notifyErrors: "Notify on agent errors",
    updatesStartup: "Check for updates on startup",
    releaseNotes: "Show release notes after updates",
    language: "Language",
  },
  Deutsch: {
    settingsTitle: "Einstellungen",
    tabLabels: {
      general: "Allgemein",
      shortcuts: "Shortcuts",
      providers: "Anbieter",
      agents: "Agenten",
      terminal: "Terminal",
      language: "Sprache",
    },
    appearance: "Darstellung",
    notifications: "Benachrichtigungen",
    updates: "Aktualisierungen",
    colorScheme: "Farbschema",
    theme: "Thema",
    font: "Schriftart",
    sound: "Ton bei Agent-Abschluss",
    notifyAgent: "Bei Agent-Abschluss benachrichtigen",
    notifyPermissions: "Bei Berechtigungsanfragen benachrichtigen",
    notifyErrors: "Bei Agent-Fehlern benachrichtigen",
    updatesStartup: "Beim Start nach Updates suchen",
    releaseNotes: "Versionshinweise nach Updates anzeigen",
    language: "Sprache",
  },
  Español: {
    settingsTitle: "Configuración",
    tabLabels: {
      general: "General",
      shortcuts: "Atajos",
      providers: "Proveedores",
      agents: "Agentes",
      terminal: "Terminal",
      language: "Idioma",
    },
    appearance: "Apariencia",
    notifications: "Notificaciones",
    updates: "Actualizaciones",
    colorScheme: "Esquema de color",
    theme: "Tema",
    font: "Fuente",
    sound: "Sonido al completar agente",
    notifyAgent: "Notificar al completar agente",
    notifyPermissions: "Notificar solicitudes de permisos",
    notifyErrors: "Notificar errores del agente",
    updatesStartup: "Buscar actualizaciones al iniciar",
    releaseNotes: "Mostrar notas de versión tras actualizar",
    language: "Idioma",
  },
  Français: {
    settingsTitle: "Paramètres",
    tabLabels: {
      general: "Général",
      shortcuts: "Raccourcis",
      providers: "Fournisseurs",
      agents: "Agents",
      terminal: "Terminal",
      language: "Langue",
    },
    appearance: "Apparence",
    notifications: "Notifications",
    updates: "Mises à jour",
    colorScheme: "Schéma de couleurs",
    theme: "Thème",
    font: "Police",
    sound: "Son à la fin de l'agent",
    notifyAgent: "Notifier à la fin de l'agent",
    notifyPermissions: "Notifier les demandes d'autorisation",
    notifyErrors: "Notifier les erreurs d'agent",
    updatesStartup: "Vérifier les mises à jour au démarrage",
    releaseNotes: "Afficher les notes de version après mise à jour",
    language: "Langue",
  },
}

export function SettingsDialog() {
  const [activeTab, setActiveTab] = useState("general")
  const [settings, setSettings] = useState<SettingsState>(() => loadSettings())
  const labels = localizedLabels[settings.language] ?? localizedLabels.English

  useEffect(() => {
    applySettingsToDocument(settings)
    saveSettings(settings)
    emitSettingsUpdated()
  }, [settings])

  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200" />
      <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[min(85vh,760px)] w-[800px] max-w-[90vw] overflow-hidden rounded-2xl border border-black/10 bg-white shadow-2xl animate-in zoom-in-95 fade-in duration-200">
        <div className="flex h-full min-h-0">
          {/* Sidebar */}
          <div className="flex w-[200px] min-h-0 flex-col border-r border-black/[0.03] bg-[#fafafa] p-4">
            <Dialog.Title className="mb-6 px-2 text-[15px] font-semibold text-[#1d1a17]">
              {labels.settingsTitle}
            </Dialog.Title>
            <Dialog.Description className="sr-only">
              Configure OpenSpace preferences, shortcuts, providers, and agent behavior.
            </Dialog.Description>
            <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
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
                    {labels.tabLabels[tab.id] ?? tab.id}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="flex min-h-0 flex-1 flex-col p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-[17px] font-semibold text-[#1d1a17]">
                {labels.tabLabels[activeTab] ?? activeTab}
              </h2>
              <Dialog.Close asChild>
                <button className="rounded-lg p-2 text-black/40 transition-colors hover:bg-black/5 hover:text-black/60">
                  <X className="h-4 w-4" />
                </button>
              </Dialog.Close>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
              {activeTab === "general" && (
                <GeneralSettings
                  labels={labels}
                  colorScheme={settings.colorScheme}
                  theme={settings.theme}
                  fontFamily={settings.fontFamily}
                  notifyOnAgentCompletion={settings.notifyOnAgentCompletion}
                  notifyOnPermissionRequests={settings.notifyOnPermissionRequests}
                  notifyOnErrors={settings.notifyOnErrors}
                  soundOnAgentCompletion={settings.soundOnAgentCompletion}
                  checkForUpdatesOnStartup={settings.checkForUpdatesOnStartup}
                  showReleaseNotes={settings.showReleaseNotes}
                  onColorSchemeChange={(colorScheme) => setSettings((prev) => ({ ...prev, colorScheme }))}
                  onThemeChange={(theme) => setSettings((prev) => ({ ...prev, theme }))}
                  onFontFamilyChange={(fontFamily) => setSettings((prev) => ({ ...prev, fontFamily }))}
                  onNotifyOnPermissionRequestsChange={(enabled) =>
                    setSettings((prev) => ({ ...prev, notifyOnPermissionRequests: enabled }))
                  }
                  onNotifyOnErrorsChange={(enabled) =>
                    setSettings((prev) => ({ ...prev, notifyOnErrors: enabled }))
                  }
                  onSoundOnAgentCompletionChange={(soundOnAgentCompletion) =>
                    setSettings((prev) => ({ ...prev, soundOnAgentCompletion }))
                  }
                  onNotifyOnAgentCompletionChange={(enabled) =>
                    setSettings((prev) => ({ ...prev, notifyOnAgentCompletion: enabled }))
                  }
                  onCheckForUpdatesOnStartupChange={(enabled) =>
                    setSettings((prev) => ({ ...prev, checkForUpdatesOnStartup: enabled }))
                  }
                  onShowReleaseNotesChange={(enabled) =>
                    setSettings((prev) => ({ ...prev, showReleaseNotes: enabled }))
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
              {activeTab === "agents" && (
                <AgentsSettings
                  defaultAgent={settings.defaultAgent}
                  onDefaultAgentChange={(defaultAgent) => setSettings((prev) => ({ ...prev, defaultAgent }))}
                />
              )}
              {activeTab === "terminal" && (
                <TerminalSettings
                  defaultShell={settings.defaultShell}
                  onDefaultShellChange={(shell) => setSettings((prev) => ({ ...prev, defaultShell: shell }))}
                />
              )}
              {activeTab === "language" && (
                <LanguageSettings
                  labels={labels}
                  language={settings.language}
                  onLanguageChange={(language) => setSettings((prev) => ({ ...prev, language }))}
                />
              )}
            </div>
          </div>
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  )
}

type GeneralSettingsProps = {
  labels: (typeof localizedLabels)[Language]
  colorScheme: ColorScheme
  theme: AppTheme
  fontFamily: FontFamily
  notifyOnAgentCompletion: boolean
  notifyOnPermissionRequests: boolean
  notifyOnErrors: boolean
  soundOnAgentCompletion: AgentCompletionSound
  checkForUpdatesOnStartup: boolean
  showReleaseNotes: boolean
  onColorSchemeChange: (colorScheme: ColorScheme) => void
  onThemeChange: (theme: AppTheme) => void
  onFontFamilyChange: (fontFamily: FontFamily) => void
  onNotifyOnAgentCompletionChange: (enabled: boolean) => void
  onNotifyOnPermissionRequestsChange: (enabled: boolean) => void
  onNotifyOnErrorsChange: (enabled: boolean) => void
  onSoundOnAgentCompletionChange: (sound: AgentCompletionSound) => void
  onCheckForUpdatesOnStartupChange: (enabled: boolean) => void
  onShowReleaseNotesChange: (enabled: boolean) => void
}

function GeneralSettings({
  labels,
  colorScheme,
  theme,
  fontFamily,
  notifyOnAgentCompletion,
  notifyOnPermissionRequests,
  notifyOnErrors,
  soundOnAgentCompletion,
  checkForUpdatesOnStartup,
  showReleaseNotes,
  onColorSchemeChange,
  onThemeChange,
  onFontFamilyChange,
  onNotifyOnAgentCompletionChange,
  onNotifyOnPermissionRequestsChange,
  onNotifyOnErrorsChange,
  onSoundOnAgentCompletionChange,
  onCheckForUpdatesOnStartupChange,
  onShowReleaseNotesChange,
}: GeneralSettingsProps) {
  return (
    <div className="space-y-6">
      <section>
        <h3 className="mb-3 text-[13px] font-semibold text-[#1d1a17]">{labels.appearance}</h3>
        <div className="space-y-3">
          <label className="flex items-center justify-between">
            <span className="text-[13px] text-black/70">{labels.colorScheme}</span>
            <select
              data-testid="settings-color-scheme"
              value={colorScheme}
              onChange={(event) => onColorSchemeChange(event.target.value as ColorScheme)}
              className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-[13px] outline-none focus:ring-2 focus:ring-black/5"
            >
              <option>System</option>
              <option>Light</option>
              <option>Dark</option>
            </select>
          </label>
          <label className="flex items-center justify-between">
            <span className="text-[13px] text-black/70">{labels.theme}</span>
            <select
              data-testid="settings-theme"
              value={theme}
              onChange={(event) => onThemeChange(event.target.value as AppTheme)}
              className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-[13px] outline-none focus:ring-2 focus:ring-black/5"
            >
              <option>OpenSpace</option>
              <option>Graphite</option>
              <option>Paper</option>
            </select>
          </label>
          <label className="flex items-center justify-between">
            <span className="text-[13px] text-black/70">{labels.font}</span>
            <select
              data-testid="settings-font-family"
              value={fontFamily}
              onChange={(event) => onFontFamilyChange(event.target.value as FontFamily)}
              className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-[13px] outline-none focus:ring-2 focus:ring-black/5"
            >
              <option>Space Grotesk</option>
              <option>Inter</option>
              <option>IBM Plex Sans</option>
            </select>
          </label>
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-[13px] font-semibold text-[#1d1a17]">{labels.notifications}</h3>
        <div className="space-y-3">
          <label className="flex items-center gap-3">
            <input
              data-testid="settings-notify-agent-completion"
              type="checkbox"
              checked={notifyOnAgentCompletion}
              onChange={(event) => onNotifyOnAgentCompletionChange(event.target.checked)}
              className="h-4 w-4 rounded border-black/20"
            />
            <span className="text-[13px] text-black/70">{labels.notifyAgent}</span>
          </label>
          <label className="flex items-center gap-3">
            <input
              data-testid="settings-notify-permissions"
              type="checkbox"
              checked={notifyOnPermissionRequests}
              onChange={(event) => onNotifyOnPermissionRequestsChange(event.target.checked)}
              className="h-4 w-4 rounded border-black/20"
            />
            <span className="text-[13px] text-black/70">{labels.notifyPermissions}</span>
          </label>
          <label className="flex items-center gap-3">
            <input
              data-testid="settings-notify-errors"
              type="checkbox"
              checked={notifyOnErrors}
              onChange={(event) => onNotifyOnErrorsChange(event.target.checked)}
              className="h-4 w-4 rounded border-black/20"
            />
            <span className="text-[13px] text-black/70">{labels.notifyErrors}</span>
          </label>
          <label className="flex items-center justify-between">
            <span className="text-[13px] text-black/70">{labels.sound}</span>
            <select
              data-testid="settings-sound-agent-completion"
              value={soundOnAgentCompletion}
              onChange={(event) => onSoundOnAgentCompletionChange(event.target.value as AgentCompletionSound)}
              className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-[13px] outline-none focus:ring-2 focus:ring-black/5"
            >
              <option>None</option>
              <option>Chime</option>
              <option>Ding</option>
            </select>
          </label>
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-[13px] font-semibold text-[#1d1a17]">{labels.updates}</h3>
        <div className="space-y-3">
          <label className="flex items-center gap-3">
            <input
              data-testid="settings-updates-on-startup"
              type="checkbox"
              checked={checkForUpdatesOnStartup}
              onChange={(event) => onCheckForUpdatesOnStartupChange(event.target.checked)}
              className="h-4 w-4 rounded border-black/20"
            />
            <span className="text-[13px] text-black/70">{labels.updatesStartup}</span>
          </label>
          <label className="flex items-center gap-3">
            <input
              data-testid="settings-show-release-notes"
              type="checkbox"
              checked={showReleaseNotes}
              onChange={(event) => onShowReleaseNotesChange(event.target.checked)}
              className="h-4 w-4 rounded border-black/20"
            />
            <span className="text-[13px] text-black/70">{labels.releaseNotes}</span>
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
  { id: "openSettings", label: "Open Settings" },
  { id: "openFile", label: "Open File" },
  { id: "newSession", label: "New Session" },
  { id: "previousSession", label: "Previous Session" },
  { id: "nextSession", label: "Next Session" },
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
  const [importError, setImportError] = useState<string | null>(null)
  const [importSuccess, setImportSuccess] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const logShortcutIo = (stage: "start" | "success" | "failure", message: string, error?: unknown) => {
    const prefix = `[${new Date().toISOString()}] [ShortcutConfig] ${stage}: ${message}`
    if (stage === "failure") {
      console.error(prefix, error)
      return
    }
    console.info(prefix)
  }

  const handleExport = () => {
    try {
      logShortcutIo("start", "exporting portable shortcut config")
      const json = exportShortcutsPortableJson(shortcuts)
      const blob = new Blob([json], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = PORTABLE_SHORTCUTS_FILENAME
      link.click()
      URL.revokeObjectURL(url)
      setImportError(null)
      setImportSuccess(`Exported ${PORTABLE_SHORTCUTS_FILENAME}`)
      logShortcutIo("success", "exported portable shortcut config")
    } catch (error) {
      setImportError("Export failed. Please try again.")
      setImportSuccess(null)
      logShortcutIo("failure", "failed to export portable shortcut config", error)
    }
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return

    try {
      logShortcutIo("start", `importing portable shortcut config from ${file.name}`)
      const content = await file.text()
      const imported = importShortcutsPortableJson(content)
      onChange(imported)
      setImportError(null)
      setImportSuccess(`Imported ${file.name}`)
      logShortcutIo("success", `imported portable shortcut config from ${file.name}`)
    } catch (error) {
      setImportError("Invalid shortcut file. Expected OpenSpace portable JSON.")
      setImportSuccess(null)
      logShortcutIo("failure", `failed to import portable shortcut config from ${file.name}`, error)
    }
  }

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
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleImportClick}
            data-testid="shortcut-import"
            className="rounded-lg border border-black/10 px-3 py-1 text-[12px] font-medium text-black/60 hover:border-black/25"
          >
            Import
          </button>
          <button
            type="button"
            onClick={handleExport}
            data-testid="shortcut-export"
            className="rounded-lg border border-black/10 px-3 py-1 text-[12px] font-medium text-black/60 hover:border-black/25"
          >
            Export
          </button>
          <button
            type="button"
            onClick={() => onChange({ ...DEFAULT_SHORTCUTS })}
            data-testid="shortcut-reset-defaults"
            className="rounded-lg border border-black/10 px-3 py-1 text-[12px] font-medium text-black/60 hover:border-black/25"
          >
            Reset defaults
          </button>
          <input
            ref={fileInputRef}
            data-testid="shortcut-import-file"
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(event) => {
              void handleImportFile(event)
            }}
          />
        </div>
      </div>
      {importError && <p className="text-[12px] text-red-600">{importError}</p>}
      {importSuccess && <p className="text-[12px] text-emerald-600">{importSuccess}</p>}
      <div className="divide-y divide-black/[0.03]">
        {shortcutRows.map((row) => (
          <div key={row.id} className="flex items-center justify-between py-3">
            <span className="text-[13px] text-black/70">{row.label}</span>
            <button
              type="button"
              onClick={() => setCapturing(row.id)}
              data-testid={`shortcut-capture-${row.id}`}
              className="min-w-[160px] rounded-md bg-black/[0.04] px-2 py-1 text-center font-mono text-[11px] text-black/70 hover:bg-black/[0.08]"
            >
              <span data-testid={`shortcut-value-${row.id}`}>
                {capturing === row.id ? "Press keys..." : shortcuts[row.id] || "Not set"}
              </span>
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

function ProvidersSettings() {
  const server = useServer()
  const dialog = useDialog()
  const queryClient = useQueryClient()
  const providersQuery = useProviders()
  const providerAuthQuery = useProviderAuth()

  const disconnectProvider = useMutation({
    mutationFn: async (providerID: string) => {
      await openCodeService.client.auth.remove({ providerID })
      return providerID
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: providersQueryKey(server.activeUrl, openCodeService.directory),
      })
      queryClient.invalidateQueries({
        queryKey: providerAuthQueryKey(server.activeUrl, openCodeService.directory),
      })
      queryClient.invalidateQueries({
        queryKey: modelsQueryKey(server.activeUrl, openCodeService.directory),
      })
    },
  })

  const providers = providersQuery.data?.all ?? []
  const connectedProviders = new Set(providersQuery.data?.connected ?? [])
  const defaults = providersQuery.data?.default ?? {}
  const authMap = providerAuthQuery.data ?? {}

  if (providersQuery.isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-black/60">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading providers...
      </div>
    )
  }

  if (providers.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-[13px] text-black/50">Manage AI provider connections.</p>
        <div className="rounded-xl border border-black/[0.05] bg-black/[0.01] p-4">
          <p className="text-[13px] text-black/40">No providers available from the active OpenCode server.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <p className="text-[13px] text-black/50">Manage AI provider connections and default models.</p>
      <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
        {providers.map((provider) => {
          const isConnected = connectedProviders.has(provider.id)
          const isAuthenticated =
            Boolean((authMap as Record<string, { authenticated?: boolean } | undefined>)[provider.id]?.authenticated)
          const modelCount = Object.keys(provider.models ?? {}).length
          const defaultModelId = defaults[provider.id]
          const defaultModelName = defaultModelId
            ? provider.models?.[defaultModelId]?.name ?? defaultModelId
            : undefined
          const isDisconnecting =
            disconnectProvider.isPending && disconnectProvider.variables === provider.id

          return (
            <div
              key={provider.id}
              className="flex items-center justify-between rounded-xl border border-black/[0.06] bg-white px-4 py-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate text-[13px] font-semibold text-[#1d1a17]">{provider.name}</span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                      isConnected || isAuthenticated ? "bg-emerald-50 text-emerald-700" : "bg-black/[0.04] text-black/50"
                    }`}
                  >
                    {isConnected || isAuthenticated ? "Connected" : "Disconnected"}
                  </span>
                </div>
                <div className="mt-1 text-[12px] text-black/50">
                  {modelCount} model{modelCount === 1 ? "" : "s"}
                  {defaultModelName ? ` · Default: ${defaultModelName}` : ""}
                </div>
              </div>
              {isConnected || isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => disconnectProvider.mutate(provider.id)}
                  disabled={isDisconnecting}
                  className="min-w-[104px] rounded-lg border border-black/10 px-3 py-1.5 text-[12px] font-medium text-black/70 hover:border-black/25 disabled:opacity-50"
                >
                  {isDisconnecting ? "Disconnecting..." : "Disconnect"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => dialog.show(<DialogConnectProvider providerId={provider.id} />)}
                  className="min-w-[104px] rounded-lg bg-[#1d1a17] px-3 py-1.5 text-[12px] font-medium text-white hover:opacity-90"
                >
                  Connect
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

type AgentsSettingsProps = {
  defaultAgent: string
  onDefaultAgentChange: (defaultAgent: string) => void
}

function AgentsSettings({ defaultAgent, onDefaultAgentChange }: AgentsSettingsProps) {
  const agentsQuery = useAgents()
  const agents = agentsQuery.data ?? []

  return (
    <div className="space-y-5">
      <p className="text-[13px] text-black/50">Configure the default agent used for new prompts.</p>
      {agentsQuery.isLoading ? (
        <div className="flex items-center gap-2 text-sm text-black/60">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading agents...
        </div>
      ) : (
        <>
          <label className="flex items-center justify-between">
            <span className="text-[13px] text-black/70">Default Agent</span>
            <select
              value={defaultAgent}
              onChange={(event) => onDefaultAgentChange(event.target.value)}
              className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-[13px] outline-none focus:ring-2 focus:ring-black/5"
            >
              <option value="">Automatic (build, then first available)</option>
              {agents.map((agent) => (
                <option key={agent.name} value={agent.name}>
                  {agent.name}
                </option>
              ))}
            </select>
          </label>

          <div className="max-h-[300px] space-y-2 overflow-y-auto rounded-xl border border-black/[0.05] bg-black/[0.01] p-3 pr-2">
            {agents.length === 0 ? (
              <p className="text-[13px] text-black/40">No agents available from the active OpenCode server.</p>
            ) : (
              agents.map((agent) => (
                <div key={agent.name} className="flex items-start gap-2 rounded-lg bg-white px-3 py-2">
                  <Sparkles className="mt-0.5 h-3.5 w-3.5 text-black/35" />
                  <div className="min-w-0">
                    <div className="text-[13px] font-medium text-[#1d1a17]">{agent.name}</div>
                    {agent.description && (
                      <div className="truncate text-[12px] text-black/50">{agent.description}</div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
      <div className="text-[12px] text-black/45">
        Automatic mode uses <code className="rounded bg-black/5 px-1 py-0.5">build</code> when available.
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
  labels: (typeof localizedLabels)[Language]
  language: Language
  onLanguageChange: (language: Language) => void
}

function LanguageSettings({ labels, language, onLanguageChange }: LanguageSettingsProps) {
  return (
    <div className="space-y-4">
      <p className="text-[13px] text-black/50">Select your preferred language.</p>
      <label className="flex items-center justify-between">
        <span className="text-[13px] text-black/70">{labels.language}</span>
        <select
          data-testid="settings-language"
          value={language}
          onChange={(event) => onLanguageChange(event.target.value as Language)}
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
