import fs from 'node:fs';
import path from 'node:path';
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const DEFAULT_RETENTION_DAYS = 30;
const DEFAULT_LEVEL = 'info';
const MAX_TEXT_LENGTH = 1_000;
const MAX_STACK_LENGTH = 4_000;
const INITIAL_WRITE_GRACE_PERIOD_MS = 100;
const MAX_QUEUED_ENTRIES = 100;
const LOGGER_LEVELS = new Set(['error', 'warn', 'info', 'debug']);
const OTEL_SEVERITY = Object.freeze({ debug: 5, info: 9, warn: 13, error: 17 });

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

const nonEmptyText = (value, fallback) => {
  const text = String(value ?? '').trim();
  return text ? sanitiseText(text, 160) : fallback;
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
    serviceName: nonEmptyText(env.OTEL_SERVICE_NAME, 'global-s-home'),
    serviceVersion: nonEmptyText(env.OTEL_SERVICE_VERSION || env.PUBLIC_APP_RELEASE, 'unknown'),
    deploymentEnvironment: nonEmptyText(env.OTEL_DEPLOYMENT_ENVIRONMENT, 'development'),
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
  const injectedTransport = config.transport;
  delete config.transport;
  fs.mkdirSync(config.directory, { recursive: true });

  const transport = injectedTransport || createTransport({ component, ...config });
  const logger = winston.createLogger({
    level: config.level,
    format: winston.format.json(),
    transports: [transport],
  });

  let closed;
  let transportReady = false;
  let transportFailed = false;
  const queuedEntries = [];
  let resolveTransportReady;
  const ready = new Promise((resolve) => { resolveTransportReady = resolve; });
  const markTransportReady = () => {
    if (transportReady) return;
    transportReady = true;
    if (!transportFailed) queuedEntries.splice(0).forEach((entry) => logger.log(entry));
    else queuedEntries.splice(0);
    resolveTransportReady();
  };
  transport.once('new', markTransportReady);
  const handleTransportError = () => {
    transportFailed = true;
    markTransportReady();
  };
  transport.on('error', handleTransportError);
  // Winston can surface a transport failure through the logger as well. The
  // application must keep serving requests even when a disk write is lost.
  logger.on('error', handleTransportError);
  // DailyRotateFile may create its initial file synchronously, before the
  // listener above is attached. A short fallback keeps one-shot CLI and
  // supervisor logs from ending their Winston stream before that file opens.
  setTimeout(markTransportReady, 25);

  const writeEntry = (entry) => {
    if (transportFailed) return;
    if (transportReady) {
      try {
        logger.log(entry);
      } catch {
        handleTransportError();
      }
    } else if (queuedEntries.length < MAX_QUEUED_ENTRIES) {
      queuedEntries.push(entry);
    }
  };
  const write = (level, event, context = {}) => {
    const timestamp = new Date().toISOString();
    const attributes = {
      'event.name': sanitiseText(event, 160),
      'process.component': component,
      ...sanitiseContext(context),
    };
    writeEntry({
      level,
      event: sanitiseText(event, 160),
      message: sanitiseText(event, 160),
      timestamp,
      observedTimestamp: new Date().toISOString(),
      severityText: level.toUpperCase(),
      severityNumber: OTEL_SEVERITY[level],
      body: sanitiseText(event, 160),
      resource: {
        'service.name': config.serviceName,
        'service.version': config.serviceVersion,
        'deployment.environment.name': config.deploymentEnvironment,
        'process.component': component,
        'process.pid': process.pid,
      },
      attributes,
      application: 'new-global-s-home',
      process: component,
      pid: process.pid,
      ...attributes,
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
  const key = `${component}\0${config.directory}\0${config.level}\0${config.retentionDays}\0${config.serviceVersion}\0${config.deploymentEnvironment}`;
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
  OTEL_SEVERITY,
};
