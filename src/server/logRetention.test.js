import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { pruneApplicationLogs } from './logRetention.js';

const directories = [];
const directory = () => {
  const value = fs.mkdtempSync(path.join(os.tmpdir(), 'global-s-home-retention-'));
  directories.push(value);
  return value;
};

afterEach(() => directories.splice(0).forEach((value) => fs.rmSync(value, { recursive: true, force: true })));

describe('application log retention', () => {
  it('removes only expired, application-owned daily JSONL files', () => {
    const target = directory();
    for (const file of ['astro-2026-08-20.jsonl', 'ingestion-2026-08-21.jsonl', 'supervisor-2026-09-19.jsonl', 'unrelated-2026-01-01.jsonl', '.astro-rotation-audit.json']) {
      fs.writeFileSync(path.join(target, file), 'test');
    }

    const report = pruneApplicationLogs({ directory: target, retentionDays: 30, now: new Date('2026-09-20T12:00:00Z') });

    expect(report).toMatchObject({ scanned: 3, removed: 1 });
    expect(fs.existsSync(path.join(target, 'supervisor-2026-09-19.jsonl'))).toBe(true);
    expect(fs.existsSync(path.join(target, 'unrelated-2026-01-01.jsonl'))).toBe(true);
    expect(fs.existsSync(path.join(target, '.astro-rotation-audit.json'))).toBe(true);
  });
});
