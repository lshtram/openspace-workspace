import { ActiveContext, assertActiveContextPayload, normalizeArtifactPath } from './platform.js';

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
          path: normalizeArtifactPath(String(payload.filePath)),
        },
      };
    }
  }

  return assertActiveContextPayload(body);
}
