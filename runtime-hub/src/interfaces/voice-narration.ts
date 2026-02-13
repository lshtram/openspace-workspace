export const NARRATION_SUMMARY_THRESHOLD_CHARS = 600;
export const NARRATION_STRATEGIES = ['summary', 'snippet_descriptor', 'visual_explainer', 'verbatim'] as const;

export type NarrationSourceKind = 'text' | 'code' | 'diagram' | 'error';
export type NarrationStrategy = 'summary' | 'snippet_descriptor' | 'visual_explainer' | 'verbatim';

export interface NarrationStrategyInput {
  kind: NarrationSourceKind;
  content: string;
  requestedStrategy?: NarrationStrategy;
}

function assertNonEmptyString(value: unknown, fieldName: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${fieldName} must be a non-empty string`);
  }

  return value;
}

function assertNarrationStrategy(value: unknown, fieldName: string): NarrationStrategy {
  if (typeof value !== 'string' || !NARRATION_STRATEGIES.includes(value as NarrationStrategy)) {
    throw new Error(`${fieldName} must be one of: ${NARRATION_STRATEGIES.join(', ')}`);
  }

  return value as NarrationStrategy;
}

export function parseRequestedNarrationStrategy(value: unknown, fieldName = 'requestedStrategy'): NarrationStrategy | undefined {
  if (value === undefined) {
    return undefined;
  }

  return assertNarrationStrategy(value, fieldName);
}

export function selectNarrationStrategy(input: NarrationStrategyInput): NarrationStrategy {
  const content = assertNonEmptyString(input.content, 'content');

  if (input.kind === 'diagram') {
    return 'visual_explainer';
  }

  if (input.kind === 'code') {
    if (input.requestedStrategy === 'verbatim') {
      return 'verbatim';
    }

    return 'snippet_descriptor';
  }

  if (input.kind === 'error') {
    return 'summary';
  }

  if (input.requestedStrategy !== undefined) {
    return assertNarrationStrategy(input.requestedStrategy, 'requestedStrategy');
  }

  return content.length > NARRATION_SUMMARY_THRESHOLD_CHARS ? 'summary' : 'verbatim';
}
