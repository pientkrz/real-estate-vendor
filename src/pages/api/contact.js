import { sendContactEmail } from '../../server/mailer';
import { getLogger } from '../../server/logger.js';
import { loadConfiguredPropertyAgentEmails } from '../../server/offerService.js';
import { traceLogContext } from '../../server/traceContext.js';

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
  const telemetry = traceLogContext(locals);
  let body;
  try {
    body = await request.json();
  } catch {
    logger.warn('contact_submission_rejected', { component: 'contact', ...telemetry, reason: 'invalid-json' });
    return new Response(JSON.stringify({ error: 'Nieprawidłowe dane formularza.' }), { status: 400 });
  }

  const { name, email, message, website, source, propertyId } = body;

  // Honeypot: real users never fill this hidden field.
  if (website) {
    logger.warn('contact_submission_rejected', { component: 'contact', ...telemetry, reason: 'honeypot' });
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }

  if (!name || !email || !message || !EMAIL_RE.test(email)) {
    logger.warn('contact_submission_rejected', { component: 'contact', ...telemetry, reason: 'validation' });
    return new Response(JSON.stringify({ error: 'Uzupełnij wymagane pola poprawnym adresem e-mail.' }), { status: 400 });
  }

  if (isRateLimited(clientAddress)) {
    logger.warn('contact_submission_rejected', { component: 'contact', ...telemetry, reason: 'rate-limit' });
    return new Response(JSON.stringify({ error: 'Zbyt wiele zapytań. Spróbuj ponownie za chwilę.' }), { status: 429 });
  }

  let agentEmails = [];
  if (source === 'property-inquiry') {
    const normalizedPropertyId = typeof propertyId === 'string' ? propertyId.trim() : '';
    if (!normalizedPropertyId) {
      logger.warn('contact_submission_rejected', { component: 'contact', ...telemetry, reason: 'missing-property-id' });
      return new Response(JSON.stringify({ error: 'Nie znaleziono wskazanej oferty.' }), { status: 400 });
    }

    const configuredAgentEmails = loadConfiguredPropertyAgentEmails(normalizedPropertyId);
    if (configuredAgentEmails === undefined) {
      logger.warn('contact_submission_rejected', { component: 'contact', ...telemetry, reason: 'property-not-found' });
      return new Response(JSON.stringify({ error: 'Wskazana oferta nie jest już dostępna.' }), { status: 404 });
    }
    agentEmails = configuredAgentEmails;
  }

  try {
    const startedAt = Date.now();
    await sendContactEmail({ ...body, agentEmails, telemetry });
    logger.info('contact_email_sent', {
      component: 'contact',
      ...telemetry,
      inquiryType: body.propertyTitle ? 'property' : 'general',
      agentRecipientCount: agentEmails.length,
      durationMs: Date.now() - startedAt,
    });
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    logger.error('contact_email_failed', { component: 'contact', ...telemetry, error: err });
    return new Response(JSON.stringify({ error: 'Nie udało się wysłać wiadomości. Spróbuj ponownie później.' }), { status: 502 });
  }
}
