export type ToastTone = "error" | "info" | "success"

export type ToastInput = {
  title: string
  description?: string
  tone?: ToastTone
  duration?: number
  id?: string
}

export type ToastItem = {
  id: string
  title: string
  description?: string
  tone: ToastTone
  duration: number
}

type Listener = () => void

const listeners = new Set<Listener>()
const recent = new Map<string, number>()
let toasts: ToastItem[] = []

const DEFAULT_DURATION = 5000

const emit = () => {
  listeners.forEach((listener) => listener())
}

const getId = () => `toast-${Date.now()}-${Math.round(Math.random() * 1e6)}`

export const subscribeToToasts = (listener: Listener) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const getToastSnapshot = () => toasts

export const removeToast = (id: string) => {
  toasts = toasts.filter((toast) => toast.id !== id)
  emit()
}

export const pushToast = (input: ToastInput) => {
  const id = input.id ?? getId()
  const toast: ToastItem = {
    id,
    title: input.title,
    description: input.description,
    tone: input.tone ?? "info",
    duration: input.duration ?? DEFAULT_DURATION,
  }
  toasts = [...toasts, toast]
  emit()
  if (toast.duration > 0) {
    globalThis.setTimeout(() => removeToast(id), toast.duration)
  }
  return id
}

export const pushToastOnce = (key: string, input: ToastInput, windowMs = 6000) => {
  const now = Date.now()
  const last = recent.get(key)
  if (last && now - last < windowMs) return null
  recent.set(key, now)
  return pushToast(input)
}
