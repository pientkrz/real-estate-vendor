import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoot = path.join(root, 'src');
const manifestPath = path.join(root, 'scripts/material-symbols-icons.txt');
const manifest = new Set((await readFile(manifestPath, 'utf8'))
  .split(/\r?\n/)
  .map((icon) => icon.trim())
  .filter(Boolean));
const sourceFiles = [];

async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (!entry.name.endsWith('.test')) await walk(entryPath);
    } else if (/\.(astro|[cm]?[jt]sx?)$/i.test(entry.name) && !/\.test\./i.test(entry.name)) {
      sourceFiles.push(entryPath);
    }
  }
}

await walk(sourceRoot);

const usedIcons = new Map();
const add = (name, file) => {
  const icon = name.trim();
  if (/^[a-z][a-z0-9_]*$/.test(icon)) usedIcons.set(icon, file);
};

for (const file of sourceFiles) {
  const source = await readFile(file, 'utf8');
  for (const match of source.matchAll(/\bicon\s*(?::|=)\s*['"]([a-z][a-z0-9_]*)['"]/g)) add(match[1], file);
  for (const match of source.matchAll(/<span\b[^>]*material-symbols-outlined[^>]*>([\s\S]*?)<\/span>/gi)) {
    const content = match[1].trim();
    if (/^[a-z][a-z0-9_]*$/.test(content)) add(content, file);
    for (const quoted of content.matchAll(/['"]([a-z][a-z0-9_]*)['"]/g)) add(quoted[1], file);
  }
}

const missing = [...usedIcons.keys()].filter((icon) => !manifest.has(icon)).sort();
if (missing.length) {
  console.error(`Material Symbols missing from subset manifest: ${missing.join(', ')}`);
  process.exitCode = 1;
} else {
  console.log(`Material Symbols manifest covers ${usedIcons.size} icons.`);
}
