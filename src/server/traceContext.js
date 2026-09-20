import crypto from 'node:crypto';

const TRACEPARENT_RE = /^00-([0-9a-f]{32})-([0-9a-f]{16})-([0-9a-f]{2})$/;
const ALL_ZERO_TRACE_ID = '00000000000000000000000000000000';
const ALL_ZERO_SPAN_ID = '0000000000000000';

const randomHex = (bytes) => crypto.randomBytes(bytes).toString('hex');

export const parseTraceparent = (value) => {
  if (typeof value !== 'string') return undefined;
  const match = TRACEPARENT_RE.exec(value);
  if (!match) return undefined;

  const [, traceId, parentSpanId, traceFlags] = match;
  if (traceId === ALL_ZERO_TRACE_ID || parentSpanId === ALL_ZERO_SPAN_ID) return undefined;
  return { traceId, parentSpanId, traceFlags };
};

export const formatTraceparent = ({ traceId, spanId, traceFlags = '01' }) => (
  `00-${traceId}-${spanId}-${traceFlags}`
);

/** Creates this process' span while retaining a valid incoming trace ID. */
export const createTraceContext = (traceparent) => {
  const incoming = parseTraceparent(traceparent);
  const traceId = incoming?.traceId ?? randomHex(16);
  const spanId = randomHex(8);
  const traceFlags = incoming?.traceFlags ?? '01';

  return {
    traceId,
    spanId,
    parentSpanId: incoming?.parentSpanId,
    traceFlags,
    traceparent: formatTraceparent({ traceId, spanId, traceFlags }),
  };
};

export const traceLogContext = (locals = {}) => {
  const trace = locals.traceContext;
  return {
    requestId: locals.requestId,
    traceId: trace?.traceId,
    spanId: trace?.spanId,
    traceFlags: trace?.traceFlags,
  };
};

export const __private__ = { randomHex, TRACEPARENT_RE };
