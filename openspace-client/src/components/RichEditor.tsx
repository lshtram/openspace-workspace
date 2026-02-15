import React, { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import { 
  createTextFragment, 
  getCursorPosition, 
  setCursorPosition, 
  createPill,
  setRangeEdge,
} from '../utils/editorDom';
import { 
  navigatePromptHistory, 
  prependHistoryEntry, 
  promptLength,
  type Prompt,
  type PromptPart
} from '../utils/history';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { AutocompletePopover, type SuggestionOption } from './AutocompletePopover';
import fuzzysort from 'fuzzysort';
import { createLogger } from '../lib/logger';

export type { Prompt, PromptPart };

const log = createLogger('RichEditor');

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface RichEditorProps {
  parts: Prompt;
  onChange: (parts: Prompt, cursorPosition: number) => void;
  onSubmit: (event?: React.FormEvent | React.KeyboardEvent) => void;
  placeholder?: string;
  className?: string;
  mode?: 'normal' | 'shell';
  onModeChange?: (mode: 'normal' | 'shell') => void;
  disabled?: boolean;
  fileSuggestions?: string[];
  agentSuggestions?: string[];
  commandSuggestions?: { name: string; description?: string }[];
}

export const RichEditor: React.FC<RichEditorProps> = ({
  parts,
  onChange,
  onSubmit,
  placeholder = 'Ask anything...',
  className,
  mode = 'normal',
  onModeChange,
  disabled = false,
  fileSuggestions = [],
  agentSuggestions = [],
  commandSuggestions = [],
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const mirrorRef = useRef({ input: false });
  const composingRef = useRef(false);

  // Popover State
  const [popover, setPopover] = useState<{
    type: 'at' | 'slash' | null;
    query: string;
    activeIndex: number;
  }>({ type: null, query: '', activeIndex: 0 });

  // History State
  const [history, setHistory] = useState<Prompt[]>(() => {
    const saved = localStorage.getItem(mode === 'shell' ? 'prompt-history-shell' : 'prompt-history');
    return saved ? JSON.parse(saved) : [];
  });
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [savedPrompt, setSavedPrompt] = useState<Prompt | null>(null);

  useEffect(() => {
    localStorage.setItem(mode === 'shell' ? 'prompt-history-shell' : 'prompt-history', JSON.stringify(history));
  }, [history, mode]);

  const isImeComposing = useCallback((event: React.KeyboardEvent) => {
    return event.nativeEvent.isComposing || composingRef.current;
  }, []);

  // Suggestions Filtering
  const filteredOptions = useMemo((): SuggestionOption[] => {
    if (!popover.type) return [];

    log.debug('Filtering suggestions:', { 
      popoverType: popover.type, 
      popoverQuery: popover.query,
      fileSuggestionsCount: fileSuggestions.length,
      agentSuggestionsCount: agentSuggestions.length,
      commandSuggestionsCount: commandSuggestions.length
    });

    if (popover.type === 'at') {
      const agents = agentSuggestions.map(name => ({
        id: `agent:${name}`,
        type: 'agent' as const,
        label: name,
        name
      }));
      const files = fileSuggestions.map(path => ({
        id: `file:${path}`,
        type: 'file' as const,
        label: path,
        path
      }));
      const combined = [...agents, ...files];
      
      log.debug('@ combined options:', combined.length);
      
      if (!popover.query) return combined.slice(0, 10);
      
      const results = fuzzysort.go(popover.query, combined, { key: 'label', limit: 10 });
      log.debug('@ filtered results:', results.length);
      return results.map(r => r.obj);
    }

    if (popover.type === 'slash') {
      const commands = commandSuggestions.map(cmd => ({
        id: `command:${cmd.name}`,
        type: 'command' as const,
        label: cmd.name,
        description: cmd.description
      }));
      
      log.debug('/ commands:', commands.length);
      
      if (!popover.query) return commands;
      
      const results = fuzzysort.go(popover.query, commands, { key: 'label', limit: 10 });
      log.debug('/ filtered results:', results.length);
      return results.map(r => r.obj);
    }

    return [];
  }, [popover.type, popover.query, agentSuggestions, fileSuggestions, commandSuggestions]);

  // Parsing logic: DOM -> Prompt
  const parseFromDOM = useCallback((): Prompt => {
    if (!editorRef.current) return [];
    
    const result: Prompt = [];
    let buffer = "";

    const flushText = () => {
      const content = buffer.replace(/\r\n?/g, "\n").replace(/\u200B/g, "");
      buffer = "";
      if (!content) return;
      result.push({ type: "text", content });
    };

    const pushFile = (file: HTMLElement) => {
      const content = file.textContent ?? "";
      result.push({
        type: "file",
        path: file.dataset.path!,
        content,
      });
    };

    const pushAgent = (agent: HTMLElement) => {
      const content = agent.textContent ?? "";
      result.push({
        type: "agent",
        name: agent.dataset.name!,
        content,
      });
    };

    const visit = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        buffer += node.textContent ?? "";
        return;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return;

      const el = node as HTMLElement;
      if (el.dataset.type === "file") {
        flushText();
        pushFile(el);
        return;
      }
      if (el.dataset.type === "agent") {
        flushText();
        pushAgent(el);
        return;
      }
      if (el.tagName === "BR") {
        buffer += "\n";
        return;
      }

      for (const child of Array.from(el.childNodes)) {
        visit(child);
      }
    };

    const children = Array.from(editorRef.current.childNodes);
    children.forEach((child, index) => {
      const isBlock = child.nodeType === Node.ELEMENT_NODE && ["DIV", "P"].includes((child as HTMLElement).tagName);
      visit(child);
      if (isBlock && index < children.length - 1) {
        buffer += "\n";
      }
    });

    flushText();
    return result;
  }, []);

  // Sync DOM with parts
  const renderEditor = useCallback((parts: Prompt) => {
    if (!editorRef.current) return;
    editorRef.current.innerHTML = "";
    for (const part of parts) {
      if (part.type === "text") {
        editorRef.current.appendChild(createTextFragment(part.content));
      } else if (part.type === "file" || part.type === "agent") {
        editorRef.current.appendChild(createPill(part.type, part.type === 'file' ? part.path : part.name));
      }
    }
  }, []);

  // Check if DOM and parts are in sync
  const isNormalizedEditor = useCallback(() => {
    if (!editorRef.current) return true;
    return Array.from(editorRef.current.childNodes).every((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent ?? "";
        if (!text.includes("\u200B")) return true;
        if (text !== "\u200B") return false;

        const prev = node.previousSibling;
        const next = node.nextSibling;
        const prevIsBr = prev?.nodeType === Node.ELEMENT_NODE && (prev as HTMLElement).tagName === "BR";
        const nextIsBr = next?.nodeType === Node.ELEMENT_NODE && (next as HTMLElement).tagName === "BR";
        if (!prevIsBr && !nextIsBr) return false;
        if (nextIsBr && !prevIsBr && prev) return false;
        return true;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return false;
      const el = node as HTMLElement;
      if (el.dataset.type === "file") return true;
      if (el.dataset.type === "agent") return true;
      return el.tagName === "BR";
    });
  }, []);

  // Effect to sync parts -> DOM
  useEffect(() => {
    if (!editorRef.current) return;

    // Skip if we just came from an input event and DOM is normalized
    if (mirrorRef.current.input) {
      mirrorRef.current.input = false;
      if (isNormalizedEditor()) return;
    }

    const currentDOMParts = parseFromDOM();
    const partsChanged = JSON.stringify(parts) !== JSON.stringify(currentDOMParts);
    
    if (partsChanged || !isNormalizedEditor()) {
      let cursorPosition: number | null = null;
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0 && editorRef.current.contains(selection.anchorNode)) {
        cursorPosition = getCursorPosition(editorRef.current);
      }

      renderEditor(parts);

      if (cursorPosition !== null) {
        setCursorPosition(editorRef.current, cursorPosition);
      }
    }
  }, [parts, renderEditor, parseFromDOM, isNormalizedEditor]);

  const handleInput = useCallback(() => {
    const rawParts = parseFromDOM();
    const cursorPosition = getCursorPosition(editorRef.current!);
    
    // Detect Popover Triggers
    const rawText = rawParts.map(p => ('content' in p ? p.content : '')).join('');
    const textBeforeCursor = rawText.substring(0, cursorPosition);
    const atMatch = textBeforeCursor.match(/@(\S*)$/);
    const slashMatch = textBeforeCursor.match(/\/(\S*)$/);

    log.debug('handleInput:', { 
      rawText, 
      cursorPosition, 
      textBeforeCursor, 
      atMatch, 
      slashMatch,
      mode,
      partsLength: parts.length 
    });

    // Detect Shell Mode Trigger
    if (mode === 'normal' && rawText === '!' && cursorPosition === 1) {
      log.debug('Detected ! in handleInput, switching to shell mode');
      onModeChange?.('shell');
      
      // Clear the editor - don't keep the ! character
      if (editorRef.current) {
        editorRef.current.innerHTML = '';
      }
      // Clear the state too
      const emptyParts: Prompt = [];
      onChange(emptyParts, 0);
      
      return; // Don't trigger popover for shell mode
    }

    if (atMatch && mode === 'normal') {
      setPopover({ type: 'at', query: atMatch[1], activeIndex: 0 });
      log.debug('Opening @ popover with query:', atMatch[1]);
    } else if (slashMatch && mode === 'normal') {
      setPopover({ type: 'slash', query: slashMatch[1], activeIndex: 0 });
      log.debug('Opening / popover with query:', slashMatch[1]);
    } else {
      setPopover(p => p.type ? { ...p, type: null } : p);
    }

    // Reset history navigation on manual input
    if (historyIndex >= 0) {
      setHistoryIndex(-1);
      setSavedPrompt(null);
    }

    mirrorRef.current.input = true;
    onChange(rawParts, cursorPosition);
  }, [parseFromDOM, mode, historyIndex, onChange, onModeChange, parts]);

  const insertOption = useCallback((option: SuggestionOption) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !editorRef.current) return;

    const cursorPosition = getCursorPosition(editorRef.current);
    const rawParts = parseFromDOM();
    const rawText = rawParts.map(p => ('content' in p ? p.content : '')).join('');
    const textBeforeCursor = rawText.substring(0, cursorPosition);
    
    const triggerRegex = popover.type === 'at' ? /@(\S*)$/ : /\/(\S*)$/;
    const match = textBeforeCursor.match(triggerRegex);

    if (match) {
      const triggerStart = match.index!;
      const range = selection.getRangeAt(0);
      
      setRangeEdge(editorRef.current, range, "start", triggerStart);
      setRangeEdge(editorRef.current, range, "end", cursorPosition);
      
      range.deleteContents();

      if (option.type === 'file' || option.type === 'agent') {
        const pill = createPill(option.type, option.type === 'file' ? option.path! : option.name!);
        const gap = document.createTextNode(" ");
        range.insertNode(gap);
        range.insertNode(pill);
        range.setStartAfter(gap);
        range.collapse(true);
      } else if (option.type === 'command') {
        const text = `/${option.label} `;
        const fragment = createTextFragment(text);
        range.insertNode(fragment);
        range.collapse(false);
      }

      selection.removeAllRanges();
      selection.addRange(range);
      
      setPopover({ type: null, query: '', activeIndex: 0 });
      
      const updatedParts = parseFromDOM();
      const updatedCursor = getCursorPosition(editorRef.current);
      mirrorRef.current.input = true;
      onChange(updatedParts, updatedCursor);
    }
  }, [popover.type, parseFromDOM, onChange]);

  const applyHistoryPrompt = useCallback((p: Prompt, position: "start" | "end") => {
    const length = position === "start" ? 0 : promptLength(p);
    onChange(p, length);
    requestAnimationFrame(() => {
      if (editorRef.current) {
        editorRef.current.focus();
        setCursorPosition(editorRef.current, length);
      }
    });
  }, [onChange]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;

    // Popover Keyboard Navigation
    if (popover.type && filteredOptions.length > 0) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setPopover(p => ({ ...p, activeIndex: (p.activeIndex + 1) % filteredOptions.length }));
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setPopover(p => ({ ...p, activeIndex: (p.activeIndex - 1 + filteredOptions.length) % filteredOptions.length }));
        return;
      }
      if (event.key === "Enter" || event.key === "Tab") {
        event.preventDefault();
        insertOption(filteredOptions[popover.activeIndex]);
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        setPopover({ type: null, query: '', activeIndex: 0 });
        return;
      }
    }

    // Shell Mode Trigger
    if (event.key === "!" && mode === "normal") {
      const cursorPosition = getCursorPosition(editorRef.current!);
      const rawParts = parseFromDOM();
      const rawText = rawParts.map(p => ('content' in p ? p.content : '')).join('');
      const textBeforeCursor = rawText.substring(0, cursorPosition);
       
      log.debug('Shell trigger:', { cursorPosition, rawText, textBeforeCursor });
       
      // Check if at start OR if text before cursor is just !
      if ((cursorPosition === 0 && parts.length === 0) || textBeforeCursor === '!') {
        log.debug('Switching to shell mode');
        onModeChange?.('shell');
        // Clear the editor - shell mode starts fresh
        if (editorRef.current) {
          editorRef.current.innerHTML = '';
        }
        // Clear the state
        const emptyParts: Prompt = [];
        onChange(emptyParts, 0);
        event.preventDefault();
        return;
      }
    }

    if (mode === "shell") {
      if (event.key === "Escape") {
        log.debug('Exiting shell mode');
        onModeChange?.('normal');
        // Clear the editor when exiting shell mode
        if (editorRef.current) {
          editorRef.current.innerHTML = '';
        }
        // Also clear the parent component state
        const emptyParts: Prompt = [];
        onChange(emptyParts, 0);
        event.preventDefault();
        return;
      }
      if (event.key === "Backspace") {
        const cursorPosition = getCursorPosition(editorRef.current!);
        if (cursorPosition === 0 && promptLength(parts) === 0) {
          log.debug('Exiting shell mode via backspace');
          onModeChange?.('normal');
          event.preventDefault();
          return;
        }
      }
    }

    // History Navigation
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      
      const cursorPosition = getCursorPosition(editorRef.current!);
      const totalLength = promptLength(parts);
      const textContent = parts.map(p => ('content' in p ? p.content : '')).join('');
      const hasNewlines = textContent.includes('\n');
      
      const atStart = cursorPosition === 0;
      const atEnd = cursorPosition === totalLength;
      
      log.debug('History nav:', { 
        event: event.key, 
        cursorPosition, 
        totalLength, 
        atStart, 
        atEnd, 
        hasNewlines,
        historyLength: history.length,
        historyIndex 
      });
      
      if (event.key === "ArrowUp" && (atStart || !hasNewlines)) {
        const result = navigatePromptHistory({
          direction: 'up',
          entries: history,
          historyIndex,
          currentPrompt: parts,
          savedPrompt,
        });
        if (result.handled) {
          setHistoryIndex(result.historyIndex);
          setSavedPrompt(result.savedPrompt);
          applyHistoryPrompt(result.prompt, result.cursor);
          event.preventDefault();
          return;
        }
      }

      if (event.key === "ArrowDown" && (atEnd || !hasNewlines)) {
        const result = navigatePromptHistory({
          direction: 'down',
          entries: history,
          historyIndex,
          currentPrompt: parts,
          savedPrompt,
        });
        if (result.handled) {
          setHistoryIndex(result.historyIndex);
          setSavedPrompt(result.savedPrompt);
          applyHistoryPrompt(result.prompt, result.cursor);
          event.preventDefault();
          return;
        }
      }
    }

    if (event.key === "Enter") {
      if (event.shiftKey) {
        return;
      } else {
        if (isImeComposing(event)) return;
        event.preventDefault();
        
        // Add to history on submit
        setHistory(prev => prependHistoryEntry(prev, parts));
        setHistoryIndex(-1);
        setSavedPrompt(null);
        
        onSubmit(event);
      }
    }

    if (event.key === "Backspace") {
      const selection = window.getSelection();
      if (selection && selection.isCollapsed) {
        const node = selection.anchorNode;
        const offset = selection.anchorOffset;
        if (node && node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent ?? "";
          if (/^\u200B+$/.test(text) && offset > 0) {
            const range = document.createRange();
            range.setStart(node, 0);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
          }
        }
      }
    }
  };

  const handlePaste = (event: React.ClipboardEvent) => {
    event.preventDefault();
    const text = event.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
    handleInput();
  };

  log.debug('Popover render:', { 
    isOpen: popover.type !== null, 
    type: popover.type, 
    query: popover.query,
    optionsCount: filteredOptions.length,
    activeIndex: popover.activeIndex 
  });

  return (
    <div className={cn("relative w-full flex flex-col", className)}>
      <AutocompletePopover
        isOpen={popover.type !== null}
        type={popover.type}
        query={popover.query}
        options={filteredOptions}
        activeIndex={popover.activeIndex}
        onSelect={insertOption}
        onMouseEnter={(index) => setPopover(p => ({ ...p, activeIndex: index }))}
        onClose={() => setPopover({ type: null, query: '', activeIndex: 0 })}
      />
      <div
        ref={editorRef}
        className={cn(
          "w-full p-3 min-h-[44px] max-h-[240px] overflow-y-auto",
          "text-14-regular text-text-strong focus:outline-none whitespace-pre-wrap select-text",
          "empty:before:content-[attr(aria-label)] empty:before:text-text-weak empty:before:pointer-events-none",
          mode === 'shell' && "font-mono",
          disabled && "opacity-50 cursor-not-allowed",
          "[&_[data-type=file]]:text-syntax-property [&_[data-type=file]]:font-medium",
          "[&_[data-type=agent]]:text-syntax-type [&_[data-type=agent]]:font-medium"
        )}
        contentEditable={!disabled}
        role="textbox"
        tabIndex={disabled ? -1 : 0}
        aria-multiline="true"
        aria-label={placeholder}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onCompositionStart={() => { composingRef.current = true; }}
        onCompositionEnd={() => { composingRef.current = false; }}
        suppressContentEditableWarning={true}
      />
    </div>
  );
};
