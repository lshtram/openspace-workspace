import { describe, expect, it } from 'vitest';
import { formatToolOutput } from './formatToolOutput';

describe('formatToolOutput', () => {
  it('throws when called without output', () => {
    const callWithoutArgs = formatToolOutput as unknown as () => string;
    expect(() => callWithoutArgs()).toThrow('formatToolOutput requires output');
  });

  it('returns empty string for nullish output', () => {
    expect(formatToolOutput(null)).toBe('');
    expect(formatToolOutput(undefined)).toBe('');
  });

  it('returns string output unchanged', () => {
    expect(formatToolOutput('plain text')).toBe('plain text');
  });

  it('formats objects as pretty JSON', () => {
    expect(formatToolOutput({ ok: true })).toBe(`{
  "ok": true
}`);
  });

  it('falls back to String output when JSON serialization fails', () => {
    const circular: { self?: unknown } = {};
    circular.self = circular;
    expect(formatToolOutput(circular)).toBe('[object Object]');
  });
});
