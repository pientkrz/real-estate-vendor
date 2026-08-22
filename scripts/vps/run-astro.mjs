#!/usr/bin/env node

import { getLogger, registerProcessErrorLogging } from '../../src/server/logger.js';

process.env.LOG_PROCESS = 'astro';
const logger = getLogger('astro');
registerProcessErrorLogging(logger, 'astro');

logger.info('process_starting', {
  component: 'runtime',
  nodeVersion: process.version,
  port: process.env.PORT,
});

try {
  await import('../../server/entry.mjs');
  logger.info('process_started', { component: 'runtime', port: process.env.PORT });
} catch (error) {
  logger.error('process_start_failed', { component: 'runtime', error });
  await logger.close();
  process.exitCode = 1;
}
