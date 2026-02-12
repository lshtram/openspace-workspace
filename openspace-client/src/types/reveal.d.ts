declare module 'reveal.js' {
  interface RevealOptions {
    embedded?: boolean;
    keyboardCondition?: string;
    // Add other options as needed
  }

  class Api {
    initialize(): void;
    destroy(): void;
    slide(index: number): void;
    getCurrentSlide(): { h: number; v: number };
    // Add other methods as needed
  }

  interface RevealStatic {
    new (element: HTMLElement, options?: RevealOptions): Api;
  }

  const Reveal: RevealStatic;
  export = Reveal;
}