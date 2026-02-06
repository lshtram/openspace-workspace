import type { IModality } from './IModality';

/**
 * Represents a single slide within a presentation.
 */
export interface ISlide {
  /** Unique identifier for the slide */
  readonly id: string;
  /** Position in the deck (0-indexed) */
  readonly index: number;
  /** Title of the slide, often extracted from the first header */
  readonly title?: string;
  /** Raw markdown content of the slide */
  readonly content: string;
  /** Speaker notes, usually extracted from 'note:' or similar blocks */
  readonly notes?: string;
  /** YAML-parsed metadata for the specific slide */
  readonly metadata?: Record<string, unknown>;
  /** IDs of requirements linked to this specific slide */
  readonly linkedRequirementIds?: string[];
}

/**
 * Current state of the presentation modality.
 */
export interface IPresentationState {
  /** Index of the currently active slide */
  currentSlideIndex: number;
  /** Total number of slides in the deck */
  totalSlides: number;
  /** Whether the presentation is in auto-advance mode */
  isAutoPlaying: boolean;
  /** Visibility of the annotation overlay */
  showAnnotations: boolean;
  /** Current slide progress (for fragmented slides, 0 to N) */
  currentFragment: number;
}

/**
 * Functional capabilities of the presentation renderer.
 */
export interface IPresentationCapabilities {
  /** Supports direct editing of slide content */
  canEdit: boolean;
  /** Supports drawing/redlining on slides */
  canAnnotate: boolean;
  /** Supports exporting to other formats */
  canExport: boolean;
  /** List of supported input formats (e.g. ['markdown', 'yaml']) */
  supportedInputFormats: string[];
}

/**
 * IPresentation defines the modality for rendering and interacting with
 * stateful slide decks projected from markdown/YAML artifacts.
 */
export interface IPresentation extends IModality<IPresentationState, IPresentationCapabilities> {
  // --- Navigation & Control ---

  /** Advance to the next slide or fragment */
  next(): Promise<void>;
  /** Return to the previous slide or fragment */
  previous(): Promise<void>;
  /** Jump to a specific slide by index, ID, or title */
  goto(target: number | string): Promise<void>;

  // --- Content Management ---

  /** Load a presentation from a raw markdown/YAML artifact */
  load(source: string): Promise<void>;
  /** Get all slides in the current deck */
  getSlides(): ISlide[];
  /** Get the currently active slide */
  getCurrentSlide(): ISlide;
  /** Update the content of a specific slide in-place */
  updateSlide(index: number, patch: Partial<ISlide>): Promise<void>;

  // --- Requirement Linking ---

  /** Link specific requirements to the current presentation or specific slides */
  linkRequirements(requirementIds: string[], slideIndex?: number): Promise<void>;
  /** Retrieve IDs of requirements linked to a slide or the whole deck */
  getLinkedRequirements(slideIndex?: number): string[];

  // --- Active Modality & Annotations ---

  /** Toggle the live annotation layer (redlining) */
  setAnnotationMode(enabled: boolean): void;
  /** Clear all live annotations from the current slide */
  clearAnnotations(): void;
  /** Export the presentation as a standalone artifact */
  export(format: 'pdf' | 'html' | 'markdown'): Promise<Blob>;

  // --- Playback ---

  /** Start automated playback with a fixed interval per slide */
  startPlayback(intervalMs: number): void;
  /** Stop automated playback */
  stopPlayback(): void;
}
