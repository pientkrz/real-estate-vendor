import { sendContactEmail } from '../../server/mailer';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 5;
const requestLog = new Map();

function isRateLimited(ip) {
  const now = Date.now();
  const timestamps = (requestLog.get(ip) || []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  timestamps.push(now);
  requestLog.set(ip, timestamps);
  return timestamps.length > RATE_LIMIT_MAX;
}

export async function POST({ request, clientAddress }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Nieprawidłowe dane formularza.' }), { status: 400 });
  }

  const { name, email, message, website } = body;

  // Honeypot: real users never fill this hidden field.
  if (website) {
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }

  if (!name || !email || !message || !EMAIL_RE.test(email)) {
    return new Response(JSON.stringify({ error: 'Uzupełnij wymagane pola poprawnym adresem e-mail.' }), { status: 400 });
  }

  if (isRateLimited(clientAddress)) {
    return new Response(JSON.stringify({ error: 'Zbyt wiele zapytań. Spróbuj ponownie za chwilę.' }), { status: 429 });
  }

  try {
    await sendContactEmail(body);
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    console.error('[api/contact] send failed:', err.message);
    return new Response(JSON.stringify({ error: 'Nie udało się wysłać wiadomości. Spróbuj ponownie później.' }), { status: 502 });
  }
}
