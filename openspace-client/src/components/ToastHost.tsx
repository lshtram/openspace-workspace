import { useSyncExternalStore } from "react"
import { X } from "lucide-react"
import {
  getToastSnapshot,
  removeToast,
  subscribeToToasts,
  type ToastItem,
} from "../utils/toastStore"

const toneStyles: Record<ToastItem["tone"], { bar: string; title: string }> = {
  error: { bar: "bg-red-500", title: "text-red-800" },
  info: { bar: "bg-amber-500", title: "text-amber-800" },
  success: { bar: "bg-emerald-500", title: "text-emerald-800" },
  warning: { bar: "bg-orange-500", title: "text-orange-800" },
}

export function ToastHost() {
  const toasts = useSyncExternalStore(subscribeToToasts, getToastSnapshot, getToastSnapshot)

  if (toasts.length === 0) return null

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed bottom-6 right-6 z-50 flex w-[320px] flex-col gap-2"
    >
      {toasts.map((toast) => {
        const tone = toneStyles[toast.tone]
        return (
          <div
            key={toast.id}
            role="status"
            className="pointer-events-auto overflow-hidden rounded-2xl border border-black/10 bg-white/95 shadow-xl backdrop-blur"
          >
            <div className="flex items-start gap-3 px-4 py-3">
              <div className={`mt-1 h-8 w-1 rounded-full ${tone.bar}`} />
              <div className="flex-1">
                <div className={`text-sm font-semibold ${tone.title}`}>{toast.title}</div>
                {toast.description && <div className="mt-1 text-xs text-muted">{toast.description}</div>}
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="-mr-1 mt-0.5 rounded-full p-1 text-muted transition hover:bg-black/5 hover:text-[var(--text)]"
                aria-label="Dismiss"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
