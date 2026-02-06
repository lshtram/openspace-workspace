import * as Tooltip from "@radix-ui/react-tooltip"

type ContextMeterProps = {
  percentage: number | null
  tokens: string
  cost: string
}

export function ContextMeter({ percentage, tokens, cost }: ContextMeterProps) {
  const value = percentage ?? 0
  const radius = 10
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (value / 100) * circumference

  return (
    <Tooltip.Provider delayDuration={0}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <button className="relative flex h-8 w-8 items-center justify-center rounded-full hover:bg-[var(--surface-strong)] transition-colors">
            <svg className="h-6 w-6 -rotate-90 transform">
              <circle
                cx="12"
                cy="12"
                r={radius}
                stroke="currentColor"
                strokeWidth="2"
                fill="transparent"
                className="text-[var(--border)]"
              />
              <circle
                cx="12"
                cy="12"
                r={radius}
                stroke="currentColor"
                strokeWidth="2"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                className="text-[var(--accent)] transition-all duration-500 ease-out"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            side="top"
            align="center"
            sideOffset={8}
            className="z-50 min-w-[140px] rounded-xl bg-[#151312] p-3 text-white shadow-xl"
          >
            <div className="flex flex-col gap-1 text-[13px] font-medium leading-none">
              <div className="flex justify-between gap-4 py-1">
                <span>{tokens}</span>
                <span className="text-[#a0a0a0]">Tokens</span>
              </div>
              <div className="flex justify-between gap-4 py-1">
                <span>{value}%</span>
                <span className="text-[#a0a0a0]">Usage</span>
              </div>
              <div className="flex justify-between gap-4 py-1">
                <span>{cost}</span>
                <span className="text-[#a0a0a0]">Cost</span>
              </div>
            </div>
            <Tooltip.Arrow className="fill-[#151312]" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  )
}
