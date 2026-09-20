import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import DOMPurify from 'isomorphic-dompurify';
import yaml from 'js-yaml';
import { marked } from 'marked';
import { getLogger } from './logger.js';

const SAFE_BLOG_FILE = /^[a-z0-9]+(?:-[a-z0-9]+)*\.md$/;
const ALLOWED_FRONTMATTER_FIELDS = new Set([
  'title',
  'description',
  'pubDate',
  'categories',
  'author',
  'thumbnail',
]);

export const BLOG_TEMPLATE = `---
title: "Tytuł Twojego artykułu"
description: "Krótki opis, który pojawi się jako zajawka."
pubDate: 2026-06-15
categories: ["ARCHITEKTURA", "INWESTYCJE"]
author: "Imię Nazwisko"
thumbnail: "https://link-do-zdjecia.jpg"
---

## Nagłówek sekcji

Treść artykułu.`;

const runtimeEnv = (env = import.meta.env) => ({
  ...env,
  ...(globalThis.process?.env ?? {}),
});

export const getBlogRuntimeConfig = (env, cwd = process.cwd()) => {
  const resolvedEnv = runtimeEnv(env);
  return {
    directory: path.resolve(resolvedEnv.BLOG_CONTENT_PATH || path.join(cwd, 'src', 'content', 'blog')),
  };
};

const invalidData = Object.freeze({
  title: 'Nieprawidłowy artykuł',
  description: 'Ten artykuł wymaga poprawek, zanim będzie można go opublikować.',
  pubDate: new Date(0),
  categories: ['NIEPRAWIDŁOWY ARTYKUŁ'],
});

const validationMessage = (field, message) => `${field}: ${message}`;

const parsePubDate = (value) => {
  if (value instanceof Date && !Number.isNaN(value.valueOf())) return new Date(value.valueOf());
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== value ? null : date;
};

const validatePostData = (data) => {
  const errors = [];
  const source = data && typeof data === 'object' && !Array.isArray(data) ? data : {};

  Object.keys(source).forEach((field) => {
    if (!ALLOWED_FRONTMATTER_FIELDS.has(field)) {
      errors.push(validationMessage(field, 'pole nie jest obsługiwane przez szablon artykułu.'));
    }
  });

  const title = typeof source.title === 'string' ? source.title.trim() : '';
  if (!title) errors.push(validationMessage('title', 'wymagany niepusty tekst.'));

  const description = typeof source.description === 'string' ? source.description.trim() : '';
  if (!description) errors.push(validationMessage('description', 'wymagany niepusty tekst.'));

  const pubDate = parsePubDate(source.pubDate);
  if (!pubDate) errors.push(validationMessage('pubDate', 'wymagana data w formacie RRRR-MM-DD.'));

  if (!Array.isArray(source.categories) || source.categories.length === 0) {
    errors.push(validationMessage('categories', 'wymagana niepusta lista kategorii.'));
  }

  const categories = Array.isArray(source.categories)
    ? source.categories.map((category) => typeof category === 'string' ? category.trim() : '')
    : [];
  if (Array.isArray(source.categories) && categories.some((category) => !category)) {
    errors.push(validationMessage('categories', 'każda kategoria musi być niepustym tekstem.'));
  }

  const author = source.author === undefined ? undefined : typeof source.author === 'string' ? source.author.trim() : null;
  if (author === null) errors.push(validationMessage('author', 'musi być tekstem, jeśli jest podany.'));

  const thumbnail = source.thumbnail === undefined ? undefined : typeof source.thumbnail === 'string' ? source.thumbnail.trim() : null;
  if (thumbnail === null) errors.push(validationMessage('thumbnail', 'musi być tekstem, jeśli jest podany.'));

  if (errors.length > 0) return { errors };

  return {
    data: {
      title,
      description,
      pubDate,
      categories: [...new Set(categories)],
      ...(author ? { author } : {}),
      ...(thumbnail ? { thumbnail } : {}),
    },
  };
};

const createInvalidPost = (id, validationErrors) => ({
  id,
  data: { ...invalidData, categories: [...invalidData.categories] },
  isInvalid: true,
  validationErrors,
});

const renderMarkdown = async (markdown) => DOMPurify.sanitize(await marked.parse(markdown, {
  gfm: true,
  breaks: false,
}));

const readBlogPost = async ({ directory, filename, logger }) => {
  const id = filename.slice(0, -3);
  const filePath = path.join(directory, filename);

  try {
    const stats = await fs.lstat(filePath);
    if (!stats.isFile()) {
      logger.warn('blog_file_excluded', { component: 'blog', slug: id, reason: 'not_regular_file' });
      return null;
    }

    const source = await fs.readFile(filePath, 'utf8');
    let parsed;
    try {
      parsed = matter(source, { engines: { yaml: { parse: yaml.load } } });
    } catch (error) {
      logger.warn('blog_post_invalid', { component: 'blog', slug: id, errorCodes: ['frontmatter_malformed'], errorName: error?.name });
      return createInvalidPost(id, ['Frontmatter: nieprawidłowy nagłówek YAML.']);
    }

    const validation = validatePostData(parsed.data);
    if (validation.errors) {
      logger.warn('blog_post_invalid', { component: 'blog', slug: id, errorCodes: validation.errors.map((_, index) => `validation_${index + 1}`) });
      return createInvalidPost(id, validation.errors);
    }

    try {
      return {
        id,
        data: validation.data,
        html: await renderMarkdown(parsed.content),
        isInvalid: false,
      };
    } catch {
      logger.warn('blog_post_invalid', { component: 'blog', slug: id, errorCodes: ['markdown_render_failed'] });
      return createInvalidPost(id, ['Treść: nie udało się bezpiecznie przygotować Markdown do wyświetlenia.']);
    }
  } catch {
    logger.warn('blog_file_unreadable', { component: 'blog', slug: id });
    return null;
  }
};

/**
 * Reads the configured directory on every SSR request. This deliberately has
 * no cache, so a corrected VPS Markdown file is visible on the next request.
 */
export const loadRuntimeBlogPosts = async (options = {}) => {
  const config = options.directory
    ? { directory: path.resolve(options.directory) }
    : getBlogRuntimeConfig(options.env, options.cwd);
  const logger = options.logger ?? getLogger('astro');

  let entries;
  try {
    entries = await fs.readdir(config.directory, { withFileTypes: true });
  } catch {
    logger.warn('blog_directory_unavailable', { component: 'blog' });
    return [];
  }

  const posts = await Promise.all(entries
    .filter((entry) => {
      const isSafe = entry.isFile() && SAFE_BLOG_FILE.test(entry.name);
      if (!isSafe && entry.name.endsWith('.md')) {
        logger.warn('blog_file_excluded', { component: 'blog', reason: entry.isSymbolicLink() ? 'symlink' : 'unsafe_filename' });
      }
      return isSafe;
    })
    .map((entry) => readBlogPost({ directory: config.directory, filename: entry.name, logger })));

  return posts
    .filter(Boolean)
    .sort((left, right) => right.data.pubDate.valueOf() - left.data.pubDate.valueOf());
};

export const loadRuntimeBlogPost = async (slug, options = {}) => {
  if (typeof slug !== 'string' || !SAFE_BLOG_FILE.test(`${slug}.md`)) return null;
  const posts = await loadRuntimeBlogPosts(options);
  return posts.find((post) => post.id === slug) ?? null;
};

export const __private__ = {
  SAFE_BLOG_FILE,
  parsePubDate,
  validatePostData,
};
