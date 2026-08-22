import { sendContactEmail } from '../../server/mailer';
import { getLogger } from '../../server/logger.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 5;
const requestLog = new Map();
const logger = getLogger('astro');

function isRateLimited(ip) {
  const now = Date.now();
  const timestamps = (requestLog.get(ip) || []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  timestamps.push(now);
  requestLog.set(ip, timestamps);
  return timestamps.length > RATE_LIMIT_MAX;
}

export async function POST({ request, clientAddress, locals }) {
  const requestId = locals.requestId;
  let body;
  try {
    body = await request.json();
  } catch {
    logger.warn('contact_submission_rejected', { component: 'contact', requestId, reason: 'invalid-json' });
    return new Response(JSON.stringify({ error: 'Nieprawidłowe dane formularza.' }), { status: 400 });
  }

  const { name, email, message, website } = body;

  // Honeypot: real users never fill this hidden field.
  if (website) {
    logger.warn('contact_submission_rejected', { component: 'contact', requestId, reason: 'honeypot' });
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }

  if (!name || !email || !message || !EMAIL_RE.test(email)) {
    logger.warn('contact_submission_rejected', { component: 'contact', requestId, reason: 'validation' });
    return new Response(JSON.stringify({ error: 'Uzupełnij wymagane pola poprawnym adresem e-mail.' }), { status: 400 });
  }

  if (isRateLimited(clientAddress)) {
    logger.warn('contact_submission_rejected', { component: 'contact', requestId, reason: 'rate-limit' });
    return new Response(JSON.stringify({ error: 'Zbyt wiele zapytań. Spróbuj ponownie za chwilę.' }), { status: 429 });
  }

  try {
    const startedAt = Date.now();
    await sendContactEmail(body);
    logger.info('contact_email_sent', {
      component: 'contact',
      requestId,
      inquiryType: body.propertyTitle ? 'property' : 'general',
      durationMs: Date.now() - startedAt,
    });
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    logger.error('contact_email_failed', { component: 'contact', requestId, error: err });
    return new Response(JSON.stringify({ error: 'Nie udało się wysłać wiadomości. Spróbuj ponownie później.' }), { status: 502 });
  }
}
