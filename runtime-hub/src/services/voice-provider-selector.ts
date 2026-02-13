import { spawn } from 'node:child_process';

import {
  SttProviderAdapter,
  TtsProviderAdapter,
  type SttProviderId,
  type TtsProviderId,
  type SttTranscriptionRequest,
  type SttTranscriptionResult,
  type TtsSynthesisRequest,
  type TtsSynthesisResult,
} from '../interfaces/voice-providers.js';

// Lazy-loaded Kokoro TTS model
let kokoroModel: any = null;
let kokoroModelLoading = false;
let kokoroModelLoadError: Error | null = null;

async function getKokoroModel() {
  if (kokoroModel) {
    return kokoroModel;
  }
  
  if (kokoroModelLoadError) {
    throw kokoroModelLoadError;
  }
  
  if (kokoroModelLoading) {
    // Wait for existing load to complete
    while (kokoroModelLoading) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (kokoroModelLoadError) {
      throw kokoroModelLoadError;
    }
    return kokoroModel;
  }
  
  kokoroModelLoading = true;
  
  try {
    // Dynamic import of kokoro-js
    const { KokoroTTS } = await import('kokoro-js');
    
    // Load the model - using ONNX format for better performance
    kokoroModel = await KokoroTTS.from_pretrained(
      'onnx-community/Kokoro-82M-v1.0-ONNX',
      {
        dtype: 'q8', // Quantized for faster loading
        device: 'cpu',
      }
    );
    
    kokoroModelLoading = false;
    return kokoroModel;
  } catch (error) {
    kokoroModelLoadError = error as Error;
    kokoroModelLoading = false;
    throw error;
  }
}

interface AdapterAvailability {
  available?: boolean;
}

export interface CommandExecutionInput {
  commandPath: string;
  args: string[];
  input?: Buffer;
  timeoutMs: number;
}

export interface CommandExecutionResult {
  stdout: Buffer;
  stderr: Buffer;
  exitCode: number;
  signal?: NodeJS.Signals;
}

export type ProviderCommandExecutor = (input: CommandExecutionInput) => Promise<CommandExecutionResult>;

type VoiceProviderOperation = 'stt.transcribe' | 'tts.synthesize';

type VoiceProviderRuntimeCode =
  | 'VOICE_PROVIDER_NOT_CONFIGURED'
  | 'VOICE_PROVIDER_TIMEOUT'
  | 'VOICE_PROVIDER_EXEC_FAILED'
  | 'VOICE_PROVIDER_INVALID_RESPONSE';

interface VoiceProviderRuntimeErrorInput {
  code: VoiceProviderRuntimeCode;
  providerId: SttProviderId | TtsProviderId;
  operation: VoiceProviderOperation;
  location: string;
  reason: string;
  remediation: string;
  details?: Record<string, unknown>;
}

export class VoiceProviderRuntimeError extends Error {
  readonly code: VoiceProviderRuntimeCode;
  readonly providerId: SttProviderId | TtsProviderId;
  readonly operation: VoiceProviderOperation;
  readonly location: string;
  readonly remediation: string;
  readonly details: Record<string, unknown>;

  constructor(input: VoiceProviderRuntimeErrorInput) {
    super(input.reason);
    this.code = input.code;
    this.providerId = input.providerId;
    this.operation = input.operation;
    this.location = input.location;
    this.remediation = input.remediation;
    this.details = input.details ?? {};
  }
}

interface AdapterRuntimeOptions extends AdapterAvailability {
  commandPath?: string;
  timeoutMs?: number;
  execute?: ProviderCommandExecutor;
}

const DEFAULT_PROVIDER_TIMEOUT_MS = 15_000;

const hasTimeoutSignal = (reason: string): boolean => /timed out|timeout|etimedout/i.test(reason);

const executeProviderCommand: ProviderCommandExecutor = async (input) => {
  return new Promise<CommandExecutionResult>((resolve, reject) => {
    const process = spawn(input.commandPath, input.args, {
      stdio: 'pipe',
    });

    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];
    let timedOut = false;

    const timeoutHandle = setTimeout(() => {
      timedOut = true;
      process.kill('SIGKILL');
    }, input.timeoutMs);

    process.stdout.on('data', (chunk: Buffer | string) => {
      stdoutChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });

    process.stderr.on('data', (chunk: Buffer | string) => {
      stderrChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });

    process.once('error', (error) => {
      clearTimeout(timeoutHandle);
      reject(error);
    });

    process.once('close', (exitCode, signal) => {
      clearTimeout(timeoutHandle);
      if (timedOut) {
        reject(new Error(`command timed out after ${input.timeoutMs}ms`));
        return;
      }

      resolve({
        stdout: Buffer.concat(stdoutChunks),
        stderr: Buffer.concat(stderrChunks),
        exitCode: exitCode ?? 1,
        signal: signal ?? undefined,
      });
    });

    process.stdin.once('error', () => {
      // Process may exit before stdin flushes. This is safe to ignore.
    });

    if (input.input && input.input.length > 0) {
      process.stdin.write(input.input);
    }
    process.stdin.end();
  });
};

