import { ActiveLocation, normalizeWorkspacePath } from './platform.js';

export interface CrossModalityHandoffPayload {
  sourceModality: string;
  target: {
    path?: string;
    id?: string;
  };
  location?: ActiveLocation;
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

function assertActiveLocation(value: unknown): ActiveLocation {
  const rawLocation = assertRecord(value, 'location');
  const startLine = Number(rawLocation.startLine);
  const endLine = Number(rawLocation.endLine);

  if (!Number.isInteger(startLine) || startLine < 1) {
    throw new Error('location.startLine must be an integer >= 1');
  }

  if (!Number.isInteger(endLine) || endLine < startLine) {
    throw new Error('location.endLine must be an integer >= startLine');
  }

  return { startLine, endLine };
}

export function assertHandoffPayload(body: unknown): CrossModalityHandoffPayload {
  const payload = assertRecord(body, 'body');
  const sourceModality = assertNonEmptyString(payload.sourceModality, 'sourceModality');
  const target = assertRecord(payload.target, 'target');

  const rawPath = typeof target.path === 'string' ? target.path : undefined;
  const rawId = typeof target.id === 'string' ? target.id : undefined;

  if (!rawPath && !rawId) {
    throw new Error('target.path or target.id must be provided');
  }

  return {
    sourceModality,
    target: {
      path: rawPath ? normalizeWorkspacePath(rawPath) : undefined,
      id: rawId,
    },
    location: payload.location === undefined ? undefined : assertActiveLocation(payload.location),
  };
}
