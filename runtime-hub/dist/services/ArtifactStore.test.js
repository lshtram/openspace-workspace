import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { ArtifactStore } from './ArtifactStore';
describe('ArtifactStore', () => {
    let tempDir;
    let store;
    beforeEach(async () => {
        tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'artifact-store-test-'));
        store = new ArtifactStore(tempDir);
    });
    afterEach(async () => {
        await fs.rm(tempDir, { recursive: true, force: true });
    });
    it('should write a file and log an event', async () => {
        const filePath = 'test.txt';
        const content = 'hello world';
        const opts = { actor: 'user', reason: 'test' };
        await store.write(filePath, content, opts);
        const savedContent = await fs.readFile(path.join(tempDir, filePath), 'utf-8');
        expect(savedContent).toBe(content);
        const logContent = await fs.readFile(path.join(tempDir, '.opencode', 'artifacts', 'events.ndjson'), 'utf-8');
        const event = JSON.parse(logContent.trim());
        expect(event.artifact).toBe(filePath);
        expect(event.actor).toBe('user');
    });
    it('should serialize concurrent writes', async () => {
        const filePath = 'counter.txt';
        const writes = 10;
        const promises = [];
        // We want to test that they are executed one by one.
        // We can mock fs.writeFile to track calls.
        const spy = vi.spyOn(fs, 'writeFile');
        for (let i = 0; i < writes; i++) {
            promises.push(store.write(filePath, `content ${i}`, { actor: 'user', reason: `write ${i}` }));
        }
        await Promise.all(promises);
        expect(spy).toHaveBeenCalledTimes(writes);
        const lastContent = await fs.readFile(path.join(tempDir, filePath), 'utf-8');
        // Since they are serialized and FIFO, the last one in the loop should be the final state
        expect(lastContent).toBe(`content ${writes - 1}`);
    });
    it('should debounce writes to the same file', async () => {
        const filePath = 'debounced.txt';
        const opts = { actor: 'user', reason: 'debounce test', debounce: true };
        const p1 = store.write(filePath, 'v1', opts);
        const p2 = store.write(filePath, 'v2', opts);
        const p3 = store.write(filePath, 'v3', opts);
        await Promise.all([p1, p2, p3]);
        // Should only have written once (or at least the final version)
        const savedContent = await fs.readFile(path.join(tempDir, filePath), 'utf-8');
        expect(savedContent).toBe('v3');
        // Check history - should not have many versions if debounced correctly
        const historyDir = path.join(tempDir, '.opencode', 'artifacts', 'history', filePath);
        const historyFiles = await fs.readdir(historyDir).catch(() => []);
        // v3 is the only one that actually went through the full write cycle after debounce
        expect(historyFiles.length).toBeLessThan(3);
    });
    it('should keep only the last 20 versions in history', async () => {
        const filePath = 'history.txt';
        const writes = 25;
        for (let i = 0; i < writes; i++) {
            // Need to wait for each write to complete to ensure they are distinct versions
            await store.write(filePath, `v${i}`, { actor: 'user', reason: `rev ${i}` });
        }
        const historyDir = path.join(tempDir, '.opencode', 'artifacts', 'history', filePath);
        const historyFiles = await fs.readdir(historyDir);
        expect(historyFiles.length).toBe(20);
        // Verify it kept the LATEST 20
        // The history files are named with timestamps, we just check count for now
    });
    it('should perform atomic writes via temp files', async () => {
        const filePath = 'atomic.txt';
        const spy = vi.spyOn(fs, 'rename');
        await store.write(filePath, 'atomic content', { actor: 'user', reason: 'atomic test' });
        expect(spy).toHaveBeenCalled();
        const renameCall = spy.mock.calls[0];
        expect(renameCall[0]).toContain('.tmp');
        expect(renameCall[1]).toContain(filePath);
    });
});
