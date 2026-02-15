import { describe, expect, it, vi, beforeEach } from 'vitest';

import {
  KokoroTtsAdapter,
  WhisperCppSttAdapter,
  type CommandExecutionResult,
  type ProviderCommandExecutor,
} from './voice-provider-selector.js';

// Mock kokoro-js module with a mock factory that can be changed per test
const mockGenerate = vi.fn();
vi.mock('kokoro-js', () => ({
  KokoroTTS: {
    from_pretrained: vi.fn().mockImplementation(() => ({
      generate: mockGenerate,
    })),
  },
}));

describe('voice provider adapter runtime execution', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the mock generate function to succeed by default
    mockGenerate.mockResolvedValue({
      data: new Float32Array([0.1, 0.2, 0.3]),
    });
  });
  it('runs whisper.cpp via configured command path and returns transcription text', async () => {
    const execute: ProviderCommandExecutor = vi.fn(async (): Promise<CommandExecutionResult> => {
      return {
        stdout: Buffer.from('hello from whisper'),
        stderr: Buffer.from(''),
        exitCode: 0,
      };
    });

    const adapter = new WhisperCppSttAdapter({
      commandPath: '/mock/bin/whisper-cpp',
      timeoutMs: 2_000,
      execute,
    });

    const result = await adapter.transcribe({
      audio: new Uint8Array([1, 2, 3]),
      language: 'en-US',
    });

    expect(result.text).toBe('hello from whisper');
    expect(execute).toHaveBeenCalledWith({
      commandPath: '/mock/bin/whisper-cpp',
      args: ['--language', 'en-US'],
      input: Buffer.from([1, 2, 3]),
      timeoutMs: 2_000,
    });
  });

  it('runs kokoro via kokoro-js library and returns synthesized audio bytes', async () => {
    const adapter = new KokoroTtsAdapter({
      available: true,
    });

    const result = await adapter.synthesize({
      text: 'hello world',
      language: 'en-US',
    });

    // The audio should be a Uint8Array (converted from Float32Array)
    expect(result.audio).toBeInstanceOf(Uint8Array);
    expect(result.audio.length).toBeGreaterThan(0);
  });

  it('raises structured timeout error when execution exceeds timeout', async () => {
    const execute: ProviderCommandExecutor = vi.fn(async () => {
      throw new Error('command timed out after 1000ms');
    });

    const adapter = new WhisperCppSttAdapter({
      commandPath: '/mock/bin/whisper-cpp',
      timeoutMs: 1_000,
      execute,
    });

    await expect(
      adapter.transcribe({
        audio: new Uint8Array([9, 9]),
        language: 'en-US',
      }),
    ).rejects.toMatchObject({
      code: 'VOICE_PROVIDER_TIMEOUT',
      providerId: 'whisper.cpp',
      operation: 'stt.transcribe',
      location: 'voice.providers.whisper.cpp.command',
    });
  });

  it('raises structured error when kokoro-js synthesis fails', async () => {
    // Set the mock to reject for this test
    mockGenerate.mockRejectedValueOnce(new Error('Synthesis failed'));

    const adapter = new KokoroTtsAdapter({
      available: true,
    });

    await expect(
      adapter.synthesize({
        text: 'test',
        language: 'en-US',
      }),
    ).rejects.toMatchObject({
      code: 'VOICE_PROVIDER_EXEC_FAILED',
      providerId: 'kokoro',
      operation: 'tts.synthesize',
    });
  });

  it('raises structured not-configured error when command path is missing', async () => {
    const adapter = new WhisperCppSttAdapter({
      commandPath: '',
      execute: vi.fn(),
    });

    await expect(
      adapter.transcribe({
        audio: new Uint8Array([1]),
        language: 'en-US',
      }),
    ).rejects.toMatchObject({
      code: 'VOICE_PROVIDER_NOT_CONFIGURED',
      providerId: 'whisper.cpp',
      operation: 'stt.transcribe',
      location: 'voice.providers.whisper.cpp.commandPath',
    });
  });
});
