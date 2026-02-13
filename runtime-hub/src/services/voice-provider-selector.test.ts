import { describe, expect, it } from 'vitest';

import {
  BrowserNativeSttAdapter,
  BrowserNativeTtsAdapter,
  FasterWhisperSttAdapter,
  KokoroTtsAdapter,
  WhisperCppSttAdapter,
  selectVoiceProviders,
} from './voice-provider-selector.js';

describe('voice provider selection', () => {
  it('selects whisper.cpp and kokoro by default', () => {
    const selection = selectVoiceProviders({
      adapters: {
        stt: {
          whisperCpp: new WhisperCppSttAdapter({ available: true }),
          fasterWhisper: new FasterWhisperSttAdapter({ available: true }),
          browserNative: new BrowserNativeSttAdapter({ available: true }),
        },
        tts: {
          kokoro: new KokoroTtsAdapter({ available: true }),
          browserNative: new BrowserNativeTtsAdapter({ available: true }),
        },
      },
    });

    expect(selection.stt.id).toBe('whisper.cpp');
    expect(selection.tts.id).toBe('kokoro');
  });

  it('switches to faster-whisper when explicitly enabled and preferred', () => {
    const selection = selectVoiceProviders({
      config: {
        stt: {
          enableFasterWhisper: true,
          preferFasterWhisper: true,
          allowBrowserFallback: true,
        },
      },
      adapters: {
        stt: {
          whisperCpp: new WhisperCppSttAdapter({ available: true }),
          fasterWhisper: new FasterWhisperSttAdapter({ available: true }),
          browserNative: new BrowserNativeSttAdapter({ available: true }),
        },
        tts: {
          kokoro: new KokoroTtsAdapter({ available: true }),
          browserNative: new BrowserNativeTtsAdapter({ available: true }),
        },
      },
    });

    expect(selection.stt.id).toBe('faster-whisper');
  });

  it('falls back to browser/native providers when local engines are unavailable and fallback is allowed', () => {
    const selection = selectVoiceProviders({
      config: {
        stt: {
          allowBrowserFallback: true,
        },
        tts: {
          allowBrowserFallback: true,
        },
      },
      adapters: {
        stt: {
          whisperCpp: new WhisperCppSttAdapter({ available: false }),
          fasterWhisper: new FasterWhisperSttAdapter({ available: false }),
          browserNative: new BrowserNativeSttAdapter({ available: true }),
        },
        tts: {
          kokoro: new KokoroTtsAdapter({ available: false }),
          browserNative: new BrowserNativeTtsAdapter({ available: true }),
        },
      },
    });

    expect(selection.stt.id).toBe('browser-native');
    expect(selection.tts.id).toBe('browser-native');
  });

  it('throws when no supported STT provider is available and fallback is disabled', () => {
    expect(() =>
      selectVoiceProviders({
        config: {
          stt: {
            allowBrowserFallback: false,
            enableFasterWhisper: false,
          },
        },
        adapters: {
          stt: {
            whisperCpp: new WhisperCppSttAdapter({ available: false }),
            fasterWhisper: new FasterWhisperSttAdapter({ available: false }),
            browserNative: new BrowserNativeSttAdapter({ available: true }),
          },
          tts: {
            kokoro: new KokoroTtsAdapter({ available: true }),
            browserNative: new BrowserNativeTtsAdapter({ available: true }),
          },
        },
      }),
    ).toThrow('No available STT provider for current config');
  });
});
