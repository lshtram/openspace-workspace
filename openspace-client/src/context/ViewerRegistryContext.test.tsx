import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ViewerRegistryProvider, useViewerRegistry } from './ViewerRegistryContext';
import React from 'react';

describe('ViewerRegistryContext', () => {
  /**
   * @verifies REQ-EDT-004
   */
  it('should register and retrieve viewers', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ViewerRegistryProvider>{children}</ViewerRegistryProvider>
    );
    const { result } = renderHook(() => useViewerRegistry(), { wrapper });

    const mockAdapter = {
      id: 'test-viewer',
      name: 'Test Viewer',
      extensions: ['test'],
      component: () => <div>Test</div>
    };

    act(() => {
      result.current.register(mockAdapter);
    });

    expect(result.current.listAdapters()).toContainEqual(mockAdapter);
    expect(result.current.getViewerForPath('file.test')).toEqual(mockAdapter);
    expect(result.current.getViewerForPath('file.other')).toBeNull();
  });
});
