import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { __private__, createStructuredLogger, getLoggingConfig } from './logger.js';

const directories = [];

const temporaryDirectory = () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'global-s-home-logs-'));
  directories.push(directory);
  return directory;
};

afterEach(() => {
  directories.splice(0).forEach((directory) => fs.rmSync(directory, { recursive: true, force: true }));
});

describe('structured logger', () => {
  it('writes JSONL with an event and stable process metadata', async () => {
    const directory = temporaryDirectory();
    const logger = createStructuredLogger('astro', { directory, retentionDays: 30, level: 'info' });
    logger.info('process_started', { component: 'runtime', port: 54322 });
    await logger.close();

    const [file] = fs.readdirSync(directory).filter((entry) => entry.endsWith('.jsonl'));
    const [entry] = fs.readFileSync(path.join(directory, file), 'utf8').trim().split('\n').map(JSON.parse);
    expect(entry).toMatchObject({ process: 'astro', event: 'process_started', component: 'runtime', port: 54322 });
    expect(entry.timestamp).toBeTruthy();
  });

  it('redacts contact details, secrets and server paths before writing', async () => {
    const directory = temporaryDirectory();
    const logger = createStructuredLogger('astro', { directory, retentionDays: 30, level: 'info' });
    logger.error('contact_delivery_failed', {
      email: 'anna@example.com',
      phone: '+48 500 600 700',
      smtp: 'secret',
      archivePath: '/home/ixtnzfseqk/private.zip',
      error: new Error('Cannot send to anna@example.com from /home/ixtnzfseqk/app'),
    });
    await logger.close();

    const [file] = fs.readdirSync(directory).filter((entry) => entry.endsWith('.jsonl'));
    const contents = fs.readFileSync(path.join(directory, file), 'utf8');
    expect(contents).not.toContain('anna@example.com');
    expect(contents).not.toContain('500 600 700');
    expect(contents).not.toContain('/home/ixtnzfseqk');
    expect(contents).toContain('[REDACTED]');
  });

  it('uses a 30-day retention default and accepts an explicit valid level', () => {
    expect(getLoggingConfig({ LOG_RETENTION_DAYS: '30', LOG_LEVEL: 'warn' }, 'C:/app')).toMatchObject({
      retentionDays: 30,
      level: 'warn',
      directory: path.resolve('C:/app', 'logs'),
    });
    expect(__private__.sanitiseContext({ message: 'private' })).toEqual({ message: '[REDACTED]' });
  });
});
