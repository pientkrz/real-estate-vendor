import { beforeEach, describe, expect, it, vi } from 'vitest';

const logger = vi.hoisted(() => ({ error: vi.fn() }));

vi.mock('./server/logger.js', () => ({ getLogger: () => logger }));

const { onRequest } = await import('./middleware.js');

describe('logging middleware', () => {
  beforeEach(() => logger.error.mockClear());

  it('adds a request ID and records a 5xx response', async () => {
    const context = {
      locals: {},
      request: new Request('http://localhost/property/191-2'),
      url: new URL('http://localhost/property/191-2'),
    };

    const response = await onRequest(context, async () => new Response('failed', { status: 503 }));

    expect(response.headers.get('Content-Security-Policy')).toContain("default-src 'self'");
    expect(context.locals.requestId).toMatch(/^[0-9a-f-]{36}$/);
    expect(response.headers.get('traceparent')).toMatch(/^00-[0-9a-f]{32}-[0-9a-f]{16}-01$/);
    expect(response.headers.get('X-Request-ID')).toBe(context.locals.requestId);
    expect(logger.error).toHaveBeenCalledWith('http_server_error_response', expect.objectContaining({
      requestId: context.locals.requestId,
      traceId: context.locals.traceContext.traceId,
      spanId: context.locals.traceContext.spanId,
      statusCode: 503,
    }));
  });

  it('continues an incoming W3C trace with a new local span', async () => {
    const context = {
      locals: {},
      request: new Request('http://localhost/', { headers: { traceparent: '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01' } }),
      url: new URL('http://localhost/'),
    };

    const response = await onRequest(context, async () => new Response('ok'));

    expect(context.locals.traceContext.traceId).toBe('4bf92f3577b34da6a3ce929d0e0e4736');
    expect(response.headers.get('traceparent')).toContain('4bf92f3577b34da6a3ce929d0e0e4736');
  });

  it('does not create an application log for a normal response', async () => {
    const context = {
      locals: {},
      request: new Request('http://localhost/'),
      url: new URL('http://localhost/'),
    };

    await onRequest(context, async () => new Response('ok', { status: 200 }));

    expect(logger.error).not.toHaveBeenCalled();
  });
});
