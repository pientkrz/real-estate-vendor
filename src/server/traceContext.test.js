import { describe, expect, it } from 'vitest';
import { createTraceContext, formatTraceparent, parseTraceparent } from './traceContext.js';

const incoming = '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01';

describe('W3C trace context', () => {
  it('retains a valid trace ID and creates a local span', () => {
    const context = createTraceContext(incoming);

    expect(context.traceId).toBe('4bf92f3577b34da6a3ce929d0e0e4736');
    expect(context.parentSpanId).toBe('00f067aa0ba902b7');
    expect(context.spanId).toMatch(/^[0-9a-f]{16}$/);
    expect(context.spanId).not.toBe(context.parentSpanId);
    expect(context.traceparent).toBe(formatTraceparent(context));
  });

  it('rejects malformed and all-zero traceparents', () => {
    expect(parseTraceparent('not-a-trace')).toBeUndefined();
    expect(parseTraceparent('00-00000000000000000000000000000000-00f067aa0ba902b7-01')).toBeUndefined();
    expect(createTraceContext('invalid').traceId).toMatch(/^[0-9a-f]{32}$/);
  });
});
