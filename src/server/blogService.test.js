import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadRuntimeBlogPost, loadRuntimeBlogPosts } from './blogService.js';

const directories = [];
const logger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() };
const createDirectory = async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'global-s-home-blog-'));
  directories.push(directory);
  return directory;
};
const writePost = (directory, filename, content) => fs.writeFile(path.join(directory, filename), content);

afterEach(async () => {
  vi.clearAllMocks();
  await Promise.all(directories.splice(0).map((directory) => fs.rm(directory, { recursive: true, force: true })));
});

describe('runtime blog service', () => {
  it('renders a valid post with multiple categories and sanitizes Markdown HTML', async () => {
    const directory = await createDirectory();
    await writePost(directory, 'bezpieczny-wpis.md', '---\ntitle: "Bezpieczny wpis"\ndescription: "Opis wpisu"\npubDate: 2026-06-15\ncategories: ["CYPR", "INWESTYCJE"]\n---\n\n## Nagłówek\n\n**Treść** <script>alert("xss")</script>');

    const [post] = await loadRuntimeBlogPosts({ directory, logger });
    expect(post).toMatchObject({
      id: 'bezpieczny-wpis',
      isInvalid: false,
      data: { title: 'Bezpieczny wpis', categories: ['CYPR', 'INWESTYCJE'] },
    });
    expect(post.html).toContain('<h2>Nagłówek</h2>');
    expect(post.html).not.toContain('<script');
  });

  it.each([
    ['missing categories', '---\ntitle: "Tytuł"\ndescription: "Opis"\npubDate: 2026-06-15\n---\n\nTreść'],
    ['empty categories', '---\ntitle: "Tytuł"\ndescription: "Opis"\npubDate: 2026-06-15\ncategories: []\n---\n\nTreść'],
    ['non-array categories', '---\ntitle: "Tytuł"\ndescription: "Opis"\npubDate: 2026-06-15\ncategories: CYPR\n---\n\nTreść'],
    ['legacy category field', '---\ntitle: "Tytuł"\ndescription: "Opis"\npubDate: 2026-06-15\ncategories: ["CYPR"]\ncategory: "CYPR"\n---\n\nTreść'],
    ['malformed YAML', '---\ntitle: [niezamkniete\n---\nTreść'],
  ])('creates a safe invalid post for %s', async (_, content) => {
    const directory = await createDirectory();
    await writePost(directory, 'niepoprawny-wpis.md', content);

    const post = await loadRuntimeBlogPost('niepoprawny-wpis', { directory, logger });

    expect(post).toMatchObject({
      id: 'niepoprawny-wpis',
      isInvalid: true,
      data: { title: 'Invalid blog', description: expect.any(String) },
    });
    expect(post.validationErrors.length).toBeGreaterThan(0);
    expect(post.html).toBeUndefined();
  });

  it('excludes unsafe filenames and makes a corrected file valid on the next request', async () => {
    const directory = await createDirectory();
    await writePost(directory, 'unsafe name.md', '---\ntitle: "Hidden"\ndescription: "Hidden"\npubDate: 2026-06-15\ncategories: ["CYPR"]\n---');
    await writePost(directory, 'zmieniany-wpis.md', '---\ntitle: "Tytuł"\ndescription: "Opis"\npubDate: 2026-06-15\ncategories: []\n---');

    expect(await loadRuntimeBlogPosts({ directory, logger })).toHaveLength(1);
    expect((await loadRuntimeBlogPost('zmieniany-wpis', { directory, logger })).isInvalid).toBe(true);

    await writePost(directory, 'zmieniany-wpis.md', '---\ntitle: "Tytuł"\ndescription: "Opis"\npubDate: 2026-06-15\ncategories: ["CYPR"]\n---\n\nPoprawna treść.');

    const corrected = await loadRuntimeBlogPost('zmieniany-wpis', { directory, logger });
    expect(corrected.isInvalid).toBe(false);
    expect(corrected.html).toContain('Poprawna treść.');
  });
});
