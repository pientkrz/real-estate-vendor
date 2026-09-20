import crypto from 'node:crypto';
import { getLogger } from './server/logger.js';
import { createTraceContext, traceLogContext } from './server/traceContext.js';

const logger = getLogger('astro');

const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'", // 'unsafe-inline' required for Astro hydration scripts
  "style-src 'self' 'unsafe-inline'",  // 'unsafe-inline' required for Leaflet inline styles
  "img-src 'self' data: blob: https:",  // https: covers CARTO tiles and property photo CDNs
  "font-src 'self'",
  "frame-src https://www.youtube.com https://www.youtube-nocookie.com",
  "connect-src 'self'",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
].join('; ');

export const onRequest = async (context, next) => {
  const startedAt = Date.now();
  const requestId = crypto.randomUUID();
  context.locals.requestId = requestId;
  context.locals.traceContext = createTraceContext(context.request.headers.get('traceparent'));

  try {
    const response = await next();
    response.headers.set('Content-Security-Policy', CSP);
    response.headers.set('X-Frame-Options', 'SAMEORIGIN');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
    response.headers.set('traceparent', context.locals.traceContext.traceparent);
    response.headers.set('X-Request-ID', requestId);
    if (response.status >= 500) {
      logger.error('http_server_error_response', {
        component: 'http',
        ...traceLogContext(context.locals),
        method: context.request.method,
        route: context.url.pathname,
        statusCode: response.status,
        durationMs: Date.now() - startedAt,
      });
    }
    return response;
  } catch (error) {
    logger.error('http_request_exception', {
      component: 'http',
      ...traceLogContext(context.locals),
      method: context.request.method,
      route: context.url.pathname,
      durationMs: Date.now() - startedAt,
      error,
    });
    throw error;
  }
};
