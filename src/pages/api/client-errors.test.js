import { beforeEach, describe, expect, it, vi } from 'vitest';

const logger = vi.hoisted(() => ({ error: vi.fn() }));

vi.mock('../../server/logger.js', async (importOriginal) => ({
  ...(await importOriginal()),
  getLogger: () => logger,
}));

const { POST, __private__ } = await import('./client-errors.js');

const traceparent = '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01';
const report = (overrides = {}, headers = {}) => new Request('http://localhost/api/client-errors', {
  method: 'POST',
  headers: { 'content-type': 'application/json', ...headers },
  body: JSON.stringify({
    kind: 'error',
    message: 'Failed to initialise the map for anna@example.com',
    stack: 'TypeError: Failed for +48 500 600 700 at http://localhost/assets/map.js?email=anna@example.com',
    errorName: 'TypeError',
    component: 'PropertyMap',
    operation: 'leaflet.initialization',
    source: '/assets/map.js',
    release: 'abc1234',
    route: '/property/191-2',
    documentRequestId: '8f8c0e36-01ec-45f2-8f22-93ae3e4caf55',
    traceparent,
    ...overrides,
  }),
});

describe('client error reporter endpoint', () => {
  beforeEach(() => {
    logger.error.mockClear();
    __private__.requestTimes.clear();
  });

  it('records a redacted, correlated client exception and derives a fingerprint', async () => {
    const locals = { requestId: 'api-request' };
    const response = await POST({ request: report(), clientAddress: 'test-valid-client', locals });

    expect(response.status).toBe(204);
    expect(locals.traceContext.traceId).toBe('4bf92f3577b34da6a3ce929d0e0e4736');
    expect(logger.error).toHaveBeenCalledWith('client_runtime_error', expect.objectContaining({
      component: 'PropertyMap', operation: 'leaflet.initialization', release: 'abc1234',
      traceId: '4bf92f3577b34da6a3ce929d0e0e4736', requestId: 'api-request',
      errorMessage: expect.stringContaining('[REDACTED_EMAIL]'),
      errorStack: expect.stringContaining('[REDACTED_PHONE]'),
      fingerprint: expect.stringMatching(/^[a-f0-9]{24}$/),
    }));
  });

  it('rejects a report with an unsafe route, source, or traceparent before logging it', async () => {
    const response = await POST({ request: report({ route: '/?email=anna@example.com' }), clientAddress: 'test-invalid-client' });
    const malformedTrace = await POST({ request: report({ traceparent: 'not-a-trace' }), clientAddress: 'test-invalid-trace' });

    expect(response.status).toBe(400);
    expect(malformedTrace.status).toBe(400);
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('limits reports per client without retaining inactive buckets', async () => {
    for (let index = 0; index < 10; index += 1) {
      expect((await POST({ request: report(), clientAddress: 'rate-limited-client' })).status).toBe(204);
    }
    expect((await POST({ request: report(), clientAddress: 'rate-limited-client' })).status).toBe(204);
    __private__.requestTimes.set('expired-client', [0]);
    __private__.pruneRequestTimes(60_001);
    expect(__private__.requestTimes.has('expired-client')).toBe(false);
  });
});
