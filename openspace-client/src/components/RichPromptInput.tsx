import React, { useMemo, useState, useRef, useEffect } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Image, ArrowUp, Square, Layers, Terminal } from "lucide-react";
import { RichEditor, type Prompt } from "./RichEditor";
import type { PromptAttachment } from "../types/opencode";
import { ContextPanel } from "./ContextPanel";
import { parseStringToParts } from "../utils/history";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type RichPromptInputProps = {
  sessionId?: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: (parts: Prompt, mode: 'normal' | 'shell') => void;
  attachments: PromptAttachment[];
  onAddAttachment: (files: FileList | null) => void;
  onRemoveAttachment: (id: string) => void;
  onAbort?: () => void;
  isPending?: boolean;
  disabled?: boolean;
  fileSuggestions?: string[];
  agentSuggestions?: string[];
  leftSection?: React.ReactNode;
  rightSection?: React.ReactNode;
};

export function RichPromptInput({
  sessionId,
  value,
  onChange,
  onSubmit,
  attachments,
  onAddAttachment,
  onRemoveAttachment,
  onAbort,
  isPending,
  disabled,
  fileSuggestions = [],
  agentSuggestions = [],
  leftSection,
  rightSection,
}: RichPromptInputProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isContextPanelOpen, setIsContextPanelOpen] = useState(false);
  const [mode, setMode] = useState<'normal' | 'shell'>('normal');
  const lastRestoredSession = useRef<string | undefined>(undefined);

  // Draft persistence
  useEffect(() => {
    if (!sessionId || lastRestoredSession.current === sessionId) return;
    const key = `prompt-draft-${sessionId}`;
    const saved = localStorage.getItem(key);
    if (saved && !value) {
      onChange(saved);
    }
    lastRestoredSession.current = sessionId;
  }, [sessionId, value, onChange]);

  useEffect(() => {
    if (!sessionId) return;
    const key = `prompt-draft-${sessionId}`;
    if (value) {
      localStorage.setItem(key, value);
    } else {
      localStorage.removeItem(key);
    }
  }, [sessionId, value]);

  // Convert string value to parts for RichEditor
  const parts = useMemo((): Prompt => {
    return parseStringToParts(value, fileSuggestions, agentSuggestions);
  }, [value, fileSuggestions, agentSuggestions]);

  const handleEditorChange = (newParts: Prompt, _cursorPosition: number) => {
    // TODO: Use cursor position if needed
    void _cursorPosition;
    const text = newParts
      .map((p) => {
        if (p.type === 'text') return p.content;
        if (p.type === 'file') return `@${p.path}`;
        if (p.type === 'agent') return `@${p.name}`;
        return '';
      })
      .join('');
    onChange(text);
  };

  const handleEditorSubmit = () => {
    onSubmit(parts, mode);
  };

  return (
    <div className="w-full border-t border-black/10 bg-[#f3f0ea] px-2 pb-1 pt-1" data-testid="rich-prompt-shell">
      <div className={cn(
        "relative flex w-full flex-col overflow-hidden bg-transparent",
        mode === 'shell' && "ring-1 ring-primary/20"
      )}>
        <div className="flex flex-col px-2 pt-1.5">
          {mode === 'shell' && (
            <div className="flex items-center gap-2 px-3 py-1 text-xs font-mono text-primary animate-pulse">
              <Terminal size={12} />
              <span>Shell Mode</span>
            </div>
          )}
          
          <RichEditor
            parts={parts}
            onChange={handleEditorChange}
            onSubmit={handleEditorSubmit}
            mode={mode}
            onModeChange={setMode}
            disabled={disabled}
            placeholder={mode === 'shell' ? "Enter shell command..." : 'Ask anything... "Review my code"'}
            fileSuggestions={fileSuggestions}
            agentSuggestions={agentSuggestions}
            commandSuggestions={[
              { name: 'reset', description: 'Reset the current session' },
              { name: 'clear', description: 'Clear the terminal' },
              { name: 'compact', description: 'Compact session history' },
            ]}
          />

          {attachments.length > 0 && (
            <div className="mb-1 mt-1 flex flex-wrap gap-2 px-3">
              {attachments.map((item) => (
                <div
                  key={item.id}
                  className="group relative flex h-14 w-14 overflow-hidden rounded-lg border border-black/5"
                >
                  {item.mime.startsWith("image/") ? (
                    <img src={item.dataUrl} alt={item.name} className="h-full w-full object-cover" />
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

        <div className="flex items-center justify-between px-2.5 py-1.5">
          <div className="flex items-center gap-1">
            {leftSection}
          </div>
          
          <div className="flex items-center gap-1.5">
            {rightSection}

            <button
              type="button"
              aria-label="Open context panel"
              disabled={disabled}
              onClick={() => setIsContextPanelOpen((prev) => !prev)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[#1d1a17]/40 transition hover:bg-black/5 hover:text-[#1d1a17]"
            >
              <Layers className="h-4.5 w-4.5" />
            </button>
            <ContextPanel
              items={fileSuggestions.slice(0, 16)}
              open={isContextPanelOpen}
              onOpenChange={setIsContextPanelOpen}
              onInsert={(path) => {
                const next = value ? `${value} @${path} ` : `@${path} `;
                onChange(next);
              }}
            />

            <button
              type="button"
              disabled={disabled && !isPending}
              onClick={() => fileInputRef.current?.click()}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[#1d1a17]/40 transition hover:bg-black/5 hover:text-[#1d1a17]"
            >
              <Image className="h-4.5 w-4.5" />
            </button>

            <button
              type="button"
              onClick={isPending ? onAbort : handleEditorSubmit}
              disabled={!isPending && !value.trim() && attachments.length === 0}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg transition-all",
                isPending
                  ? "bg-red-500 text-white hover:bg-red-600"
                  : value.trim() || attachments.length > 0
                    ? "bg-[#1d1a17] text-white"
                    : "bg-black/5 text-[#1d1a17]/20"
              )}
            >
              {isPending ? (
                <Square className="h-3.5 w-3.5 fill-current" />
              ) : (
                <ArrowUp className="h-4.5 w-4.5 stroke-[2.5]" />
              )}
            </button>
          </div>
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        multiple
        onChange={(event) => onAddAttachment(event.target.files)}
      />
    </div>
  );
}
