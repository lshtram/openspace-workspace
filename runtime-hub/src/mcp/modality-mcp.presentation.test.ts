import { describe, it, expect, vi, beforeEach } from 'vitest';
import { callToolHandler } from './modality-mcp.js';
import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';

vi.mock('node-fetch');
vi.mock('fs/promises');

describe('Presentation MCP Tools', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('presentation.list', () => {
    it('should list files from design/deck', async () => {
      vi.mocked(fs.readdir).mockResolvedValue(['test1.deck.md', 'other.txt'] as any);

      const result = await callToolHandler({
        params: {
          name: 'presentation.list',
          arguments: {},
        }
      });

      expect(fs.readdir).toHaveBeenCalledWith(expect.stringContaining(path.join('design', 'deck')));
      expect(result.content[0].text).toContain('test1');
      expect(result.content[0].text).not.toContain('other.txt');
    });
  });

  describe('presentation.read', () => {
    it('should read deck from design/deck', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('# Slide 1'),
      } as any);

      const result = await callToolHandler({
        params: {
          name: 'presentation.read',
          arguments: { name: 'test-deck' },
        }
      });

      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('design/deck/test-deck.deck.md'));
      expect(result.content[0].text).toBe('# Slide 1');
    });
  });

  describe('presentation.update', () => {
    it('should update deck in design/deck using patch endpoint', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ version: 1 }),
      } as any);

      const result = await callToolHandler({
        params: {
          name: 'presentation.update',
          arguments: { name: 'test-deck', content: '# Updated Content' },
        }
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('design/deck/test-deck.deck.md/patch'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('replace_content'),
        })
      );
      expect(result.content[0].text).toContain('Successfully updated');
    });
  });

  describe('presentation.read_slide', () => {
    it('should read a specific slide from design/deck', async () => {
      const content = '---\ntitle: test\n---\n# Slide 1\n---\n# Slide 2';
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(content),
      } as any);

      const result = await callToolHandler({
        params: {
          name: 'presentation.read_slide',
          arguments: { name: 'test-deck', index: 0 },
        }
      });

      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('design/deck/test-deck.deck.md'));
      // Index 0 with frontmatter should be "# Slide 1"
      expect(result.content[0].text).toBe('# Slide 1');
    });
  });

  describe('presentation.update_slide', () => {
    it('should update a specific slide using REPLACE_SLIDE op', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ version: 1 }),
      } as any);

      const result = await callToolHandler({
        params: {
          name: 'presentation.update_slide',
          arguments: { 
            name: 'test-deck', 
            index: 1, 
            content: '# New Slide Content',
            operation: 'replace' 
          },
        }
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('design/deck/test-deck.deck.md/patch'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('REPLACE_SLIDE'),
        })
      );
      expect(result.content[0].text).toContain('Successfully applied replace slide');
    });
  });
});
