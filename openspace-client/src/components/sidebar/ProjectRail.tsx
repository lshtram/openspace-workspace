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
  onProjectIconPress?: () => void
  onAddProject: () => void
}

export function ProjectRail({
  projects,
  activeProjectId,
  onSelectProject,
  onProjectIconPress,
  onAddProject,
}: ProjectRailProps) {
  return (
    <aside className="z-20 flex h-full w-[44px] flex-col items-center border-r border-black/[0.03] bg-[#fcfbf9] py-2.5 transition-[width] duration-300 ease-in-out">
      <div className="flex flex-1 flex-col gap-1.5">
        {projects.map((project, index) => (
          <button
            key={project.id}
            type="button"
            onClick={() => {
              onProjectIconPress?.()
              onSelectProject(project.id)
            }}
            data-testid={`project-${index}`}
            aria-label={`Select project ${project.name}`}
            className={cn(
              "relative flex h-7 w-7 items-center justify-center rounded-lg transition-all hover:scale-105",
              project.color,
              activeProjectId === project.id
                ? "ring-2 ring-black ring-offset-2"
                : "opacity-80 hover:opacity-100"
            )}
          >
            <span className="text-[11px] font-bold" style={{ color: "rgba(0,0,0,0.6)" }}>
              {project.initial}
            </span>
            {project.badge && (
              <div
                className={cn(
                  "absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full ring-2 ring-white",
                  project.badge === "red" ? "bg-red-500" : "bg-blue-500"
                )}
              />
            )}
          </button>
        ))}
          <button
            type="button"
            onClick={onAddProject}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-dashed border-black/10 text-black/40 transition-colors hover:border-black/20 hover:text-black/60"
          >
            <Plus size={14} />
          </button>
      </div>

      <div className="flex flex-col gap-2 pb-1 text-black/30">
        <SettingsMenu />
        <button type="button" className="hover:text-black/60 transition-colors">
          <HelpCircle size={15} strokeWidth={1.75} />
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
        <button type="button" className="hover:text-black/60 transition-colors" aria-label="Open settings">
          <Settings size={16} strokeWidth={1.75} />
        </button>
      </Dialog.Trigger>
      <SettingsDialog />
    </Dialog.Root>
  )
}
