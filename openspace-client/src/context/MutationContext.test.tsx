import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { MutationProvider, useMutationStore } from './MutationContext';
import { FileTabsProvider, useFileTabs } from './FileTabsContext';
import React from 'react';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <FileTabsProvider>
    <MutationProvider>{children}</MutationProvider>
  </FileTabsProvider>
);

describe('MutationContext', () => {
  /**
   * @verifies REQ-EDT-012
   * @verifies REQ-EDT-014
   */
  it('should propose and resolve mutations', async () => {
    const { result } = renderHook(() => ({
      mutation: useMutationStore(),
      tabs: useFileTabs()
    }), { wrapper });

    const mutation = {
      id: 'm1',
      path: 'src/test.ts',
      content: 'new content'
    };

    act(() => {
      result.current.mutation.proposeMutation(mutation);
    });

    expect(result.current.mutation.pendingMutations).toContainEqual(mutation);

    await act(async () => {
      await result.current.mutation.resolveMutation('m1', 'apply-buffer');
    });

    expect(result.current.mutation.pendingMutations).toHaveLength(0);
  });
});
