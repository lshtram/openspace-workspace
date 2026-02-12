import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePlayback } from './usePlayback';

describe('usePlayback', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initializes with default state', () => {
    const { result } = renderHook(() => usePlayback(5));
    expect(result.current.isPlaying).toBe(false);
    expect(result.current.currentSlide).toBe(0);
    expect(result.current.totalSlides).toBe(5);
  });

  it('navigates to next and previous slides', () => {
    const { result } = renderHook(() => usePlayback(3));
    
    act(() => {
      result.current.next();
    });
    expect(result.current.currentSlide).toBe(1);

    act(() => {
      result.current.next();
    });
    expect(result.current.currentSlide).toBe(2);

    act(() => {
      result.current.next(); // Wrap around
    });
    expect(result.current.currentSlide).toBe(0);

    act(() => {
      result.current.previous(); // Wrap around backwards
    });
    expect(result.current.currentSlide).toBe(2);
  });

  it('handles playback with interval', () => {
    const { result } = renderHook(() => usePlayback(3));
    
    act(() => {
      result.current.startPlayback(1000);
    });
    expect(result.current.isPlaying).toBe(true);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.currentSlide).toBe(1);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.currentSlide).toBe(2);

    act(() => {
      result.current.stopPlayback();
    });
    expect(result.current.isPlaying).toBe(false);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.currentSlide).toBe(2); // Should not change after stop
  });

  it('navigates to specific slide', () => {
    const { result } = renderHook(() => usePlayback(5));
    
    act(() => {
      result.current.goto(3);
    });
    expect(result.current.currentSlide).toBe(3);

    act(() => {
      result.current.goto(10); // Out of bounds
    });
    expect(result.current.currentSlide).toBe(3); // Should remain same
  });
});
