import * as Dialog from "@radix-ui/react-dialog"
import { X, Keyboard, Globe, Key, Palette, Terminal, Bot } from "lucide-react"
import { useState } from "react"

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

export function SettingsDialog() {
  const [activeTab, setActiveTab] = useState("general")

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

            {activeTab === "general" && <GeneralSettings />}
            {activeTab === "shortcuts" && <ShortcutsSettings />}
            {activeTab === "providers" && <ProvidersSettings />}
            {activeTab === "agents" && <AgentsSettings />}
            {activeTab === "terminal" && <TerminalSettings />}
            {activeTab === "language" && <LanguageSettings />}
          </div>
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  )
}

function GeneralSettings() {
  return (
    <div className="space-y-6">
      <section>
        <h3 className="mb-3 text-[13px] font-semibold text-[#1d1a17]">Appearance</h3>
        <div className="space-y-3">
          <label className="flex items-center justify-between">
            <span className="text-[13px] text-black/70">Theme</span>
            <select className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-[13px] outline-none focus:ring-2 focus:ring-black/5">
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
            <input type="checkbox" className="h-4 w-4 rounded border-black/20" />
            <span className="text-[13px] text-black/70">Enable sound notifications</span>
          </label>
          <label className="flex items-center gap-3">
            <input type="checkbox" className="h-4 w-4 rounded border-black/20" />
            <span className="text-[13px] text-black/70">Notify on agent completion</span>
          </label>
        </div>
      </section>
    </div>
  )
}

function ShortcutsSettings() {
  const shortcuts = [
    { key: "New Session", shortcut: "Ctrl+N" },
    { key: "Send Message", shortcut: "Enter" },
    { key: "New Line", shortcut: "Shift+Enter" },
    { key: "Open Settings", shortcut: "Ctrl+," },
    { key: "Toggle Sidebar", shortcut: "Ctrl+B" },
  ]

  return (
    <div className="space-y-4">
      <p className="text-[13px] text-black/50">Keyboard shortcuts for common actions.</p>
      <div className="divide-y divide-black/[0.03]">
        {shortcuts.map(({ key, shortcut }) => (
          <div key={key} className="flex items-center justify-between py-3">
            <span className="text-[13px] text-black/70">{key}</span>
            <kbd className="rounded-md bg-black/[0.04] px-2 py-1 font-mono text-[11px] text-black/60">
              {shortcut}
            </kbd>
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

function TerminalSettings() {
  return (
    <div className="space-y-4">
      <p className="text-[13px] text-black/50">Customize terminal appearance and behavior.</p>
      <div className="space-y-3">
        <label className="flex items-center justify-between">
          <span className="text-[13px] text-black/70">Default Shell</span>
          <select className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-[13px] outline-none focus:ring-2 focus:ring-black/5">
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

function LanguageSettings() {
  return (
    <div className="space-y-4">
      <p className="text-[13px] text-black/50">Select your preferred language.</p>
      <label className="flex items-center justify-between">
        <span className="text-[13px] text-black/70">Language</span>
        <select className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-[13px] outline-none focus:ring-2 focus:ring-black/5">
          <option>English</option>
          <option>Deutsch</option>
          <option>Español</option>
          <option>Français</option>
        </select>
      </label>
    </div>
  )
}
