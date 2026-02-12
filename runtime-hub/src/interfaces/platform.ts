export const MIN_INTERVAL = 1000;

export const PLATFORM_EVENT_TYPES = ['ARTIFACT_UPDATED', 'PATCH_APPLIED', 'VALIDATION_FAILED'] as const;
export type PlatformEventType = (typeof PLATFORM_EVENT_TYPES)[number];

export type PlatformActor = 'user' | 'agent' | 'system';

export interface ActiveLocation {
  startLine: number;
  endLine: number;
}

export interface ActiveContext {
  modality: string;
  data: {
    path: string;
    location?: ActiveLocation;
  };
}

export interface PatchRequestEnvelope {
  baseVersion: number;
  actor: 'user' | 'agent';
  intent: string;
  ops: unknown[];
}

export interface ValidationErrorEnvelope {
  code: string;
  location: string;
  reason: string;
  remediation: string;
}

export interface PlatformEvent {
  type: PlatformEventType;
  modality: string;
  artifact: string;
  actor: PlatformActor;
  timestamp: string;
  version?: number;
  details?: Record<string, unknown>;
}

function assertRecord(value: unknown, fieldName: string): Record<string, unknown> {
  if (!value || typeof value !== 'object') {
    throw new Error(`${fieldName} must be an object`);
  }
  return value as Record<string, unknown>;
}

function assertNonEmptyString(value: unknown, fieldName: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${fieldName} must be a non-empty string`);
  }
  return value;
}

export function normalizeArtifactPath(rawPath: string): string {
  const normalizedPath = rawPath.replace(/\\/g, '/').replace(/^\/+/, '');

  if (normalizedPath.length === 0) {
    throw new Error('data.path must be provided');
  }

  if (normalizedPath.includes('..')) {
    throw new Error('data.path must stay under design/');
  }

  if (!normalizedPath.startsWith('design/') && !normalizedPath.startsWith('docs/deck/')) {
    throw new Error('data.path must stay under design/ or docs/deck/');
  }

  return normalizedPath;
}

export function assertActiveContextPayload(body: unknown): ActiveContext {
  const payload = assertRecord(body, 'body');
  const modality = assertNonEmptyString(payload.modality, 'modality');
  const data = assertRecord(payload.data, 'data');
  const path = normalizeArtifactPath(assertNonEmptyString(data.path, 'data.path'));

  let location: ActiveLocation | undefined;
  if (data.location !== undefined) {
    const rawLocation = assertRecord(data.location, 'data.location');
    const startLine = Number(rawLocation.startLine);
    const endLine = Number(rawLocation.endLine);

    if (!Number.isInteger(startLine) || startLine < 1) {
      throw new Error('data.location.startLine must be an integer >= 1');
    }

    if (!Number.isInteger(endLine) || endLine < startLine) {
      throw new Error('data.location.endLine must be an integer >= startLine');
    }

    location = { startLine, endLine };
  }

  return {
    modality,
    data: {
      path,
      location,
    },
  };
}

export function assertPatchRequestEnvelope(body: unknown): PatchRequestEnvelope {
  const payload = assertRecord(body, 'body');
  const baseVersion = Number(payload.baseVersion);

  if (!Number.isInteger(baseVersion) || baseVersion < 0) {
    throw new Error('baseVersion must be an integer >= 0');
  }

  const actor = assertNonEmptyString(payload.actor, 'actor');
  if (actor !== 'user' && actor !== 'agent') {
    throw new Error('actor must be one of: user, agent');
  }

  const intent = assertNonEmptyString(payload.intent, 'intent');

  if (!Array.isArray(payload.ops)) {
    throw new Error('ops must be an array');
  }

  if (payload.ops.length === 0) {
    throw new Error('ops must include at least one operation');
  }

  return {
    baseVersion,
    actor,
    intent,
    ops: payload.ops,
  };
}

export function createPlatformEvent(
  type: PlatformEventType,
  payload: Omit<PlatformEvent, 'type' | 'timestamp'>,
): PlatformEvent {
  return {
    type,
    timestamp: new Date().toISOString(),
    ...payload,
  };
}

export function createValidationErrorEnvelope(input: ValidationErrorEnvelope): ValidationErrorEnvelope {
  return {
    code: assertNonEmptyString(input.code, 'code'),
    location: assertNonEmptyString(input.location, 'location'),
    reason: assertNonEmptyString(input.reason, 'reason'),
    remediation: assertNonEmptyString(input.remediation, 'remediation'),
  };
}
