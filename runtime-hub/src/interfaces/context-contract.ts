import { ActiveContext, assertActiveContextPayload, normalizeWorkspacePath } from './platform.js';

interface ParseOptions {
  legacyWhiteboardAlias?: boolean;
}

export function parseActiveContextRequest(body: unknown, options: ParseOptions = {}): ActiveContext {
  if (options.legacyWhiteboardAlias) {
    const payload = body as { filePath?: unknown };
    if (payload && typeof payload === 'object' && payload.filePath !== undefined) {
      return {
        modality: 'whiteboard',
        data: {
          path: normalizeWorkspacePath(String(payload.filePath)),
        },
      };
    }
  }

  return assertActiveContextPayload(body);
}

export function parseActiveContextResponse(body: unknown): ActiveContext | null {
  if (body === null) {
    return null;
  }

  if (body && typeof body === 'object') {
    const payload = body as {
      activeWhiteboard?: unknown;
    };

    if (typeof payload.activeWhiteboard === 'string' && payload.activeWhiteboard.trim().length > 0) {
      return {
        modality: 'whiteboard',
        data: {
          path: normalizeWorkspacePath(payload.activeWhiteboard),
        },
      };
    }
  }

  return assertActiveContextPayload(body);
}
