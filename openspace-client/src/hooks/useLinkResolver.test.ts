import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useLinkResolver } from './useLinkResolver';
import { useNavigation } from './useNavigation';

vi.mock('./useNavigation', () => ({
  useNavigation: vi.fn()
}));

describe('useLinkResolver', () => {
  const mockOpenFileAt = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useNavigation as any).mockReturnValue({
      openFileAt: mockOpenFileAt
    });
  });

  /**
   * @verifies REQ-EDT-016
   */
  it('should resolve openspace links', () => {
    const { result } = renderHook(() => useLinkResolver());
    
    const handled = result.current.resolveLink('openspace://file/src/app.ts#L10-L20');
    
    expect(handled).toBe(true);
    expect(mockOpenFileAt).toHaveBeenCalledWith(
      'src/app.ts',
      expect.objectContaining({ startLine: 10, endLine: 20 }),
      expect.objectContaining({ source: 'agent-link' })
    );
  });

  /**
   * @verifies REQ-EDT-016
   */
  it('should ignore standard links', () => {
    const { result } = renderHook(() => useLinkResolver());
    
    const handled = result.current.resolveLink('https://google.com');
    
    expect(handled).toBe(false);
    expect(mockOpenFileAt).not.toHaveBeenCalled();
  });
});
