import type { IModality } from './IModality';

export interface ISessionInfo {
  id: string;
  title: string;
  createdAt: number;
  lastSavedAt: number;
  activeModalityIds: string[];
}

export interface ISessionState {
  info: ISessionInfo;
  modalityStates: Record<string, unknown>; // id -> serialized state
}

/**
 * The Session Manager is the "Orchestrator" of the OpenSpace Shell.
 * it manages the lifecycle and state persistence of all active modalities.
 */
export interface ISessionManager {
  /** Create a new OpenSpace session */
  createSession(title: string): Promise<string>;
  
  /** Load an existing session and hydrate all modalities */
  loadSession(id: string): Promise<void>;
  
  /** Trigger a global save of all modality states */
  saveCurrentSession(): Promise<void>;
  
  /** Register a modality instance with the manager */
  registerModality(modality: IModality): void;
  
  /** Unregister and dispose of a modality */
  unregisterModality(id: string): Promise<void>;
  
  /** Switch the primary active modality in the UI */
  focusModality(id: string): void;
  
  /** Broadcast an event to all registered modalities */
  broadcast(event: string, data: unknown): void;
  
  /** Get a list of all recent sessions */
  getRecentSessions(): Promise<ISessionInfo[]>;
}
