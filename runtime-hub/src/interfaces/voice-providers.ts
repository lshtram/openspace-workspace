export type SttProviderId = 'whisper.cpp' | 'faster-whisper' | 'browser-native';
export type TtsProviderId = 'kokoro' | 'browser-native';

export interface SttTranscriptionRequest {
  audio: Uint8Array;
  language: string;
}

export interface SttTranscriptionResult {
  text: string;
}

export interface TtsSynthesisRequest {
  text: string;
  language: string;
}

export interface TtsSynthesisResult {
  audio: Uint8Array;
}

export interface SttProviderAdapter {
  readonly kind: 'stt';
  readonly id: SttProviderId;
  isAvailable(): boolean;
  transcribe(request: SttTranscriptionRequest): Promise<SttTranscriptionResult>;
}

export interface TtsProviderAdapter {
  readonly kind: 'tts';
  readonly id: TtsProviderId;
  isAvailable(): boolean;
  synthesize(request: TtsSynthesisRequest): Promise<TtsSynthesisResult>;
}
