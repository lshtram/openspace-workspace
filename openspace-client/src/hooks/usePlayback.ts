import { useState, useCallback, useRef, useEffect } from 'react';

export interface UsePlaybackResult {
  isPlaying: boolean;
  currentSlide: number;
  totalSlides: number;
  startPlayback: (intervalMs: number) => void;
  stopPlayback: () => void;
  next: () => void;
  previous: () => void;
  goto: (slideIndex: number) => void;
}

export function usePlayback(totalSlides: number): UsePlaybackResult {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const intervalRef = useRef<number | null>(null);

  const next = useCallback(() => {
    setCurrentSlide(prev => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const previous = useCallback(() => {
    setCurrentSlide(prev => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  const goto = useCallback((slideIndex: number) => {
    if (slideIndex >= 0 && slideIndex < totalSlides) {
      setCurrentSlide(slideIndex);
    }
  }, [totalSlides]);

  const startPlayback = useCallback((intervalMs: number) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setIsPlaying(true);
    intervalRef.current = setInterval(next, intervalMs);
  }, [next]);

  const stopPlayback = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    isPlaying,
    currentSlide,
    totalSlides,
    startPlayback,
    stopPlayback,
    next,
    previous,
    goto,
  };
}