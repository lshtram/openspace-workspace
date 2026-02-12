import { ArtifactStore } from './ArtifactStore.js';
import {
  PatchRequestEnvelope,
  ValidationErrorEnvelope,
  assertPatchRequestEnvelope,
  createValidationErrorEnvelope,
} from '../interfaces/platform.js';

interface ReplaceContentOp {
  op: 'replace_content';
  content: string;
}

export interface PatchApplyResult {
  version: number;
  bytes: number;
}

class ValidationFailure extends Error implements ValidationErrorEnvelope {
  code: string;
  location: string;
  reason: string;
  remediation: string;

  constructor(envelope: ValidationErrorEnvelope) {
    super(envelope.reason);
    this.code = envelope.code;
    this.location = envelope.location;
    this.reason = envelope.reason;
    this.remediation = envelope.remediation;
  }
}

const parseReplaceContentOp = (ops: unknown[]): ReplaceContentOp => {
  if (ops.length !== 1) {
    throw new ValidationFailure(
      createValidationErrorEnvelope({
        code: 'UNSUPPORTED_PATCH_OPS',
        location: 'ops',
        reason: 'Exactly one replace_content operation is required',
        remediation: 'Provide one op: {"op":"replace_content","content":"..."}',
      }),
    );
  }

  const op = ops[0] as Record<string, unknown>;
  if (op.op !== 'replace_content' || typeof op.content !== 'string') {
    throw new ValidationFailure(
      createValidationErrorEnvelope({
        code: 'UNSUPPORTED_PATCH_OPS',
        location: 'ops[0]',
        reason: 'Unsupported patch operation',
        remediation: 'Use {"op":"replace_content","content":"..."}',
      }),
    );
  }

  return { op: 'replace_content', content: op.content };
};

export class PatchEngine {
  private versions = new Map<string, number>();

  constructor(private readonly store: ArtifactStore) {}

  getVersion(filePath: string): number {
    return this.versions.get(filePath) ?? 0;
  }

  async apply(filePath: string, envelopeBody: unknown): Promise<PatchApplyResult> {
    const envelope: PatchRequestEnvelope = assertPatchRequestEnvelope(envelopeBody);
    const currentVersion = this.getVersion(filePath);

    if (envelope.baseVersion !== currentVersion) {
      throw new ValidationFailure(
        createValidationErrorEnvelope({
          code: 'VERSION_CONFLICT',
          location: 'baseVersion',
          reason: `baseVersion ${envelope.baseVersion} does not match current version ${currentVersion}`,
          remediation: `Retry with baseVersion ${currentVersion}`,
        }),
      );
    }

    const op = parseReplaceContentOp(envelope.ops);

    await this.store.write(filePath, op.content, {
      actor: envelope.actor,
      reason: envelope.intent,
      createSnapshot: true,
    });

    const nextVersion = currentVersion + 1;
    this.versions.set(filePath, nextVersion);

    return {
      version: nextVersion,
      bytes: Buffer.byteLength(op.content, 'utf8'),
    };
  }
}
