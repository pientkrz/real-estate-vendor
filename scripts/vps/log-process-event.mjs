#!/usr/bin/env node

import { getLogger } from '../../src/server/logger.js';

const [level = 'info', event = 'supervisor_event', ...pairs] = process.argv.slice(2);
const safeLevel = ['debug', 'info', 'warn', 'error'].includes(level) ? level : 'info';
const context = { component: 'supervisor' };

for (const pair of pairs) {
  const separator = pair.indexOf('=');
  if (separator <= 0) continue;
  const key = pair.slice(0, separator);
  const value = pair.slice(separator + 1);
  context[key] = value;
}

const logger = getLogger('supervisor');
logger[safeLevel](event, context);
await logger.close();