abstract class BaseAdapter {
  protected readonly available: boolean;
  private readonly commandPath?: string;
  private readonly timeoutMs: number;
  private readonly execute: ProviderCommandExecutor;

  constructor(options: AdapterRuntimeOptions = {}) {
    this.available = options.available ?? true;
    this.commandPath = options.commandPath?.trim();
    this.timeoutMs = options.timeoutMs ?? DEFAULT_PROVIDER_TIMEOUT_MS;
    this.execute = options.execute ?? executeProviderCommand;
  }

  isAvailable(): boolean {
    return this.available;
  }

  protected async runCommand(
    providerId: SttProviderId | TtsProviderId,
    operation: VoiceProviderOperation,
    args: string[],
    input?: Buffer,
  ): Promise<CommandExecutionResult> {
    if (!this.commandPath) {
      throw new VoiceProviderRuntimeError({
        code: 'VOICE_PROVIDER_NOT_CONFIGURED',
        providerId,
        operation,
        location: `voice.providers.${providerId}.commandPath`,
        reason: `${providerId} command path is not configured`,
        remediation: `Set a non-empty commandPath for ${providerId} adapter runtime wiring`,
      });
    }

    try {
      const result = await this.execute({
        commandPath: this.commandPath,
        args,
        input,
        timeoutMs: this.timeoutMs,
      });

      if (result.exitCode !== 0) {
        throw new VoiceProviderRuntimeError({
          code: 'VOICE_PROVIDER_EXEC_FAILED',
          providerId,
          operation,
          location: `voice.providers.${providerId}.command`,
          reason: `${providerId} command exited with code ${result.exitCode}`,
          remediation: `Verify ${providerId} runtime binary path, permissions, and model assets`,
          details: {
            exitCode: result.exitCode,
            signal: result.signal,
            stderr: result.stderr.toString('utf8').trim(),
          },
        });
      }

      return result;
    } catch (error) {
      if (error instanceof VoiceProviderRuntimeError) {
        throw error;
      }

      const reason = error instanceof Error ? error.message : String(error);
      if (hasTimeoutSignal(reason)) {
        throw new VoiceProviderRuntimeError({
          code: 'VOICE_PROVIDER_TIMEOUT',
          providerId,
          operation,
          location: `voice.providers.${providerId}.command`,
          reason: `${providerId} command timed out after ${this.timeoutMs}ms`,
          remediation: `Increase timeoutMs or reduce ${providerId} workload for this request`,
          details: {
            timeoutMs: this.timeoutMs,
          },
        });
      }

      throw new VoiceProviderRuntimeError({
        code: 'VOICE_PROVIDER_EXEC_FAILED',
        providerId,
        operation,
        location: `voice.providers.${providerId}.command`,
        reason,
        remediation: `Verify ${providerId} runtime binary path and executable access`,
      });
    }
  }

  protected failInvalidResponse(
    providerId: SttProviderId | TtsProviderId,
    operation: VoiceProviderOperation,
    reason: string,
  ): never {
    throw new VoiceProviderRuntimeError({
      code: 'VOICE_PROVIDER_INVALID_RESPONSE',
      providerId,
      operation,
      location: `voice.providers.${providerId}.command.stdout`,
      reason,
      remediation: `Ensure ${providerId} runtime emits expected output payload on stdout`,
    });
  }
}

export class WhisperCppSttAdapter extends BaseAdapter implements SttProviderAdapter {
  readonly kind = 'stt';
  readonly id = 'whisper.cpp';

  async transcribe(request: SttTranscriptionRequest): Promise<SttTranscriptionResult> {
    const output = await this.runCommand(this.id, 'stt.transcribe', ['--language', request.language], Buffer.from(request.audio));
    const text = output.stdout.toString('utf8').trim();
    if (text.length === 0) {
      this.failInvalidResponse(this.id, 'stt.transcribe', 'whisper.cpp returned empty transcription output');
    }

    return { text };
  }
}

export class FasterWhisperSttAdapter extends BaseAdapter implements SttProviderAdapter {
  readonly kind = 'stt';
  readonly id = 'faster-whisper';

  async transcribe(_request: SttTranscriptionRequest): Promise<SttTranscriptionResult> {
    throw new Error('faster-whisper adapter integration pending');
  }
}

export class BrowserNativeSttAdapter extends BaseAdapter implements SttProviderAdapter {
  readonly kind = 'stt';
  readonly id = 'browser-native';

  async transcribe(request: SttTranscriptionRequest): Promise<SttTranscriptionResult> {
    const text = new TextDecoder().decode(request.audio).trim();
    return {
      text: text.length > 0 ? text : '[audio] transcription unavailable',
    };
  }
}

