import type { IModality, IModalityProcessor } from './IModality';
import type { VoiceMetadata } from './IVoiceInput';

/** Configuration for voice output hardware and synthesis */
export interface VoiceOutputConfig {
  voiceId?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  /** Hardware device ID for audio playback */
  deviceId?: string;
}

/** 
 * Priority for voice output. 
 * 'critical' can interrupt or "duck" lower priority output. 
 */
export type VoiceOutputPriority = 'low' | 'normal' | 'high' | 'critical';

/** Playback status of the voice output modality */
export type VoiceOutputStatus = 'idle' | 'speaking' | 'paused' | 'error';

/** Events emitted by the voice output modality */
export type VoiceOutputEvent = 'start' | 'end' | 'pause' | 'resume' | 'error' | 'progress';

export interface IVoiceOutput extends IModality {
  /** 
   * Speak content. If string, it will be synthesized. 
   * If ArrayBuffer, it will be played directly.
   */
  speak(
    content: string | ArrayBuffer, 
    options?: { priority?: VoiceOutputPriority; metadata?: VoiceMetadata }
  ): Promise<void>;
  
  /**
   * Enqueue a chunk of text or audio for continuous playback.
   */
  enqueue(chunk: string | ArrayBuffer, metadata?: VoiceMetadata): void;

  /** Interrupt current speech immediately */
  interrupt(): void;
  /** Pause the current speech */
  pause(): void;
  /** Resume from pause */
  resume(): void;
  
  /** Current operational status */
  getStatus(): VoiceOutputStatus;

  /** 
   * Registers a processor to transform output.
   */
  registerProcessor(processor: IModalityProcessor<string | ArrayBuffer, string | ArrayBuffer>): void;
}
