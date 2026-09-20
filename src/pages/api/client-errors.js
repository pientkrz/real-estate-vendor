import crypto from 'node:crypto';
import { __private__ as loggerPrivate, getLogger } from '../../server/logger.js';
import { createTraceContext, parseTraceparent, traceLogContext } from '../../server/traceContext.js';

const WINDOW_MS = 60_000;
const MAX_REPORTS_PER_WINDOW = 10;
const MAX_BODY_BYTES = 12_288;
const requestTimes = new Map();
const logger = getLogger('astro');

const pruneRequestTimes = (now) => {
  for (const [client, timestamps] of requestTimes) {
    const active = timestamps.filter((timestamp) => now - timestamp < WINDOW_MS);
    if (active.length) requestTimes.set(client, active);
    else requestTimes.delete(client);
  }
};

const isRateLimited = (clientAddress) => {
  const now = Date.now();
  pruneRequestTimes(now);
  const client = typeof clientAddress === 'string' && clientAddress ? clientAddress : 'unknown';
  const timestamps = requestTimes.get(client) || [];
  timestamps.push(now);
  requestTimes.set(client, timestamps);
  return timestamps.length > MAX_REPORTS_PER_WINDOW;
};

const validText = (value, maximumLength) => (
  typeof value === 'string' && value.length > 0 && value.length <= maximumLength
);

const validIdentifier = (value, maximumLength = 120) => (
  validText(value, maximumLength) && /^[A-Za-z][A-Za-z0-9_.:-]*$/.test(value)
);

const validRelease = (value) => (
  validText(value, 128) && /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(value)
);

const safePath = (value) => {
  if (!validText(value, 500) || !value.startsWith('/') || value.startsWith('//') || value.includes('?') || value.includes('#')) return undefined;
  return value;
};

const fingerprintFor = ({ errorName, component, operation, source, message }) => {
  const fields = loggerPrivate.sanitiseContext({ errorName, component, operation, source });
  const canonical = [fields.errorName, fields.component, fields.operation, fields.source || '', loggerPrivate.sanitiseText(message, 500)]
    .map((value) => String(value ?? ''))
    .join('\n');
  return crypto.createHash('sha256').update(canonical).digest('hex').slice(0, 24);
};

/** Receive only a small, schema-limited and redacted browser exception report. */
export async function POST({ request, clientAddress, locals = {} }) {
  const contentLength = Number(request.headers.get('content-length'));
  if (Number.isSafeInteger(contentLength) && contentLength > MAX_BODY_BYTES) {
    return new Response(null, { status: 413 });
  }
  if (isRateLimited(clientAddress)) return new Response(null, { status: 204 });

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(null, { status: 400 });
  }

  const headerTraceparent = request.headers.get('traceparent') || undefined;
  const bodyTraceparent = body?.traceparent;
  if (!['error', 'unhandledrejection'].includes(body?.kind)
    || !validText(body?.message, 500)
    || !safePath(body?.route)
    || !validIdentifier(body?.component)
    || !validIdentifier(body?.operation)
    || !validRelease(body?.release)
    || (body.documentRequestId !== undefined && !validText(body.documentRequestId, 100))
    || (body.errorName !== undefined && !validIdentifier(body.errorName))
    || (body.source !== undefined && !safePath(body.source))
    || (body.stack !== undefined && !validText(body.stack, 2_000))
    || (bodyTraceparent !== undefined && !parseTraceparent(bodyTraceparent))
    || (headerTraceparent !== undefined && !parseTraceparent(headerTraceparent))
    || (headerTraceparent && bodyTraceparent && headerTraceparent !== bodyTraceparent)) {
    return new Response(null, { status: 400 });
  }

  // sendBeacon cannot add request headers, so only its body may establish the
  // report trace. A normal fetch was already correlated by middleware.
  if (bodyTraceparent && !headerTraceparent) locals.traceContext = createTraceContext(bodyTraceparent);
  if (!locals.traceContext) locals.traceContext = createTraceContext(headerTraceparent);

  const fingerprint = fingerprintFor({
    errorName: body.errorName || 'Error',
    component: body.component,
    operation: body.operation,
    source: body.source,
    message: body.message,
  });
  const errorMessage = loggerPrivate.sanitiseText(body.message, 500);
  const errorStack = body.stack ? loggerPrivate.sanitiseText(body.stack, 2_000) : undefined;
  logger.error('client_runtime_error', {
    component: body.component,
    operation: body.operation,
    ...traceLogContext(locals),
    documentRequestId: body.documentRequestId,
    kind: body.kind,
    errorName: body.errorName || 'Error',
    errorCode: 'browser-runtime-error',
    errorMessage,
    errorStack,
    source: body.source,
    release: body.release,
    route: body.route,
    fingerprint,
  });
  return new Response(null, { status: 204 });
}

export const __private__ = { fingerprintFor, isRateLimited, pruneRequestTimes, requestTimes };
