import { WriteOptions } from '../services/ArtifactStore.js';
import { ValidationErrorEnvelope, createValidationErrorEnvelope } from './platform.js';

export class PolicyViolation extends Error implements ValidationErrorEnvelope {
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

export function assertLegacyWriteAllowed(opts: WriteOptions): void {
  if (opts.actor === 'agent') {
    throw new PolicyViolation(
      createValidationErrorEnvelope({
        code: 'AGENT_PATCH_REQUIRED',
        location: 'opts.actor',
        reason: 'Agent writes must use patch endpoint',
        remediation: 'Use POST /files/:path/patch with patch envelope and baseVersion',
      }),
    );
  }
}

export function assertUserDirectWriteMode(headerValue: string | undefined): void {
  if (headerValue !== 'user-direct') {
    throw new PolicyViolation(
      createValidationErrorEnvelope({
        code: 'USER_DIRECT_WRITE_REQUIRED',
        location: 'header:x-openspace-write-mode',
        reason: 'Legacy content writes require explicit user-direct mode',
        remediation: 'Set x-openspace-write-mode: user-direct or use patch endpoint',
      }),
    );
  }
}
