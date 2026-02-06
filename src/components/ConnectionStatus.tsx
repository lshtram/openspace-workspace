import clsx from "clsx"

type ConnectionStatusProps = {
  connected: boolean
  checking: boolean
  onRetry: () => void
}

export function ConnectionStatus({ connected, checking, onRetry }: ConnectionStatusProps) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={clsx(
          "flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium uppercase tracking-[0.2em]",
          connected ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700",
        )}
      >
        <span
          className={clsx(
            "h-2 w-2 rounded-full",
            connected ? "bg-emerald-500" : "bg-amber-500",
          )}
        />
        {checking ? "checking" : connected ? "connected" : "offline"}
      </div>
      {!connected && (
        <button
          type="button"
          onClick={onRetry}
          className="text-xs font-semibold uppercase tracking-[0.2em] text-accent hover:text-accent"
        >
          retry
        </button>
      )}
    </div>
  )
}
