import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { File, Bot, Zap } from 'lucide-react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type SuggestionType = 'agent' | 'file' | 'command';

export interface SuggestionOption {
  id: string;
  type: SuggestionType;
  label: string;
  description?: string;
  path?: string;
  name?: string;
  icon?: React.ReactNode;
}

interface AutocompletePopoverProps {
  isOpen: boolean;
  type: 'at' | 'slash' | null;
  query: string;
  options: SuggestionOption[];
  activeIndex: number;
  onSelect: (option: SuggestionOption) => void;
  onMouseEnter: (index: number) => void;
  onClose: () => void;
  className?: string;
}

// Helper to truncate path smartly - show filename prominently
function formatFilePath(path: string, maxLength = 55): string {
  if (!path) return path;
  
  if (path.length <= maxLength) return path;
  
  // Show: ... + last 3 parts (including filename)
  const parts = path.split('/');
  const keepParts = parts.slice(-3);
  return `.../${keepParts.join('/')}`;
}

export const AutocompletePopover: React.FC<AutocompletePopoverProps> = ({
  isOpen,
  type,
  query,
  options,
  activeIndex,
  onSelect,
  onMouseEnter,
  onClose,
  className,
}) => {
  if (!isOpen || !type || options.length === 0) return null;

  // Take top 10 suggestions
  const displayOptions = options.slice(0, 10);
  const heightClass = displayOptions.length < 10 ? '' : 'max-h-72';

  // Format display text based on type
  const getDisplayText = () => {
    if (!query) {
      return type === 'at' ? '@agents & files' : '/commands';
    }
    return type === 'at' ? `@${query}` : `/${query}`;
  };

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center",
        className
      )}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* Subtle overlay - no blur, just slight dim to focus attention */}
      <div className="absolute inset-0 bg-white/10" />
      
      <div className="relative z-10">
        <div
          data-testid="prompt-suggestion-list"
          className={cn(
            "w-[520px] bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden",
            "animate-in fade-in zoom-in-95 duration-200"
          )}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Header with current query - white background */}
          <div className="px-4 py-2.5 border-b border-gray-100 bg-white">
            <span className="text-sm text-gray-700 font-medium">
              {getDisplayText()}
            </span>
          </div>

          {/* Options List */}
          <div className={cn("overflow-y-auto py-1", heightClass)}>
            {displayOptions.map((option, index) => (
              <button
                key={option.id}
                type="button"
                data-testid="prompt-suggestion-item"
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2 text-left transition-colors",
                  index === activeIndex
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-700 hover:bg-gray-50"
                )}
                onClick={() => onSelect(option)}
                onMouseEnter={() => onMouseEnter(index)}
              >
                <div className={cn(
                  "shrink-0",
                  index === activeIndex ? "text-gray-500" : "text-gray-400"
                )}>
                  {option.type === 'file' && <File size={16} />}
                  {option.type === 'agent' && <Bot size={16} />}
                  {option.type === 'command' && <Zap size={16} />}
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-sm font-medium truncate">
                    {type === 'at' ? `@${option.label}` : `/${option.label}`}
                  </span>
                  {option.type === 'file' && option.path && (
                    <span className={cn(
                      "text-xs truncate",
                      index === activeIndex ? "text-gray-500" : "text-gray-400"
                    )}>
                      {formatFilePath(option.path)}
                    </span>
                  )}
                  {option.description && (
                    <span className={cn(
                      "text-xs truncate",
                      index === activeIndex ? "text-gray-500" : "text-gray-400"
                    )}>
                      {option.description}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
            <span className="text-xs text-gray-400">
              {displayOptions.length} suggestion{displayOptions.length !== 1 ? 's' : ''}
            </span>
            <span className="text-xs text-gray-400">
              ↑↓ Navigate · Enter Select · Esc Close
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
