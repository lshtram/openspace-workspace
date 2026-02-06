export interface ModalityConfig {
  /** The OpenCode client instance */
  client: unknown;
  /** Initial state if resuming a session */
  initialState?: unknown;
  /** Custom settings for the specific implementation */
  settings?: Record<string, unknown>;
  /** Initial set of requirements linked to this modality instance for traceability */
  linkedRequirementIds?: string[];
}

/**
 * Modality Middleware / Process Blocks.
 * Processors are themselves modalities, ensuring they have a lifecycle
 * and can be managed/persisted.
 */
export interface IModalityProcessor<TIn = unknown, TOut = unknown> extends IModality {
  /** The core transformation logic */
  process(data: TIn, metadata?: unknown): Promise<{ data: TOut; metadata?: unknown }>;
}

export interface IModality<TState = unknown, TCapabilities = unknown> {
  /** Unique identifier for the modality instance */
  readonly id: string;
  /** The category of the modality (e.g., 'voice', 'whiteboard', 'terminal') */
  readonly type: string;
  /** Human-readable name for the modality */
  readonly name: string;

  /** Initialize the modality with configuration and dependencies */
  initialize(config: ModalityConfig): Promise<void>;
  /** Mount the modality to a UI element (if visual) */
  mount?(container: HTMLElement): void;
  /** Cleanup resources and connections */
  dispose(): Promise<void>;

  /** 
   * Consume data from another modality or orchestrator.
   * Standard event for producing data is 'data'.
   */
  receive?(data: unknown, metadata?: unknown): Promise<void>;

  /** Get the current memento state for persistence */
  getState(): TState;
  /** Restore state from a previously saved memento */
  setState(state: TState): Promise<void>;
  /** Query what this specific implementation can do */
  getCapabilities(): TCapabilities;

  /** 
   * Register a processor to transform data flowing through this modality.
   * Enables the chaining of "Process Blocks" (summarizers, emotion enrichers, etc.).
   */
  registerProcessor?(processor: IModalityProcessor<unknown, unknown>): void;

  /** 
   * Link specific requirements to this modality instance.
   * Ensures traceability from artifacts back to functional requirements.
   */
  linkRequirement?(requirementId: string): void;
  getLinkedRequirements?(): string[];

  /** Event subscription */
  on(event: string, callback: (data: unknown) => void): void;
  /** Event unsubscription */
  off(event: string, callback: (data: unknown) => void): void;
}