export class KokoroTtsAdapter extends BaseAdapter implements TtsProviderAdapter {
  readonly kind = 'tts';
  readonly id = 'kokoro';
  private voice: string = 'af_sarah'; // Default voice

  async synthesize(request: TtsSynthesisRequest): Promise<TtsSynthesisResult> {
    try {
      const model = await getKokoroModel();
      
      // Generate speech - kokoro-js returns RawAudio
      const audio = await model.generate(request.text, {
        voice: this.voice,
      });
      
      // Convert RawAudio to Uint8Array
      let audioBytes: Uint8Array;
      
      if (audio && typeof audio === 'object') {
        // RawAudio has .data property which is the audio buffer
        const audioData = (audio as any).data;
        if (audioData instanceof Float32Array) {
          // Convert Float32 to Int16 PCM
          const int16Array = new Int16Array(audioData.length);
          for (let i = 0; i < audioData.length; i++) {
            int16Array[i] = Math.max(-1, Math.min(1, audioData[i])) * 32767;
          }
          audioBytes = new Uint8Array(int16Array.buffer);
        } else if (audioData instanceof Uint8Array) {
          audioBytes = audioData;
        } else if (ArrayBuffer.isView(audioData)) {
          audioBytes = new Uint8Array(audioData.buffer);
        } else {
          // Try to convert directly
          audioBytes = new Uint8Array(audioData);
        }
      } else {
        throw new Error('Invalid audio output from Kokoro');
      }
      
      return { audio: audioBytes };
    } catch (error) {
      console.error('[KokoroTtsAdapter] Synthesis failed:', error);
      throw new VoiceProviderRuntimeError({
        code: 'VOICE_PROVIDER_EXEC_FAILED',
        providerId: 'kokoro',
        operation: 'tts.synthesize',
        location: 'kokoro-js.synthesize',
        reason: `Kokoro TTS synthesis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        remediation: 'Ensure kokoro-js is installed and model can be downloaded',
      });
    }
  }
}

export class BrowserNativeTtsAdapter extends BaseAdapter implements TtsProviderAdapter {
  readonly kind = 'tts';
  readonly id = 'browser-native';

  async synthesize(request: TtsSynthesisRequest): Promise<TtsSynthesisResult> {
    return {
      audio: new TextEncoder().encode(request.text),
    };
  }
}

export interface VoiceProviderSelectionConfig {
  stt?: {
    enableFasterWhisper?: boolean;
    preferFasterWhisper?: boolean;
    allowBrowserFallback?: boolean;
  };
  tts?: {
    allowBrowserFallback?: boolean;
  };
}

export interface VoiceProviderAdapters {
  stt: {
    whisperCpp: SttProviderAdapter;
    fasterWhisper: SttProviderAdapter;
    browserNative: SttProviderAdapter;
  };
  tts: {
    kokoro: TtsProviderAdapter;
    browserNative: TtsProviderAdapter;
  };
}

export interface SelectVoiceProvidersInput {
  config?: VoiceProviderSelectionConfig;
  adapters: VoiceProviderAdapters;
}

export interface VoiceProviderSelection {
  stt: SttProviderAdapter;
  tts: TtsProviderAdapter;
}

export function selectVoiceProviders(input: SelectVoiceProvidersInput): VoiceProviderSelection {
  const stt = selectSttProvider(input.adapters, input.config);
  const tts = selectTtsProvider(input.adapters, input.config);
  return { stt, tts };
}

function selectSttProvider(adapters: VoiceProviderAdapters, config?: VoiceProviderSelectionConfig): SttProviderAdapter {
  const allowBrowserFallback = config?.stt?.allowBrowserFallback ?? true;
  const enableFasterWhisper = config?.stt?.enableFasterWhisper ?? false;
  const preferFasterWhisper = config?.stt?.preferFasterWhisper ?? false;

  const preferredChain: SttProviderAdapter[] = [];

  if (preferFasterWhisper && enableFasterWhisper) {
    preferredChain.push(adapters.stt.fasterWhisper, adapters.stt.whisperCpp);
  } else {
    preferredChain.push(adapters.stt.whisperCpp);
    if (enableFasterWhisper) {
      preferredChain.push(adapters.stt.fasterWhisper);
    }
  }

  for (const adapter of preferredChain) {
    if (adapter.isAvailable()) {
      return adapter;
    }
  }

  if (allowBrowserFallback && adapters.stt.browserNative.isAvailable()) {
    return adapters.stt.browserNative;
  }

  throw new Error('No available STT provider for current config');
}

function selectTtsProvider(adapters: VoiceProviderAdapters, config?: VoiceProviderSelectionConfig): TtsProviderAdapter {
  const allowBrowserFallback = config?.tts?.allowBrowserFallback ?? true;

  if (adapters.tts.kokoro.isAvailable()) {
    return adapters.tts.kokoro;
  }

  if (allowBrowserFallback && adapters.tts.browserNative.isAvailable()) {
    return adapters.tts.browserNative;
  }

  throw new Error('No available TTS provider for current config');
}
