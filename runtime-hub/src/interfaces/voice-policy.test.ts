import { describe, expect, it } from 'vitest';
import {
  DEFAULT_VOICE_SESSION_POLICY,
  resolveVoiceSessionPolicy,
  type VoiceSessionPolicy,
} from './voice-policy.js';

describe('voice session policy', () => {
  it('provides the MVP default policy', () => {
    expect(DEFAULT_VOICE_SESSION_POLICY).toEqual({
      transcriptMode: 'edit-before-send',
      outputMode: 'on-demand',
      bargeInEnabled: true,
      expressiveCuesEnabled: false,
      cueProfile: 'minimal',
      language: 'en-US',
    });
  });

  it('applies defaults when policy is omitted', () => {
    const policy = resolveVoiceSessionPolicy();
    expect(policy.outputMode).toBe('on-demand');
    expect(policy.transcriptMode).toBe('edit-before-send');
  });

  it('merges valid policy overrides', () => {
    const policy = resolveVoiceSessionPolicy({
      transcriptMode: 'automatic-send',
      outputMode: 'always',
      bargeInEnabled: false,
      expressiveCuesEnabled: true,
      cueProfile: 'expressive',
      language: 'fr-FR',
      devicePreference: 'studio-speaker',
    });

    expect(policy).toEqual({
      transcriptMode: 'automatic-send',
      outputMode: 'always',
      bargeInEnabled: false,
      expressiveCuesEnabled: true,
      cueProfile: 'expressive',
      language: 'fr-FR',
      devicePreference: 'studio-speaker',
    } satisfies VoiceSessionPolicy);
  });

  it('rejects unsupported transcript mode', () => {
    expect(() =>
      resolveVoiceSessionPolicy({
        transcriptMode: 'manual' as unknown as VoiceSessionPolicy['transcriptMode'],
      }),
    ).toThrow('transcriptMode must be one of: edit-before-send, automatic-send');
  });

  it('rejects unsupported output mode', () => {
    expect(() =>
      resolveVoiceSessionPolicy({
        outputMode: 'on-idle' as unknown as VoiceSessionPolicy['outputMode'],
      }),
    ).toThrow('outputMode must be one of: off, on-demand, on-completion, on-error, always');
  });

  it('rejects an empty language value', () => {
    expect(() => resolveVoiceSessionPolicy({ language: '' })).toThrow('language must be a non-empty BCP-47 string');
  });
});
