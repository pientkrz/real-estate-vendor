import fs from 'node:fs';
import path from 'node:path';
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const DEFAULT_RETENTION_DAYS = 30;
const DEFAULT_LEVEL = 'info';
const MAX_TEXT_LENGTH = 1_000;
const MAX_STACK_LENGTH = 4_000;
const INITIAL_WRITE_GRACE_PERIOD_MS = 100;
const LOGGER_LEVELS = new Set(['error', 'warn', 'info', 'debug']);

const SENSITIVE_CONTEXT_KEYS = new Set([
  'name',
  'email',
  'phone',
  'message',
  'password',
  'pass',
  'token',
  'authorization',
  'cookie',
  'secret',
  'smtp',
  'ip',
  'clientaddress',
  'archivepath',
  'filepath',
  'path',
  'payload',
  'body',
  'headers',
]);

const cachedLoggers = new Map();
const noopLogger = Object.freeze({
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
  close: async () => {},
});

const positiveInteger = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const sanitiseText = (value, maximumLength = MAX_TEXT_LENGTH) => String(value ?? '')
  .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[REDACTED_EMAIL]')
  .replace(/(?:\+?\d[\d\s().-]{7,}\d)/g, '[REDACTED_PHONE]')
  .replace(/(?:[A-Za-z]:[\\/]|\/home\/|file:\/\/)[^\s\n)]+/g, '[REDACTED_PATH]')
  .slice(0, maximumLength);

const sanitiseError = (error) => {
  if (!(error instanceof Error) && (!error || typeof error !== 'object')) {
    return { errorName: 'NonError', errorMessage: sanitiseText(error) };
  }

  return {
    errorName: sanitiseText(error.name || 'Error', 120),
    errorCode: typeof error.code === 'string' ? sanitiseText(error.code, 120) : undefined,
    errorMessage: sanitiseText(error.message),
    errorStack: error.stack ? sanitiseText(error.stack, MAX_STACK_LENGTH) : undefined,
  };
};

const sanitiseValue = (value, key = '', depth = 0) => {
  if (SENSITIVE_CONTEXT_KEYS.has(String(key).toLowerCase())) return '[REDACTED]';
  if (value instanceof Error) return sanitiseError(value);
  if (value === null || value === undefined || typeof value === 'boolean' || typeof value === 'number') return value;
  if (typeof value === 'string') return sanitiseText(value);
  if (depth >= 3) return '[TRUNCATED]';
  if (Array.isArray(value)) return value.slice(0, 20).map((entry) => sanitiseValue(entry, '', depth + 1));
  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).slice(0, 30).map(([entryKey, entryValue]) => [
        entryKey,
        sanitiseValue(entryValue, entryKey, depth + 1),
      ]),
    );
  }
  return sanitiseText(value);
};

const sanitiseContext = (context) => Object.fromEntries(
  Object.entries(context || {}).flatMap(([key, value]) => {
    if (key === 'error') return Object.entries(sanitiseError(value));
    return [[key, sanitiseValue(value, key)]];
  }).filter(([, value]) => value !== undefined),
);

export const getLoggingConfig = (env = process.env, cwd = process.cwd()) => {
  const directory = path.resolve(env.LOG_DIRECTORY || path.join(cwd, 'logs'));
  const level = LOGGER_LEVELS.has(env.LOG_LEVEL) ? env.LOG_LEVEL : DEFAULT_LEVEL;
  return {
    directory,
    level,
    retentionDays: positiveInteger(env.LOG_RETENTION_DAYS, DEFAULT_RETENTION_DAYS),
  };
};

const createTransport = ({ component, directory, retentionDays }) => new DailyRotateFile({
  dirname: directory,
  filename: `${component}-%DATE%.jsonl`,
  datePattern: 'YYYY-MM-DD',
  maxFiles: `${retentionDays}d`,
  auditFile: path.join(directory, `.${component}-rotation-audit.json`),
  utc: true,
  extension: '',
});

