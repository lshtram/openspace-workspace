import type { IModality, IModalityProcessor } from './IModality';

/** Emotional state metadata */
export interface EmotionState {
  label: string; // e.g., 'happy', 'frustrated', 'excited'
  score: number; // 0.0 to 1.0
}

/** Metadata enriched with emotional and contextual data */
export interface VoiceMetadata {
  emotions?: EmotionState[];
  prosody?: {
    pitch?: string;
    rate?: string;
    volume?: string;
  };
  sentiment?: 'positive' | 'negative' | 'neutral';
}

/** Configuration for voice input hardware and processing */
export interface VoiceInputConfig {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  /** Hardware constraints for recording */
  constraints?: {
    deviceId?: string;
    sampleRate?: number;
    echoCancellation?: boolean;
    noiseSuppression?: boolean;
  };
}

/** Status of the voice input modality */
export type VoiceInputStatus = 'idle' | 'listening' | 'processing' | 'error';

/** Result from a voice input recognition event */
export interface VoiceResult {
  transcript: string;
  isFinal: boolean;
  confidence: number;
  metadata?: VoiceMetadata;
}

/** Events emitted by the voice input modality */
export type VoiceInputEvent = 
  | 'start' 
  | 'stop' 
  | 'result' 
  | 'error' 
  | 'volumeChange' 
  | 'statusChange' 
  | 'audioData';

export interface IVoiceInputState {
  isListening: boolean;
  lastTranscript?: string;
}

export interface IVoiceInputCapabilities {
  streaming: boolean;
  emotionDetection: boolean;
  noiseSuppression: boolean;
}

export interface IVoiceInput extends IModality<IVoiceInputState, IVoiceInputCapabilities> {
  /** Start listening and potentially streaming audio */
  start(): Promise<void>;
  /** Stop listening and finalize transcript */
  stop(): Promise<string>;
  
  /** 
   * Low-latency interruption signal. 
   */
  interrupt(): void;

  /** Check if currently recording */
  isRecording(): boolean;
  /** Check if currently processing/transcribing audio */
  isProcessing(): boolean;
  /** Get current operational status */
  getStatus(): VoiceInputStatus;

  /** 
   * Registers a processor to transform input (e.g., noise reduction, emotion analysis).
   */
  registerProcessor(processor: IModalityProcessor<ArrayBuffer | VoiceResult, ArrayBuffer | VoiceResult>): void;
}
