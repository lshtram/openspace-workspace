import React, { useState } from 'react';
import { ChevronDown, ChevronRight, type LucideIcon } from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { ToolPart } from '../../../lib/opencode/v2/gen/types.gen';

interface BaseToolRendererProps {
  part: ToolPart;
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  isStep?: boolean;
  defaultExpanded?: boolean;
}

export function BaseToolRenderer({
  part,
  icon: Icon,
  title,
  subtitle,
  children,
  isStep,
  defaultExpanded = false,
}: BaseToolRendererProps) {
  if (!part) {
    throw new Error('BaseToolRenderer requires tool part');
  }
  const [expanded, setExpanded] = useState(defaultExpanded);
  const status = part.state.status;

  return (
    <div className="flex flex-col w-full">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className={cn(
          "flex w-full items-center gap-2 rounded-lg border border-black/[0.03] bg-black/[0.015] px-3 py-1.5 text-left transition-all hover:bg-black/[0.03]",
          isStep ? "text-[12px]" : "text-[13px]"
        )}
      >
        <div className={cn(
          "h-1.5 w-1.5 rounded-full shrink-0",
          status === "completed" ? "bg-emerald-500" : status === "error" ? "bg-red-500" : "bg-blue-400 animate-pulse"
        )} />
        <Icon size={14} className="opacity-40 shrink-0" />
        <div className="flex flex-1 items-baseline gap-2 truncate">
          <span className="font-semibold text-black/60">{title}</span>
          {subtitle && <span className="truncate font-mono text-black/30 text-[11px]">{subtitle}</span>}
        </div>
        {expanded ? <ChevronDown size={14} className="opacity-20" /> : <ChevronRight size={14} className="opacity-20" />}
      </button>
      
      {expanded && (
        <div
          data-scrollable="true"
          className="mt-1 rounded-xl border border-black/5 bg-[#151312] p-3 font-mono text-[12px] text-[#f6f3ef] overflow-x-auto shadow-inner"
        >
          {status === "error" && (
            <div className="mb-2 rounded border border-red-500/20 bg-red-500/10 p-2 text-red-400">
              <div className="text-[10px] font-bold uppercase tracking-wider mb-1 opacity-60">Error</div>
              {part.state.status === "error" ? part.state.error : "Unknown error"}
            </div>
          )}
          {children}
        </div>
      )}
    </div>
  );
}
