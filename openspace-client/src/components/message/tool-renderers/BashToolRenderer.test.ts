import { describe, expect, it } from 'vitest';
import { stripAnsi } from './stripAnsi';

describe('stripAnsi', () => {
  it('throws when called without input', () => {
    const callWithoutArgs = stripAnsi as unknown as () => string;
    expect(() => callWithoutArgs()).toThrow('stripAnsi requires input');
  });

  it('removes CSI escape sequences from shell output', () => {
    const colored = '\u001b[31merror\u001b[0m\u001b[2K line';
    expect(stripAnsi(colored)).toBe('error line');
  });

  it('removes OSC string-terminated sequences', () => {
    const osc = '\u001b]0;Window title\u0007ready';
    expect(stripAnsi(osc)).toBe('ready');
  });

  it('coerces non-string input to string', () => {
    expect(stripAnsi(42)).toBe('42');
  });
});
