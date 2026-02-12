import { describe, expect, it } from 'vitest';
import os from 'os';
import path from 'path';
import fs from 'fs/promises';
import { ArtifactStore } from './ArtifactStore.js';
import { PatchEngine } from './PatchEngine.js';

describe('PatchEngine', () => {
  it('applies replace_content patch and increments version', async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'patch-engine-test-'));
    const store = new ArtifactStore(tempDir);
    const engine = new PatchEngine(store);

    const first = await engine.apply('design/diagram.graph.mmd', {
      baseVersion: 0,
      actor: 'agent',
      intent: 'create diagram',
      ops: [{ op: 'replace_content', content: 'graph TD\nA-->B' }],
    });

    const second = await engine.apply('design/diagram.graph.mmd', {
      baseVersion: 1,
      actor: 'agent',
      intent: 'append edge',
      ops: [{ op: 'replace_content', content: 'graph TD\nA-->B\nB-->C' }],
    });

    expect(first.version).toBe(1);
    expect(second.version).toBe(2);

    const saved = await store.read('design/diagram.graph.mmd');
    expect(saved.toString()).toContain('B-->C');

    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('rejects stale baseVersion with structured error', async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'patch-engine-test-'));
    const store = new ArtifactStore(tempDir);
    const engine = new PatchEngine(store);

    await engine.apply('design/diagram.graph.mmd', {
      baseVersion: 0,
      actor: 'agent',
      intent: 'create diagram',
      ops: [{ op: 'replace_content', content: 'graph TD\nA-->B' }],
    });

    await expect(
      engine.apply('design/diagram.graph.mmd', {
        baseVersion: 0,
        actor: 'agent',
        intent: 'stale write',
        ops: [{ op: 'replace_content', content: 'graph TD\nA-->B\nB-->C' }],
      }),
    ).rejects.toMatchObject({
      code: 'VERSION_CONFLICT',
      location: 'baseVersion',
    });

    await fs.rm(tempDir, { recursive: true, force: true });
  });
});
