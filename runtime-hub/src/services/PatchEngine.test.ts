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

    const first = await engine.apply('design/test-data.txt', {
      baseVersion: 0,
      actor: 'agent',
      intent: 'create diagram',
      ops: [{ op: 'replace_content', content: 'graph TD\nA-->B' }],
    });

    const second = await engine.apply('design/test-data.txt', {
      baseVersion: 1,
      actor: 'agent',
      intent: 'append edge',
      ops: [{ op: 'replace_content', content: 'graph TD\nA-->B\nB-->C' }],
    });

    expect(first.version).toBe(1);
    expect(second.version).toBe(2);

    const saved = await store.read('design/test-data.txt');
    expect(saved.toString()).toContain('B-->C');

    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('rejects stale baseVersion with structured error', async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'patch-engine-test-'));
    const store = new ArtifactStore(tempDir);
    const engine = new PatchEngine(store);

    await engine.apply('design/test-data.txt', {
      baseVersion: 0,
      actor: 'agent',
      intent: 'create diagram',
      ops: [{ op: 'replace_content', content: 'graph TD\nA-->B' }],
    });

    await expect(
      engine.apply('design/test-data.txt', {
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

  it('emits PATCH_APPLIED event with canonical payload on success', async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'patch-engine-events-test-'));
    const store = new ArtifactStore(tempDir);
    const engine = new PatchEngine(store);

    const eventPromise = new Promise<any>((resolve) => {
      store.once('PATCH_APPLIED', resolve);
    });

    await engine.apply('design/test-data.txt', {
      baseVersion: 0,
      actor: 'agent',
      intent: 'create diagram',
      ops: [{ op: 'replace_content', content: 'graph TD\nA-->B' }],
    });

    const event = await eventPromise;
    expect(event.type).toBe('PATCH_APPLIED');
    expect(event.modality).toBe('editor');
    expect(event.artifact).toBe('design/test-data.txt');
    expect(event.actor).toBe('agent');
    expect(event.version).toBe(1);
    expect(typeof event.timestamp).toBe('string');

    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('emits VALIDATION_FAILED event with canonical payload on validation rejection', async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'patch-engine-events-test-'));
    const store = new ArtifactStore(tempDir);
    const engine = new PatchEngine(store);

    await engine.apply('design/test-data.txt', {
      baseVersion: 0,
      actor: 'agent',
      intent: 'create diagram',
      ops: [{ op: 'replace_content', content: 'graph TD\nA-->B' }],
    });

    const eventPromise = new Promise<any>((resolve) => {
      store.once('VALIDATION_FAILED', resolve);
    });

    await expect(
      engine.apply('design/test-data.txt', {
        baseVersion: 0,
        actor: 'agent',
        intent: 'stale write',
        ops: [{ op: 'replace_content', content: 'graph TD\nA-->B\nB-->C' }],
      }),
    ).rejects.toMatchObject({
      code: 'VERSION_CONFLICT',
    });

    const event = await eventPromise;
    expect(event.type).toBe('VALIDATION_FAILED');
    expect(event.modality).toBe('editor');
    expect(event.artifact).toBe('design/test-data.txt');
    expect(event.actor).toBe('agent');
    expect(typeof event.timestamp).toBe('string');

    await fs.rm(tempDir, { recursive: true, force: true });
  });
});
