import * as Dialog from "@radix-ui/react-dialog"
import { useEffect, useState } from "react"
import { cn } from "../../lib/utils"
import { Settings, HelpCircle, Plus } from "lucide-react"
import { SettingsDialog } from "../SettingsDialog"
import { OPEN_SETTINGS_EVENT } from "../../utils/shortcuts"

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
        {projects.map((project, index) => (
          <button
            key={project.id}
            onClick={() => onSelectProject(project.id)}
            data-testid={`project-${index}`}
            aria-label={`Select project ${project.name}`}
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
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const openDialog = () => setOpen(true)
    window.addEventListener(OPEN_SETTINGS_EVENT, openDialog)
    return () => window.removeEventListener(OPEN_SETTINGS_EVENT, openDialog)
  }, [])

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button className="hover:text-black/60 transition-colors" aria-label="Open settings">
          <Settings size={22} strokeWidth={1.5} />
        </button>
      </Dialog.Trigger>
      <SettingsDialog />
    </Dialog.Root>
  )
}
