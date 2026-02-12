import { describe, expect, it } from 'vitest';
import os from 'os';
import path from 'path';
import fs from 'fs/promises';
import { ArtifactStore } from './ArtifactStore.js';
import { PatchEngine } from './PatchEngine.js';

describe('PatchEngine Presentation Support', () => {
  it('applies slide operations to .deck.md file', async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'patch-engine-presentation-test-'));
    const store = new ArtifactStore(tempDir);
    const engine = new PatchEngine(store);

    const initialContent = `---
title: Initial Deck
---

# Slide 1
Content 1

---

# Slide 2
Content 2
`;

    const filePath = 'docs/deck/test.deck.md';
    await store.write(filePath, initialContent, {
      actor: 'agent',
      reason: 'initial',
    });

    // Test REPLACE_SLIDE
    await engine.apply(filePath, {
      baseVersion: 0,
      actor: 'agent',
      intent: 'replace second slide',
      ops: [
        {
          type: 'REPLACE_SLIDE',
          index: 1,
          content: '# Slide 2 Updated\nNew Content 2'
        } as any
      ],
    });

    const replacedContent = (await store.read(filePath)).toString();
    expect(replacedContent).toContain('# Slide 2 Updated');
    expect(replacedContent).not.toContain('# Slide 2\nContent 2');
    expect(replacedContent).toContain('# Slide 1');

    // Test INSERT_SLIDE
    await engine.apply(filePath, {
      baseVersion: 1,
      actor: 'agent',
      intent: 'insert new slide at the end',
      ops: [
        {
          type: 'INSERT_SLIDE',
          index: 2,
          content: '# Slide 3\nNew Content 3'
        } as any
      ],
    });

    const insertedContent = (await store.read(filePath)).toString();
    expect(insertedContent).toContain('# Slide 3');

    // Test DELETE_SLIDE
    await engine.apply(filePath, {
      baseVersion: 2,
      actor: 'agent',
      intent: 'delete first slide',
      ops: [
        {
          type: 'DELETE_SLIDE',
          index: 0
        } as any
      ],
    });

    const deletedContent = (await store.read(filePath)).toString();
    expect(deletedContent).not.toContain('# Slide 1');
    expect(deletedContent).toContain('# Slide 2 Updated');
    expect(deletedContent).toContain('# Slide 3');

    await fs.rm(tempDir, { recursive: true, force: true });
  });
});
