import { beforeEach, describe, expect, it, vi } from 'vitest';

const logger = vi.hoisted(() => ({ error: vi.fn() }));

vi.mock('../../server/logger.js', () => ({ getLogger: () => logger }));

const { POST } = await import('./client-errors.js');

const report = (overrides = {}) => new Request('http://localhost/api/client-errors', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    kind: 'error',
    message: 'browser-runtime-error',
    errorName: 'TypeError',
    route: '/property/191-2',
    requestId: '8f8c0e36-01ec-45f2-8f22-93ae3e4caf55',
    ...overrides,
  }),
});

describe('client error reporter endpoint', () => {
  beforeEach(() => logger.error.mockClear());

  it('records only a schema-limited client exception', async () => {
    const response = await POST({ request: report(), clientAddress: 'test-valid-client' });

    expect(response.status).toBe(204);
    expect(logger.error).toHaveBeenCalledWith('client_runtime_error', expect.objectContaining({
      component: 'browser',
      route: '/property/191-2',
      requestId: '8f8c0e36-01ec-45f2-8f22-93ae3e4caf55',
    }));
  });

  it('rejects a report with a URL query before logging it', async () => {
    const response = await POST({ request: report({ route: '/?email=anna@example.com' }), clientAddress: 'test-invalid-client' });

    expect(response.status).toBe(400);
    expect(logger.error).not.toHaveBeenCalled();
  });
});
