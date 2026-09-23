#!/usr/bin/env node

import { getLogger, registerProcessErrorLogging } from '../../src/server/logger.js';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

process.env.LOG_PROCESS = 'astro';
const logger = getLogger('astro');
registerProcessErrorLogging(logger, 'astro');

logger.info('process_starting', {
  component: 'runtime',
  nodeVersion: process.version,
  port: process.env.PORT,
});

try {
  const entryFile = process.env.ASTRO_ENTRY_FILE
    || path.resolve(process.cwd(), 'dist/server/entry.mjs');
  await import(pathToFileURL(entryFile).href);
  logger.info('process_started', { component: 'runtime', port: process.env.PORT });
} catch (error) {
  logger.error('process_start_failed', { component: 'runtime', error });
  await logger.close();
  process.exitCode = 1;
}
