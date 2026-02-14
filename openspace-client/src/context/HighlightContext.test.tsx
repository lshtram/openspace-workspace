import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { HighlightProvider, useHighlight } from './HighlightContext';
import React from 'react';

describe('HighlightContext', () => {
  /**
   * @verifies REQ-EDT-008
   */
  it('should apply and clear highlights', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <HighlightProvider>{children}</HighlightProvider>
    );
    const { result } = renderHook(() => useHighlight(), { wrapper });

    const range = {
      id: 'test-h',
      path: 'src/main.ts',
      startLine: 1,
      actor: 'agent' as const,
      reason: 'explanation' as const
    };

    act(() => {
      result.current.applyHighlight(range);
    });

    expect(result.current.highlights).toContainEqual(range);

    act(() => {
      result.current.clearHighlight('test-h');
    });

    expect(result.current.highlights).not.toContainEqual(range);
  });

  /**
   * @verifies REQ-EDT-010
   */
  it('should clear all agent highlights', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <HighlightProvider>{children}</HighlightProvider>
    );
    const { result } = renderHook(() => useHighlight(), { wrapper });

    act(() => {
      result.current.applyHighlight({
        id: 'h1',
        path: 'f1',
        startLine: 1,
        actor: 'agent',
        reason: 'explanation'
      });
      result.current.applyHighlight({
        id: 'h2',
        path: 'f2',
        startLine: 2,
        actor: 'system',
        reason: 'diff-handoff'
      });
    });

    act(() => {
      result.current.clearAllAgentHighlights();
    });

    expect(result.current.highlights.map((h) => h.id)).toEqual(['h2']);
  });
});
