import { describe, expect, it } from 'vitest';
import { NARRATION_SUMMARY_THRESHOLD_CHARS, selectNarrationStrategy } from './voice-narration.js';

describe('voice narration strategy selection', () => {
  it('uses verbatim for short text content', () => {
    const strategy = selectNarrationStrategy({ kind: 'text', content: 'Short paragraph.' });
    expect(strategy).toBe('verbatim');
  });

  it('uses summary for long text content above threshold', () => {
    const longText = 'x'.repeat(NARRATION_SUMMARY_THRESHOLD_CHARS + 1);
    const strategy = selectNarrationStrategy({ kind: 'text', content: longText });
    expect(strategy).toBe('summary');
  });

  it('uses snippet descriptor for code by default', () => {
    const strategy = selectNarrationStrategy({
      kind: 'code',
      content: 'const x = 1;\nconst y = 2;',
    });

    expect(strategy).toBe('snippet_descriptor');
  });

  it('allows explicit verbatim request for code', () => {
    const strategy = selectNarrationStrategy({
      kind: 'code',
      content: 'const x = 1;',
      requestedStrategy: 'verbatim',
    });

    expect(strategy).toBe('verbatim');
  });

  it('always uses visual explainer for diagrams', () => {
    const strategy = selectNarrationStrategy({
      kind: 'diagram',
      content: 'flowchart LR; A-->B;',
      requestedStrategy: 'verbatim',
    });

    expect(strategy).toBe('visual_explainer');
  });

  it('uses concise summary for errors', () => {
    const strategy = selectNarrationStrategy({ kind: 'error', content: 'ENOENT: file missing at path design/x' });
    expect(strategy).toBe('summary');
  });

  it('applies explicit strategy override for text', () => {
    const strategy = selectNarrationStrategy({
      kind: 'text',
      content: 'hello',
      requestedStrategy: 'snippet_descriptor',
    });

    expect(strategy).toBe('snippet_descriptor');
  });

  it('rejects invalid requestedStrategy values', () => {
    expect(() =>
      selectNarrationStrategy({
        kind: 'text',
        content: 'hello',
        requestedStrategy: 'bogus' as unknown as 'summary',
      }),
    ).toThrow('requestedStrategy must be one of: summary, snippet_descriptor, visual_explainer, verbatim');
  });

  it('rejects empty content', () => {
    expect(() => selectNarrationStrategy({ kind: 'text', content: '   ' })).toThrow(
      'content must be a non-empty string',
    );
  });
});
