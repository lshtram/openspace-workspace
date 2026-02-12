import { describe, expect, it } from 'vitest';
import {
  assertLegacyWriteAllowed,
  assertLegacyWritePolicy,
  assertUserDirectWriteMode,
} from './write-policy.js';

describe('write policy', () => {
  it('allows legacy content writes for user actor', () => {
    expect(() => assertLegacyWriteAllowed({ actor: 'user', reason: 'autosave' })).not.toThrow();
  });

  it('rejects legacy content writes for agent actor', () => {
    expect(() => assertLegacyWriteAllowed({ actor: 'agent', reason: 'tool write' })).toThrow(
      'Agent writes must use patch endpoint',
    );
  });

  it('requires explicit user-direct write mode header', () => {
    expect(() => assertUserDirectWriteMode(undefined)).toThrow('Legacy content writes require explicit user-direct mode');
    expect(() => assertUserDirectWriteMode('user-direct')).not.toThrow();
  });

  it('allows user direct legacy writes with explicit mode', () => {
    expect(() =>
      assertLegacyWritePolicy(
        { actor: 'user', reason: 'manual edit' },
        {
          writeModeHeader: 'user-direct',
        },
      ),
    ).not.toThrow();
  });

  it('rejects legacy writes when explicit user mode header is missing', () => {
    expect(() =>
      assertLegacyWritePolicy(
        { actor: 'user', reason: 'manual edit' },
        {
          writeModeHeader: undefined,
        },
      ),
    ).toThrow('Legacy content writes require explicit user-direct mode');
  });
});
