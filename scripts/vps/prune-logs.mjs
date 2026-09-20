#!/usr/bin/env node

import { pruneApplicationLogs } from '../../src/server/logRetention.js';
import { getLogger, getLoggingConfig } from '../../src/server/logger.js';

const logger = getLogger('supervisor');
const config = getLoggingConfig();

try {
  const report = pruneApplicationLogs(config);
  logger.info('log_retention_completed', { component: 'retention', ...report, retentionDays: config.retentionDays });
} catch (error) {
  logger.error('log_retention_failed', { component: 'retention', error });
  process.exitCode = 1;
} finally {
  await logger.close();
}