/**
 * Structured, file-backed logger for one runtime process. Context is always
 * sanitised before Winston serialises it, so call sites must never need to
 * choose between observability and protecting contact data.
 */
export const createStructuredLogger = (component, options = {}) => {
  const config = {
    ...getLoggingConfig(options.env, options.cwd),
    ...options,
  };
  delete config.env;
  delete config.cwd;
  fs.mkdirSync(config.directory, { recursive: true });

  const transport = createTransport({ component, ...config });
  const logger = winston.createLogger({
    level: config.level,
    defaultMeta: {
      application: 'new-global-s-home',
      process: component,
      pid: process.pid,
    },
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json(),
    ),
    transports: [transport],
  });

  let closed;
  let transportReady = false;
  const queuedEntries = [];
  let resolveTransportReady;
  const ready = new Promise((resolve) => { resolveTransportReady = resolve; });
  const markTransportReady = () => {
    if (transportReady) return;
    transportReady = true;
    queuedEntries.splice(0).forEach((entry) => logger.log(entry));
    resolveTransportReady();
  };
  transport.once('new', markTransportReady);
  transport.once('error', markTransportReady);
  // DailyRotateFile may create its initial file synchronously, before the
  // listener above is attached. A short fallback keeps one-shot CLI and
  // supervisor logs from ending their Winston stream before that file opens.
  setTimeout(markTransportReady, 25);

  const writeEntry = (entry) => {
    if (transportReady) logger.log(entry);
    else queuedEntries.push(entry);
  };
  const write = (level, event, context = {}) => {
    writeEntry({
      level,
      event: sanitiseText(event, 160),
      message: sanitiseText(event, 160),
      ...sanitiseContext(context),
    });
  };

  return {
    debug: (event, context) => write('debug', event, context),
    info: (event, context) => write('info', event, context),
    warn: (event, context) => write('warn', event, context),
    error: (event, context) => write('error', event, context),
    close: () => {
      if (closed) return closed;
      closed = (async () => {
        await ready;
        // DailyRotateFile opens its underlying file asynchronously. Give its
        // initial stream one short turn before ending a one-shot logger.
        await new Promise((resolve) => setTimeout(resolve, INITIAL_WRITE_GRACE_PERIOD_MS));
        await new Promise((resolve) => {
          logger.once('finish', resolve);
          logger.end();
        });
      })();
      return closed;
    },
    transport,
  };
};

export const getLogger = (component = process.env.LOG_PROCESS || 'astro') => {
  // Focused logger tests use createStructuredLogger directly. Suppress the
  // application-wide singleton during Vitest so ordinary unit tests never
  // create a repository-local runtime log directory.
  if (process.env.VITEST) return noopLogger;
  const config = getLoggingConfig();
  const key = `${component}\0${config.directory}\0${config.level}\0${config.retentionDays}`;
  if (!cachedLoggers.has(key)) cachedLoggers.set(key, createStructuredLogger(component, config));
  return cachedLoggers.get(key);
};

/** Register only in an executable process entrypoint, never an Astro module. */
export const registerProcessErrorLogging = (logger, component) => {
  let exiting = false;
  const exitAfterFlush = async (event, error) => {
    if (exiting) return;
    exiting = true;
    logger.error(event, { component, error });
    await logger.close();
    process.exit(1);
  };

  process.once('SIGTERM', () => logger.info('process_stopping', { component, signal: 'SIGTERM' }));
  process.once('SIGINT', () => logger.info('process_stopping', { component, signal: 'SIGINT' }));
  process.on('uncaughtException', (error) => { void exitAfterFlush('process_uncaught_exception', error); });
  process.on('unhandledRejection', (error) => { void exitAfterFlush('process_unhandled_rejection', error); });
};

export const __private__ = {
  sanitiseContext,
  sanitiseError,
  sanitiseText,
};
