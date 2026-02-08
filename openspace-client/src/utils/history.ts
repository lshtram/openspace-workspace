export type PromptPart =
  | { type: 'text'; content: string }
  | { type: 'file'; path: string; content: string }
  | { type: 'agent'; name: string; content: string }
  | { type: 'image'; id: string; mime: string; dataUrl: string; filename: string };

export type Prompt = PromptPart[];

export const MAX_HISTORY = 100;

export function clonePromptParts(prompt: Prompt): Prompt {
  return prompt.map((part) => ({ ...part })) as Prompt;
}

export function promptLength(prompt: Prompt): number {
  return prompt.reduce((len, part) => len + ('content' in part ? part.content.length : 0), 0);
}

export function isPromptEqual(promptA: Prompt, promptB: Prompt): boolean {
  if (promptA.length !== promptB.length) return false;
  for (let i = 0; i < promptA.length; i++) {
    const partA = promptA[i];
    const partB = promptB[i];
    if (partA.type !== partB.type) return false;
    if (partA.type === 'text' && partA.content !== (partB as { type: 'text'; content: string }).content) return false;
    if (partA.type === 'file' && partA.path !== (partB as { type: 'file'; path: string }).path) return false;
    if (partA.type === 'agent' && partA.name !== (partB as { type: 'agent'; name: string }).name) return false;
    if (partA.type === 'image' && partA.id !== (partB as { type: 'image'; id: string }).id) return false;
  }
  return true;
}

export function prependHistoryEntry(entries: Prompt[], prompt: Prompt, max = MAX_HISTORY): Prompt[] {
  const text = prompt
    .map((part) => ('content' in part ? part.content : ""))
    .join("")
    .trim();
  const hasImages = prompt.some((part) => part.type === "image");
  if (!text && !hasImages) return entries;

  const entry = clonePromptParts(prompt);
  const last = entries[0];
  if (last && isPromptEqual(last, entry)) return entries;
  return [entry, ...entries].slice(0, max);
}

export type HistoryNavInput = {
  direction: "up" | "down";
  entries: Prompt[];
  historyIndex: number;
  currentPrompt: Prompt;
  savedPrompt: Prompt | null;
};

export type HistoryNavResult =
  | { handled: false; historyIndex: number; savedPrompt: Prompt | null }
  | { handled: true; historyIndex: number; savedPrompt: Prompt | null; prompt: Prompt; cursor: "start" | "end" };

export function navigatePromptHistory(input: HistoryNavInput): HistoryNavResult {
  if (input.direction === "up") {
    if (input.entries.length === 0) {
      return { handled: false, historyIndex: input.historyIndex, savedPrompt: input.savedPrompt };
    }

    if (input.historyIndex === -1) {
      return {
        handled: true,
        historyIndex: 0,
        savedPrompt: clonePromptParts(input.currentPrompt),
        prompt: input.entries[0],
        cursor: "start",
      };
    }

    if (input.historyIndex < input.entries.length - 1) {
      const next = input.historyIndex + 1;
      return {
        handled: true,
        historyIndex: next,
        savedPrompt: input.savedPrompt,
        prompt: input.entries[next],
        cursor: "start",
      };
    }

    return { handled: false, historyIndex: input.historyIndex, savedPrompt: input.savedPrompt };
  }

  if (input.historyIndex > 0) {
    const next = input.historyIndex - 1;
    return {
      handled: true,
      historyIndex: next,
      savedPrompt: input.savedPrompt,
      prompt: input.entries[next],
      cursor: "end",
    };
  }

  if (input.historyIndex === 0) {
    if (input.savedPrompt) {
      return {
        handled: true,
        historyIndex: -1,
        savedPrompt: null,
        prompt: input.savedPrompt,
        cursor: "end",
      };
    }

    return {
      handled: true,
      historyIndex: -1,
      savedPrompt: null,
      prompt: [{ type: 'text', content: '' }],
      cursor: "end",
    };
  }

  return { handled: false, historyIndex: input.historyIndex, savedPrompt: input.savedPrompt };
}

/**
 * Parses a string into prompt parts, detecting @mentions for files and agents.
 */
export function parseStringToParts(
  text: string,
  fileSuggestions: string[] = [],
  agentSuggestions: string[] = []
): Prompt {
  if (!text) return [];

  const result: Prompt = [];
  
  // Create a combined list of mentions to look for
  // We sort by length descending to match longer paths first (e.g., @src/utils/foo vs @src)
  const allMentions = [
    ...fileSuggestions.map(path => ({ type: 'file' as const, value: path, trigger: `@${path}` })),
    ...agentSuggestions.map(name => ({ type: 'agent' as const, value: name, trigger: `@${name}` }))
  ].sort((a, b) => b.trigger.length - a.trigger.length);

  // If no suggestions provided, we just return the text as-is
  if (allMentions.length === 0) {
    return [{ type: 'text', content: text }];
  }

  let remaining = text;

  while (remaining.length > 0) {
    let found = false;
    
    // Check if the current position starts with a mention
    for (const mention of allMentions) {
      if (remaining.startsWith(mention.trigger)) {
        // Found a mention!
        result.push(
          mention.type === 'file' 
            ? { type: 'file', path: mention.value, content: mention.trigger }
            : { type: 'agent', name: mention.value, content: mention.trigger }
        );
        remaining = remaining.substring(mention.trigger.length);
        found = true;
        break;
      }
    }

    if (!found) {
      // Not a mention, take the first character and add to a text buffer
      const char = remaining.charAt(0);
      const lastPart = result[result.length - 1];
      if (lastPart && lastPart.type === 'text') {
        lastPart.content += char;
      } else {
        result.push({ type: 'text', content: char });
      }
      remaining = remaining.substring(1);
    }
  }

  return result;
}
