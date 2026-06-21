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

export const onRequest = async (_context, next) => {
  const response = await next();
  response.headers.set('Content-Security-Policy', CSP);
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  return response;
};
