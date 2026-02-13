const TRANSCRIPT_MODES = ['edit-before-send', 'automatic-send'] as const;
const OUTPUT_MODES = ['off', 'on-demand', 'on-completion', 'on-error', 'always'] as const;
const CUE_PROFILES = ['minimal', 'balanced', 'expressive'] as const;

export type VoiceTranscriptMode = (typeof TRANSCRIPT_MODES)[number];
export type VoiceOutputMode = (typeof OUTPUT_MODES)[number];
export type VoiceCueProfile = (typeof CUE_PROFILES)[number];

export interface VoiceSessionPolicy {
  transcriptMode: VoiceTranscriptMode;
  outputMode: VoiceOutputMode;
  bargeInEnabled: boolean;
  expressiveCuesEnabled: boolean;
  cueProfile: VoiceCueProfile;
  language: string;
  devicePreference?: string;
}

export const DEFAULT_VOICE_SESSION_POLICY: VoiceSessionPolicy = {
  transcriptMode: 'edit-before-send',
  outputMode: 'on-demand',
  bargeInEnabled: true,
  expressiveCuesEnabled: false,
  cueProfile: 'minimal',
  language: 'en-US',
};

function assertEnum<T extends readonly string[]>(value: unknown, allowed: T, fieldName: string): T[number] {
  if (typeof value !== 'string' || !allowed.includes(value)) {
    throw new Error(`${fieldName} must be one of: ${allowed.join(', ')}`);
  }

  return value as T[number];
}

function assertOptionalNonEmptyString(value: unknown, fieldName: string): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${fieldName} must be a non-empty string when provided`);
  }

  return value;
}

export function resolveVoiceSessionPolicy(overrides: Partial<VoiceSessionPolicy> = {}): VoiceSessionPolicy {
  const policy: VoiceSessionPolicy = {
    ...DEFAULT_VOICE_SESSION_POLICY,
    ...overrides,
  };

  return {
    transcriptMode: assertEnum(policy.transcriptMode, TRANSCRIPT_MODES, 'transcriptMode'),
    outputMode: assertEnum(policy.outputMode, OUTPUT_MODES, 'outputMode'),
    bargeInEnabled: Boolean(policy.bargeInEnabled),
    expressiveCuesEnabled: Boolean(policy.expressiveCuesEnabled),
    cueProfile: assertEnum(policy.cueProfile, CUE_PROFILES, 'cueProfile'),
    language:
      typeof policy.language === 'string' && policy.language.trim().length > 0
        ? policy.language
        : (() => {
            throw new Error('language must be a non-empty BCP-47 string');
          })(),
    devicePreference: assertOptionalNonEmptyString(policy.devicePreference, 'devicePreference'),
  };
}
