import clsx from "clsx"
import { useRef, type KeyboardEvent } from "react"
import { Image, ArrowUp, Loader2 } from "lucide-react"
import type { PromptAttachment } from "../types/opencode"

type PromptInputProps = {
  value: string
  disabled?: boolean
  isPending?: boolean
  attachments: PromptAttachment[]
  onChange: (value: string) => void
  onSubmit: () => void
  onAddAttachment: (files: FileList | null) => void
  onRemoveAttachment: (id: string) => void
  leftSection?: React.ReactNode
  rightSection?: React.ReactNode
}

export function PromptInput({
  value,
  disabled,
  isPending,
  attachments,
  onChange,
  onSubmit,
  onAddAttachment,
  onRemoveAttachment,
  leftSection,
  rightSection,
}: PromptInputProps) {
  const fileRef = useRef<HTMLInputElement | null>(null)

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      onSubmit()
    }
  }

  const handleTextareaInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget
    target.style.height = "auto"
    target.style.height = `${target.scrollHeight}px`
  }

  return (
    <div className="flex w-full flex-col gap-2 px-4 pb-4">
      <div className="relative flex w-full flex-col overflow-hidden rounded-[26px] border border-black/10 bg-white shadow-sm transition-shadow focus-within:shadow-md">
        <div className="flex flex-col px-5 pt-4">
          <textarea
            rows={1}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={handleTextareaInput}
            placeholder='Ask anything... "Review my code for best practices"'
            className="w-full resize-none border-none bg-transparent p-0 text-[15px] leading-relaxed text-[#1d1a17] outline-none placeholder:text-[#a0a0a0]"
            disabled={disabled}
            style={{ minHeight: '24px', maxHeight: '400px' }}
          />
          
          {attachments.length > 0 && (
            <div className="mb-2 mt-3 flex flex-wrap gap-2">
              {attachments.map((item) => (
                <div
                  key={item.id}
                  className="group relative flex h-16 w-16 overflow-hidden rounded-xl border border-black/5"
                >
                  {item.mime.startsWith("image/") ? (
                    <img src={item.dataUrl} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-black/5 text-[10px] font-medium uppercase tracking-tighter">
                      PDF
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => onRemoveAttachment(item.id)}
                    className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <span className="text-[10px]">×</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-3 py-2.5">
          <div className="flex items-center gap-1">
            {leftSection}
          </div>
          
          <div className="flex items-center gap-1.5">
            {rightSection}
            
            <button
              type="button"
              disabled={disabled}
              onClick={() => fileRef.current?.click()}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[#1d1a17]/40 transition hover:bg-black/5 hover:text-[#1d1a17]"
            >
              <Image className="h-4.5 w-4.5" />
            </button>
            
            <button
              type="button"
              onClick={onSubmit}
              disabled={disabled || (!value.trim() && attachments.length === 0)}
              className={clsx(
                "flex h-8 w-8 items-center justify-center rounded-lg transition-all",
                value.trim() || attachments.length > 0
                  ? "bg-[#1d1a17] text-white"
                  : "bg-black/5 text-[#1d1a17]/20"
              )}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowUp className="h-4.5 w-4.5 stroke-[2.5]" />
              )}
            </button>
          </div>
        </div>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        multiple
        onChange={(event) => onAddAttachment(event.target.files)}
      />
    </div>
  )
}
