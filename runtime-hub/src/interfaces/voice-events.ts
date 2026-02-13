import { createHash } from 'node:crypto';

import { PlatformEvent, PlatformEventType, createPlatformEvent } from './platform.js';

export const VOICE_EVENT_TYPES = [
  'SESSION_STARTED',
  'SESSION_STOPPED',
  'TRANSCRIPT_UPDATED',
  'OUTPUT_QUEUED',
  'OUTPUT_STARTED',
  'OUTPUT_INTERRUPTED',
  'STREAM_RETRY',
  'STREAM_FAILED',
] as const;

export type VoiceEventType = (typeof VOICE_EVENT_TYPES)[number];

interface VoicePlatformEventInput extends Omit<PlatformEvent, 'type' | 'timestamp' | 'details'> {
  details?: Record<string, unknown>;
  voiceEvent: VoiceEventType;
  sessionId: string;
  segmentId?: string;
}

function assertNonEmptyString(value: unknown, fieldName: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${fieldName} must be a non-empty string`);
  }

  return value;
}

function normalizeSegmentText(text: string): string {
  return text.trim().replace(/\s+/g, ' ');
}

export function createVoicePlatformEvent(type: PlatformEventType, input: VoicePlatformEventInput): PlatformEvent {
  const details: Record<string, unknown> = {
    ...(input.details ?? {}),
    domain: 'voice',
    voiceEvent: input.voiceEvent,
    sessionId: assertNonEmptyString(input.sessionId, 'sessionId'),
  };

  if (input.segmentId !== undefined) {
    details.segmentId = assertNonEmptyString(input.segmentId, 'segmentId');
  }

  return createPlatformEvent(type, {
    modality: input.modality,
    artifact: input.artifact,
    actor: input.actor,
    version: input.version,
    details,
  });
}

export function createVoiceSegmentId(sessionId: string, planId: string, segmentIndex: number, text: string): string {
  const safeSessionId = assertNonEmptyString(sessionId, 'sessionId');
  const safePlanId = assertNonEmptyString(planId, 'planId');

  if (!Number.isInteger(segmentIndex) || segmentIndex < 0) {
    throw new Error('segmentIndex must be an integer >= 0');
  }

  const normalizedText = normalizeSegmentText(assertNonEmptyString(text, 'text'));

  if (normalizedText.length === 0) {
    throw new Error('text must be a non-empty string');
  }

  return createHash('sha1')
    .update(`${safeSessionId}${safePlanId}${segmentIndex}${normalizedText}`)
    .digest('hex')
    .slice(0, 12);
}
