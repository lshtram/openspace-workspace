import * as Popover from "@radix-ui/react-popover"
import { ChevronDown, Check } from "lucide-react"
import { LAYER_POPOVER } from "../constants/layers"

type AgentSelectorProps = {
  agents: string[]
  value: string
  onChange: (value: string) => void
}

export function AgentSelector({ agents, value, onChange }: AgentSelectorProps) {
  const selected = value

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          className="group flex items-center gap-1 rounded-md px-2 py-1 text-[12px] font-semibold text-[#1d1a17] transition hover:bg-black/5"
        >
          <span className="capitalize">{selected}</span>
          <ChevronDown className="h-3.5 w-3.5 opacity-40 transition-transform group-data-[state=open]:rotate-180" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side="top"
          align="start"
          sideOffset={6}
          className="min-w-[120px] overflow-hidden rounded-xl border border-black/5 bg-white p-1 shadow-2xl animate-in fade-in zoom-in-95"
          style={{ zIndex: LAYER_POPOVER }}
        >
          <div className="space-y-0.5">
            {agents.map((agent) => (
              <button
                key={agent}
                type="button"
                className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-[13px] hover:bg-black/5"
                onClick={() => onChange(agent)}
              >
                <span className={agent === value ? "font-semibold capitalize" : "capitalize"}>{agent}</span>
                {agent === value && <Check className="h-3.5 w-3.5" />}
              </button>
            ))}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
