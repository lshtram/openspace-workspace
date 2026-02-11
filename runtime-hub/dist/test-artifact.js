import { ArtifactStore } from './services/ArtifactStore';
import path from 'path';
import fs from 'fs/promises';
async function test() {
    console.log('Starting ArtifactStore Test...');
    const projectRoot = path.join(process.cwd(), 'temp-project');
    console.log('Project Root:', projectRoot);
    await fs.mkdir(projectRoot, { recursive: true });
    const store = new ArtifactStore(projectRoot);
    console.log('--- Test 1: Sequential Writes ---');
    await Promise.all([
        store.write('test.txt', 'Content 1', { actor: 'user', reason: 'Update 1' }),
        store.write('test.txt', 'Content 2', { actor: 'agent', reason: 'Update 2' }),
        store.write('test.txt', 'Content 3', { actor: 'user', reason: 'Update 3' })
    ]);
    const finalContent = await fs.readFile(path.join(projectRoot, 'test.txt'), 'utf-8');
    console.log('Final Content:', finalContent);
    console.log('\n--- Test 2: Debounced Writes ---');
    store.write('debounced.txt', 'First', { actor: 'user', reason: 'D1', debounce: true });
    store.write('debounced.txt', 'Second', { actor: 'user', reason: 'D2', debounce: true });
    await store.write('debounced.txt', 'Third', { actor: 'user', reason: 'D3', debounce: true });
    const debouncedContent = await fs.readFile(path.join(projectRoot, 'debounced.txt'), 'utf-8');
    console.log('Debounced Content (Should be Third):', debouncedContent);
    console.log('\n--- Test 3: History & Logs ---');
    const historyPath = path.join(projectRoot, '.opencode/artifacts/history/test.txt');
    const historyFiles = await fs.readdir(historyPath);
    console.log('History versions count:', historyFiles.length);
    const logContent = await fs.readFile(path.join(projectRoot, '.opencode/artifacts/events.ndjson'), 'utf-8');
    console.log('Last Log Entry:', logContent.split('\n').filter(Boolean).pop());
}
test().catch(console.error);
