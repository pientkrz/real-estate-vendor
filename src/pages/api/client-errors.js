import { getLogger } from '../../server/logger.js';

const WINDOW_MS = 60_000;
const MAX_REPORTS_PER_WINDOW = 10;
const MAX_BODY_BYTES = 8_192;
const requestTimes = new Map();
const logger = getLogger('astro');

const isRateLimited = (clientAddress) => {
  const now = Date.now();
  const prior = (requestTimes.get(clientAddress) || []).filter((timestamp) => now - timestamp < WINDOW_MS);
  prior.push(now);
  requestTimes.set(clientAddress, prior);
  return prior.length > MAX_REPORTS_PER_WINDOW;
};

const validText = (value, maximumLength) => (
  typeof value === 'string' && value.length > 0 && value.length <= maximumLength
);

const validErrorName = (value) => (
  validText(value, 120) && /^[A-Za-z][A-Za-z0-9_.-]*$/.test(value)
);

const safeRoute = (value) => {
  if (!validText(value, 500) || !value.startsWith('/') || value.includes('?') || value.includes('#')) return undefined;
  return value;
};

/** Receive only a small, schema-limited browser exception report. */
export async function POST({ request, clientAddress }) {
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

  if (!['error', 'unhandledrejection'].includes(body?.kind)
    || !validText(body?.message, 1_000)
    || !safeRoute(body?.route)
    || (body.requestId !== undefined && !validText(body.requestId, 100))
    || (body.errorName !== undefined && !validErrorName(body.errorName))) {
    return new Response(null, { status: 400 });
  }

  logger.error('client_runtime_error', {
    component: 'browser',
    requestId: body.requestId,
    kind: body.kind,
    errorName: body.errorName || 'Error',
    errorCode: 'browser-runtime-error',
    route: body.route,
  });
  return new Response(null, { status: 204 });
}
