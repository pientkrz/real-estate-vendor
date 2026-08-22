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
    expect(logger.error).toHaveBeenCalledWith('http_server_error_response', expect.objectContaining({
      requestId: context.locals.requestId,
      statusCode: 503,
    }));
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
