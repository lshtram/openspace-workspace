import { describe, expect, it, vi } from 'vitest';

import {
  KokoroTtsAdapter,
  WhisperCppSttAdapter,
  type CommandExecutionResult,
  type ProviderCommandExecutor,
} from './voice-provider-selector.js';

describe('voice provider adapter runtime execution', () => {
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

  it('runs kokoro via configured command path and returns synthesized audio bytes', async () => {
    const execute: ProviderCommandExecutor = vi.fn(async (): Promise<CommandExecutionResult> => {
      return {
        stdout: Buffer.from([4, 5, 6]),
        stderr: Buffer.from(''),
        exitCode: 0,
      };
    });

    const adapter = new KokoroTtsAdapter({
      commandPath: '/mock/bin/kokoro',
      timeoutMs: 5_000,
      execute,
    });

    const result = await adapter.synthesize({
      text: 'hello world',
      language: 'en-US',
    });

    expect(Array.from(result.audio)).toEqual([4, 5, 6]);
    expect(execute).toHaveBeenCalledWith({
      commandPath: '/mock/bin/kokoro',
      args: ['--language', 'en-US'],
      input: Buffer.from('hello world', 'utf8'),
      timeoutMs: 5_000,
    });
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

  it('raises structured process failure when command exits with non-zero code', async () => {
    const execute: ProviderCommandExecutor = vi.fn(async (): Promise<CommandExecutionResult> => {
      return {
        stdout: Buffer.from(''),
        stderr: Buffer.from('failed to open model file'),
        exitCode: 2,
      };
    });

    const adapter = new KokoroTtsAdapter({
      commandPath: '/mock/bin/kokoro',
      execute,
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
      location: 'voice.providers.kokoro.command',
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
