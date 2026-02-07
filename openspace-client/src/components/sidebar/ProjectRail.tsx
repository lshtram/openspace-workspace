import * as Popover from "@radix-ui/react-popover"
import * as Dialog from "@radix-ui/react-dialog"
import { cn } from "../../lib/utils"
import { Settings, HelpCircle, Plus, Key, Terminal, Palette, Globe } from "lucide-react"
import { SettingsDialog } from "../SettingsDialog"

export type Project = {
  id: string
  name: string
  path: string
  initial: string
  color: string
  badge?: "red" | "blue"
}

type ProjectRailProps = {
  projects: Project[]
  activeProjectId: string
  onSelectProject: (id: string) => void
  onAddProject: () => void
}

export function ProjectRail({
  projects,
  activeProjectId,
  onSelectProject,
  onAddProject,
}: ProjectRailProps) {
  return (
    <aside className="flex h-full w-[68px] flex-col items-center border-r border-black/[0.03] py-4 bg-[#fcfbf9] z-20">
      <div className="flex-1 flex flex-col gap-3">
        {projects.map((project) => (
          <button
            key={project.id}
            onClick={() => onSelectProject(project.id)}
            className={cn(
              "relative flex h-11 w-11 items-center justify-center rounded-xl transition-all hover:scale-105",
              project.color,
              activeProjectId === project.id
                ? "ring-2 ring-black ring-offset-2"
                : "opacity-80 hover:opacity-100"
            )}
          >
            <span className="text-lg font-bold" style={{ color: "rgba(0,0,0,0.6)" }}>
              {project.initial}
            </span>
            {project.badge && (
              <div
                className={cn(
                  "absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-white",
                  project.badge === "red" ? "bg-red-500" : "bg-blue-500"
                )}
              />
            )}
          </button>
        ))}
        <button
          onClick={onAddProject}
          className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-dashed border-black/10 text-black/40 transition-colors hover:border-black/20 hover:text-black/60"
        >
          <Plus size={20} />
        </button>
      </div>

      <div className="flex flex-col gap-4 pb-2 text-black/30">
        <SettingsMenu />
        <button className="hover:text-black/60 transition-colors">
          <HelpCircle size={22} strokeWidth={1.5} />
        </button>
      </div>
    </aside>
  )
}

function SettingsMenu() {
  return (
    <Dialog.Root>
      <Popover.Root>
        <Popover.Trigger asChild>
          <button className="hover:text-black/60 transition-colors">
            <Settings size={22} strokeWidth={1.5} />
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            side="right"
            align="end"
            sideOffset={12}
            className="z-50 w-[240px] overflow-hidden rounded-2xl border border-black/5 bg-white p-1.5 shadow-2xl animate-in fade-in slide-in-from-left-2 duration-200"
          >
            <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-[#a0a0a0]">
              Settings
            </div>
            <div className="space-y-0.5">
              {[
                { icon: Key, label: "API Keys", detail: "Manage providers" },
                { icon: Terminal, label: "Terminal", detail: "Appearance & Shell" },
                { icon: Palette, label: "Theme", detail: "Light / Dark mode" },
                { icon: Globe, label: "Language", detail: "English" },
              ].map((item) => (
                <Dialog.Trigger asChild key={item.label}>
                  <button
                    className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition hover:bg-black/5"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-black/[0.03]">
                      <item.icon size={15} className="text-black/60" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[13px] font-medium text-[#1d1a17]">{item.label}</span>
                      <span className="text-[11px] text-black/40">{item.detail}</span>
                    </div>
                  </button>
                </Dialog.Trigger>
              ))}
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
      <SettingsDialog />
    </Dialog.Root>
  )
}
